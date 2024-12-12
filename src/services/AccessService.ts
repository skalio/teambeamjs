import {DecodedJwt} from "../models";
import {getAccessToken} from "./skalioId/auth";
import environmentService from "./EnvironmentService";
import {ITokenStorage, tokenStorage} from "./ITokenStorage";
import {ServiceLocator} from "./ServiceLocator";

class AccessService {
    // private storageService: ITokenStorage;
    private accessToken: DecodedJwt | null = null;

    constructor() {
    }

    public async getAccessToken(): Promise<string> {
        while (!this.accessToken || !this.accessToken.isValid()) {
            await this.fetchAccessToken();
        }

        return this.accessToken.token;
    }

    private async fetchAccessToken() {
        const storageService = ServiceLocator.get<ITokenStorage>(tokenStorage);
        const tokenString = storageService.fetchToken();
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

export default new AccessService();