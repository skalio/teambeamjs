import {ITokenStorage} from "./ITokenStorage";

export class LocalStorageTokenStorage implements ITokenStorage {
    private KEY: string = "idToken";

    persistToken(token: string): void {
        localStorage.setItem(this.KEY, token);
    }

    fetchToken(): string | null {
        return localStorage.getItem(this.KEY);
    }

    removeToken(): void {
        localStorage.removeItem(this.KEY);
    }

}