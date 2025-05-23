import axios from "axios";
import { constants } from "../core/constants.js";
import {
  AuthRequest,
  EmailAddress,
  SkalioIdEnvironment,
  TokenResponse,
} from "../entities/skalioId.js";
import {
  AuthType,
  type AuthAwareAxiosInstance,
} from "./auth/authAwareAxios.js";
import { AuthManager } from "./auth/authManager.js";
import { createAuthRetryInterceptor } from "./auth/authRetryInterceptor.js";
import { createAuthTokenInjectorInterceptor } from "./auth/authTokenInjector.js";
import type { TokenClient } from "./auth/tokenClient.js";
import { ConfigService } from "./config.js";

export function createSkalioIdApi(
  config: ConfigService,
  overrideHost?: string
): SkalioIdApi {
  return new SkalioIdApi(
    overrideHost ?? config.get("host")!,
    () => config.get("idToken")!
  );
}

export type { SkalioIdApi };

class SkalioIdApi {
  private readonly axios: AuthAwareAxiosInstance;

  constructor(host: string, getIdToken: () => string) {
    const baseURL = `${host}${constants.basePathSkalioId}`;
    const tokenClient = new SkalioIdTokenClient(baseURL, getIdToken);
    const authManager = new AuthManager(getIdToken, tokenClient);

    this.axios = axios.create({
      baseURL,
      headers: { "Content-Type": "application/json" },
    }) as AuthAwareAxiosInstance;

    this.axios.interceptors.request.use(
      createAuthTokenInjectorInterceptor(authManager, getIdToken)
    );
    this.axios.interceptors.response.use(
      undefined,
      createAuthRetryInterceptor(authManager)
    );
  }

  async fetchEnvironment(): Promise<SkalioIdEnvironment> {
    const response = await this.axios.get<SkalioIdEnvironment>("/environment", {
      authType: AuthType.None,
    });
    return response.data;
  }

  async doesAccountExist(emailAddress: string): Promise<boolean> {
    const response = await this.axios.post<{ provider: string }>(
      "/auth/exists",
      { address: emailAddress },
      {
        validateStatus: (status) =>
          (status >= 200 && status < 300) || status === 404,
        authType: AuthType.None,
      }
    );
    return response.status === 200;
  }

  async login(input: Omit<AuthRequest, "type">): Promise<TokenResponse> {
    const requestData: AuthRequest = {
      ...input,
      type: "bcrypt",
    };
    const response = await this.axios.post<TokenResponse>(
      "/auth/login",
      requestData,
      { authType: AuthType.None }
    );
    return response.data;
  }

  async provideTotpCode(
    input: Omit<AuthRequest, "type">,
    mfaToken: string
  ): Promise<TokenResponse> {
    const requestData: AuthRequest = {
      ...input,
      type: "totp",
    };
    const response = await this.axios.post<TokenResponse>(
      "/auth/login",
      requestData,
      {
        headers: { Authorization: `Bearer ${mfaToken}` },
        authType: AuthType.None,
      }
    );
    return response.data;
  }

  async fetchAccessToken(): Promise<TokenResponse> {
    const response = await this.axios.post<TokenResponse>(
      "/auth/access",
      undefined,
      { authType: AuthType.IdToken }
    );
    return response.data;
  }

  async fetchAllEmails(): Promise<EmailAddress[]> {
    const response = await this.axios.get<ListResponse<EmailAddress, "emails">>(
      "/profile/emails",
      {
        authType: AuthType.AccessToken,
      }
    );
    return response.data.emails;
  }
}

class SkalioIdTokenClient implements TokenClient {
  constructor(
    private readonly baseUrl: string,
    private readonly getIdToken: () => string | undefined
  ) {}

  async fetchAccessToken(): Promise<string> {
    const response = await axios.post<TokenResponse>(
      `${this.baseUrl}/auth/access`,
      undefined,
      {
        headers: {
          Authorization: `Bearer ${this.getIdToken()}`,
        },
      }
    );
    return response.data.token;
  }
}

type ListResponse<T, K extends string> = {
  [key in K]: T[];
};
