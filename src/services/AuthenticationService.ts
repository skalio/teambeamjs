import {DecodedJwt} from "../models";
import {authenticate, AuthenticatorType} from "./skalioId/auth";
import environmentService from "./EnvironmentService";
import configService from "./ConfigService";
import {TOTP} from "otpauth";
import {ITokenStorage, tokenStorage} from "./ITokenStorage";

class AccessService {
    private tokenStorage: ITokenStorage;
    private totp: TOTP | null = null;

    constructor() {
        this.tokenStorage = ServiceLocator.get(tokenStorage);
    }

    getOneTimeKey() {
        if (!configService.getTotpSecret()) {
            throw new Error("No TOTP Secret configured");
        }
        if (!this.totp) {
            this.totp = new TOTP({
                secret: <string>configService.getTotpSecret()
            });
        }
        return this.totp.generate();
    }

    private async fetchIdToken() {
        console.debug("ID token missing or invalid; attempting authentication");

        let token: DecodedJwt = await authenticate(
            environmentService.getBaseUrl(),
            <string>configService.getEmail(),
            AuthenticatorType.bcrypt,
            <string>configService.getPassword(),
            null
        );

        if (token.isMfaToken()) {
            console.debug("Multi-factor authentication is required");

            token = await authenticate(
                environmentService.getBaseUrl(),
                <string>configService.getEmail(),
                AuthenticatorType.totp,
                this.getOneTimeKey(),
                token.token
            );
        }
        this.idToken = token;

        console.info("Authentication successful! Subject: ", this.idToken.getSubject());
    }

}

export default new AuthenticationService();