import { AdditionalParameters, TokenResponse } from '../../types/KindeSDK';
import KindeSDK from '../KindeSDK';
import Storage from '../Storage';
import {
    OpenWebInApp,
    isAdditionalParameters,
    additionalParametersToLoginMethodParams,
    generateChallenge,
    generateRandomString
} from '../Utils';
import { AuthBrowserOptions } from '../../types/Auth';
import {
    generateAuthUrl,
    IssuerRouteTypes,
    LoginMethodParams,
    PromptTypes,
    sanitizeUrl,
    Scopes
} from '@kinde/js-utils';

class AuthorizationCode {
    /**
     * It opens the login page in the browser.
     * @param {KindeSDK} kindSDK - The KindeSDK instance
     * @param {boolean} [usePKCE=false] - boolean = false
     * @param {'login' | 'registration' | 'none'} startPage - The start page type
     * @param {AdditionalParameters} additionalParameters - AdditionalParameters = {}
     * @returns A promise that resolves when the URL is opened.
     */
    async authenticate(
        kindeSDK: KindeSDK,
        startPage: 'login' | 'registration' | 'none',
        additionalParameters: LoginMethodParams | AdditionalParameters,
        options?: AuthBrowserOptions
    ): Promise<TokenResponse | null> {
        // Map additional parameters to the correct format of LoginOptions
        if (isAdditionalParameters(additionalParameters)) {
            additionalParameters =
                additionalParametersToLoginMethodParams(additionalParameters);
        }

        let prompt: PromptTypes;
        switch (startPage) {
            case 'login':
                prompt = PromptTypes.login;
                break;
            case 'registration':
                prompt = PromptTypes.create;
                break;
            case 'none':
                prompt = PromptTypes.none;
                break;
        }

        const { codeChallenge, codeVerifier, state } = generateChallenge();
        const nonce = generateRandomString();
        const params = {
            ...(additionalParameters as LoginMethodParams),
            prompt,
            clientId: kindeSDK.clientId,
            redirectURL: kindeSDK.redirectUri,
            scope: kindeSDK.scope.split(' ') as Scopes[],
            codeChallenge,
            nonce,
            state,
            codeChallengeMethod: 'S256'
        };

        const authUrl = await generateAuthUrl(
            kindeSDK.issuer,
            startPage === 'login'
                ? IssuerRouteTypes.login
                : IssuerRouteTypes.register,
            params
        );

        Storage.setState(state);
        Storage.setCodeVerifier(codeVerifier);
        Storage.setNonce(nonce);
        Storage.setCodeChallenge(codeChallenge);

        return OpenWebInApp(
            sanitizeUrl(authUrl.url.toString()),
            kindeSDK,
            options
        );
    }
}

export default AuthorizationCode;
