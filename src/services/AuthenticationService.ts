import {DecodedJwt} from "../models";
import {authenticate, AuthenticatorType} from "./skalioId/auth";
import environmentService from "./EnvironmentService";
import configService from "./ConfigService";
import {TOTP} from "otpauth";
import {ITokenStorage, tokenStorage} from "./ITokenStorage";
import {ServiceLocator} from "./ServiceLocator";

class AuthenticationService {
    // private storageService: ITokenStorage;
    private totp: TOTP | null = null;

    constructor() {
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

    public async fetchIdToken() {
        let decodedJwt: DecodedJwt = await authenticate(
            environmentService.getBaseUrl(),
            <string>configService.getEmail(),
            AuthenticatorType.bcrypt,
            <string>configService.getPassword(),
            null
        );

        if (decodedJwt.isMfaToken()) {
            console.debug("Multi-factor authentication is required");

            decodedJwt = await authenticate(
                environmentService.getBaseUrl(),
                <string>configService.getEmail(),
                AuthenticatorType.totp,
                this.getOneTimeKey(),
                decodedJwt.token
            );
        }
        const storageService = ServiceLocator.get<ITokenStorage>(tokenStorage);

        storageService.persistToken(decodedJwt.token);

        console.info("Authentication successful! Subject: ", decodedJwt.getSubject());
    }

}

export default new AuthenticationService();