import axios, { AxiosInstance } from "axios";
import {
  AuthRequest,
  SkalioIdEnvironment,
  TokenResponse,
} from "../entities/skalioId.js";

const basePathSkalioId: string = "/api/id/v3";

class SkalioIdApi {
  protected apiClient: AxiosInstance;

  constructor({ host }: { host: string }) {
    this.apiClient = axios.create({
      baseURL: `${host}${basePathSkalioId}`,
      headers: { "Content-Type": "application/json" },
    });
  }

  async fetchEnvironment(): Promise<SkalioIdEnvironment> {
    return this.apiClient
      .get<SkalioIdEnvironment>("/environment")
      .then((response) => response.data);
  }

  async doesAccountExist(emailAddress: string): Promise<boolean> {
    return this.apiClient
      .post<{
        provider: string;
      }>(
        "/auth/exists",
        { address: emailAddress },
        {
          validateStatus: (status) =>
            (status >= 200 && status < 300) || status == 404,
        }
      )
      .then((response) => response.status == 200);
  }

  async login(input: Omit<AuthRequest, "type">): Promise<TokenResponse> {
    const requestData: AuthRequest = {
      ...input,
      type: "bcrypt",
    };
    return this.apiClient
      .post<TokenResponse>("/auth/login", requestData)
      .then((response) => response.data);
  }

  async provideTotpCode(
    input: Omit<AuthRequest, "type">,
    mfaToken: string
  ): Promise<TokenResponse> {
    const requestData: AuthRequest = {
      ...input,
      type: "totp",
    };
    return this.apiClient
      .post<TokenResponse>("/auth/login", requestData, {
        headers: { Authorization: `Bearer ${mfaToken}` },
      })
      .then((response) => response.data)
      .catch((e) => {
        console.error(e);
        throw e;
      });
  }
}

export function createSkalioIdApi({ host }: { host: string }): SkalioIdApi {
  return new SkalioIdApi({
    host: host,
  });
}
