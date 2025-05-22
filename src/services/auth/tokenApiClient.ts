import axios from "axios";

export class TokenApiClient {
  constructor(private readonly baseUrl: string) {}

  async fetchAccessToken(idToken: string): Promise<string> {
    const response = await axios.post(
      `${this.baseUrl}/auth/access-token`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    return response.data.accessToken;
  }
}