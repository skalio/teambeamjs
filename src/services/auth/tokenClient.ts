/**
 * Interface for any service that can exchange an ID token for an access token.
 */
export interface TokenClient {
  fetchAccessToken(idToken: string): Promise<string>;
}
