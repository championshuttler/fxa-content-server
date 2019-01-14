/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


import OAuthErrors from '../../../lib/oauth-errors';
import OAuthRelier from '../oauth';
import Vat from '../../../lib/vat';
import _ from "underscore";

/*eslint-disable camelcase, sorting/sort-object-props*/
var SUPPLICANT_QUERY_PARAM_SCHEMA = {
  access_type: Vat.accessType().renameTo('accessType'),
  client_id: Vat.clientId().required().renameTo('clientId'),
  code_challenge: Vat.codeChallenge().required().renameTo('codeChallenge'),
  code_challenge_method: Vat.codeChallengeMethod().required().renameTo('codeChallengeMethod'),
  keys_jwk: Vat.keysJwk().required().renameTo('keysJwk'),
  redirect_uri: Vat.url().required().renameTo('redirectUri'),
  scope: Vat.string().required().min(1),
  state: Vat.string().required()
};

const SUPPLICANT_HASH_PARAMETER_SCHEMA = {
  channel_id: Vat.channelId().required().renameTo('channelId'),
  channel_key: Vat.channelKey().required().renameTo('channelKey')
};


function scopeStrToArray(scopes) {
  if (! _.isString) {
    return [];
  }

  var trimmedScopes = scopes.trim();
  if (trimmedScopes.length) {
    // matches any whitespace character OR matches the character '+' literally
    return _.uniq(scopes.split(/\s+|\++/g));
  } else {
    return [];
  }
}

/*eslint-enable camelcase, sorting/sort-object-props*/

export default class SupplicantRelier extends OAuthRelier {
  fetch () {
    return Promise.resolve().then(() => {
      this.importHashParamsUsingSchema(SUPPLICANT_HASH_PARAMETER_SCHEMA, OAuthErrors);
      this.importSearchParamsUsingSchema(SUPPLICANT_QUERY_PARAM_SCHEMA, OAuthErrors);
      return this._setupOAuthRPInfo();
    });
  }



  getPKCEParams () {
    const scopes = scopeStrToArray(this.get('scope')).join(' ');

    return {
      /*eslint-disable camelcase*/
      access_type: this.get('accessType'),
      client_id: this.get('clientId'),
      code_challenge: this.get('codeChallenge'),
      code_challenge_method: this.get('codeChallengeMethod'),
      keys_jwk: this.get('keysJwk'),
      scope: scopes,
      state: this.get('state'),
      /*eslint-enable camelcase*/
    };
  }

  validateApprovalData (approvalData) {
    const { code, state } = approvalData;

    // TODO - Maybe use Transform instead of direct checks like this.

    if (Vat.oauthCode().validate(code).error) {
      throw OAuthErrors.toInvalidParameterError('code');
    }

    if (state !== this.get('state')) {
      throw OAuthErrors.toInvalidParameterError('state');
    }
  }
}