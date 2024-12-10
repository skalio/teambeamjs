import {DecodedJwt} from "../models";
import {authenticate, AuthenticatorType, getAccessToken} from "./skalioId/auth";
import environmentService from "./EnvironmentService";
import configService from "./ConfigService";
import {TOTP} from "otpauth";

class AccessService {
    private idToken: DecodedJwt | null = null;
    private accessToken: DecodedJwt | null = null;
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

    public async getIdToken(): Promise<string> {
        while (!this.idToken || !this.idToken.isValid()) {
            await this.fetchIdToken();
        }

        return this.idToken.token;
    }

    public async getAccessToken(): Promise<string> {
        while (!this.accessToken || !this.accessToken.isValid()) {
            await this.fetchAccessToken();
        }

        return this.accessToken.token;
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

    private async fetchAccessToken() {
        while (!this.idToken || !this.idToken.isValid()) {
            await this.fetchIdToken();
        }

        console.debug("Access token missing or expired; fetching a new one");
        this.accessToken = await getAccessToken(environmentService.getBaseUrl(), this.idToken.token);
        console.debug("Fetched a new access token");
    }
}

export default new AccessService();