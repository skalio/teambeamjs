import axios from "axios";
import { AccessTokenResponse } from "../../entities/skp.js";

export class TokenApiClient {
  constructor(private readonly baseUrl: string) {}

  async fetchAccessToken(idToken: string): Promise<string> {
    const response = await axios.post<AccessTokenResponse>(
      `${this.baseUrl}/auth/access`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      }
    );

    return response.data.token;
  }
}
