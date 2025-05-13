import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig
} from "axios";
import {
  AuthRequest,
  SkalioIdEnvironment,
  TokenResponse,
} from "../entities/skalioId.js";
import { ConfigService } from "./config.js";

const basePathSkalioId: string = "/api/id/v3";

class SkalioIdApi {
  protected apiClient: AxiosInstance;

  protected getIdToken: () => string;
  protected setIdToken: (token: string) => void;

  constructor(
    host: string,
    getIdToken: () => string,
    setIdToken: (token: string) => void
  ) {
    this.getIdToken = getIdToken;
    this.setIdToken = setIdToken;

    const axiosConfig = {
      baseURL: `${host}${basePathSkalioId}`,
      headers: { "Content-Type": "application/json" },
    };
    this.apiClient = axios.create(axiosConfig);

    const accessTokenInterceptor = new AccessTokenInterceptor();
    this.apiClient.interceptors.request.use(accessTokenInterceptor.onRequest);
    this.apiClient.interceptors.request.use(
      accessTokenInterceptor.onResponse,
      accessTokenInterceptor.onResponseError
    );
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

export function createSkalioIdApi(config: ConfigService): SkalioIdApi {
  return new SkalioIdApi(
    config.get("host")!,
    () => config.get("idToken")!,
    (value) => config.set({ idToken: value })
  );
}

class AccessTokenInterceptor {
  private accessToken?: string;

  onRequest = async (
    requestConfig: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    return requestConfig;
  };

  onResponse = async (
    requestConfig: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    return requestConfig;
  };

  onResponseError = (error: any): any => {
    return;
  };
}
