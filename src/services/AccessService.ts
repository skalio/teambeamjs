import {DecodedJwt} from "../models";
import {getAccessToken} from "./skalioId/auth";
import environmentService from "./EnvironmentService";
import type {ITokenStorage} from "./ITokenStorage";
import serviceLocator from "./ServiceLocator";
import * as symbols from "./symbols"

export class AccessService {
    private storageService: ITokenStorage;
    private accessToken: DecodedJwt | null = null;

    constructor() {
        this.storageService = serviceLocator.get<ITokenStorage>(symbols.tokenStorage);
    }

    public async getAccessToken(): Promise<string> {
        while (!this.accessToken || !this.accessToken.isValid()) {
            await this.fetchAccessToken();
        }

        return this.accessToken.token;
    }

    private async fetchAccessToken() {
        // const storageService = serviceLocator.get<ITokenStorage>(tokenStorage);
        const tokenString = this.storageService.fetchToken();
        if (!tokenString) {
            throw new Error("Missing ID token");
        }
        const idToken = new DecodedJwt(tokenString);
        while (!idToken.isValid()) {
            throw new Error("Token has expired.");
        }

        console.debug("Access token missing or expired; fetching a new one");
        this.accessToken = await getAccessToken(environmentService.getBaseUrl(), idToken.token);
        console.debug("Fetched a new access token");
    }
}