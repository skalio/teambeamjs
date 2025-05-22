import { TokenApiClient } from "./tokenApiClient.js";

export class AuthManager {
  private accessToken: string | null = null;

  constructor(
    private readonly getIdToken: () => string | undefined,
    private readonly tokenApiClient: TokenApiClient
  ) {}

  async getValidAccessToken(): Promise<string> {
    if (this.accessToken && !this.isExpired(this.accessToken)) {
      return this.accessToken;
    }

    const idToken = this.getIdToken();
    if (!idToken) throw new Error("No ID token available");

    const token = await this.tokenApiClient.fetchAccessToken(idToken);
    this.accessToken = token;
    return token;
  }

  clearAccessToken() {
    this.accessToken = null;
  }

  private isExpired(_token: string): boolean {
    // TODO: implement JWT expiration check
    return false;
  }
}