export interface ITokenStorage {

    persistToken(token: string): void;

    fetchToken(): string | null;

    removeToken(): void;

}
