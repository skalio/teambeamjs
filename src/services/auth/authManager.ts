import { TokenClient } from "./tokenClient.js";

/**
 * Manages the lifecycle of an access token.
 *
 * Reuses a cached token (held in-memory only, not persisted) unless expired.
 * On demand, fetches a new one using the provided ID token and a
 * {@link TokenClient}.
 *
 * The access token is not written to disk or persisted across CLI runs.
 */
export class AuthManager {
  private accessToken: string | null = null;

  constructor(
    private readonly getIdToken: () => string | undefined,
    private readonly tokenApiClient: TokenClient
  ) {}

  /**
   * Returns a valid access token, fetching a new one if needed.
   *
   * @returns A valid access token (possibly freshly fetched)
   */
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

  /**
   * Clears the cached access token, forcing the next call to fetch a new one.
   */
  clearAccessToken() {
    this.accessToken = null;
  }

  /**
   * Determines if the current token is expired.
   */
  private isExpired(_token: string): boolean {
    // TODO: Consider implementing actual expiration logic.
    // A static expiration check might be unreliable on systems with unsynced clocks.
    return false;
  }
}
