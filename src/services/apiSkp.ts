import axios from "axios";
import FormData from "form-data";
import { Readable } from "stream";
import { constants } from "../core/constants.js";
import {
  AccessTokenResponse,
  ReservationConfirmResult,
  ReservationRequest,
  ReservationResponse,
  SkpEnvironment,
  Transfer,
  TransferFile,
  TransferLocation,
  UploadInfo,
} from "../entities/skp.js";
import { AuthType, type AuthAwareAxiosInstance } from "./auth/authAwareAxios.js";
import { AuthManager } from "./auth/authManager.js";
import { createAuthRetryInterceptor } from "./auth/authRetryInterceptor.js";
import { createAuthTokenInjectorInterceptor } from "./auth/authTokenInjector.js";
import { TokenClient } from "./auth/tokenClient.js";
import { ConfigService } from "./config.js";

export function createSkpApi(
  config: ConfigService,
  overrideHost?: string
): SkpApi {
  return new SkpApi(
    overrideHost ?? config.get("host")!,
    () => config.get("idToken")!
  );
}

export type { SkpApi };

class SkpApi {
  private readonly axios: AuthAwareAxiosInstance;

  constructor(host: string, getIdToken: () => string | undefined) {
    const baseURL = `${host}${constants.basePathSkp}`;

    const tokenClient = new SkpTokenClient(baseURL);
    const authManager = new AuthManager(getIdToken, tokenClient);

    this.axios = axios.create({ baseURL }) as AuthAwareAxiosInstance;
    this.axios.interceptors.request.use(
      createAuthTokenInjectorInterceptor(authManager, getIdToken)
    );
    this.axios.interceptors.response.use(
      undefined,
      createAuthRetryInterceptor(authManager)
    );
  }

  async fetchEnvironment(): Promise<SkpEnvironment> {
    const response = await this.axios.get<SkpEnvironment>("/environment", {
      authType: AuthType.None,
    });
    return response.data;
  }

  async createReservation(
    request: ReservationRequest
  ): Promise<ReservationResponse> {
    const response = await this.axios.post<ReservationResponse>(
      "/reservations",
      request,
      { authType: AuthType.AccessToken }
    );
    return response.data;
  }

  async confirmReservation(
    reservationId: string
  ): Promise<ReservationConfirmResult> {
    const response = await this.axios.post<ReservationConfirmResult>(
      `/reservations/${reservationId}/confirm`,
      undefined,
      { authType: AuthType.AccessToken }
    );
    return response.data;
  }

  async uploadFileChunk({
    startByte,
    endByte,
    formData,
    totalBytes,
    onUploadProgress,
  }: {
    startByte: number;
    endByte?: number;
    formData?: FormData;
    totalBytes?: number;
    onUploadProgress?: (progressEvent: any) => void;
  }): Promise<UploadInfo> {
    let contentRange;
    if (
      startByte !== undefined &&
      endByte !== undefined &&
      totalBytes !== undefined
    ) {
      contentRange = `bytes ${startByte}-${endByte - 1}/${totalBytes}`;
    }
    const response = await this.axios.postForm<UploadInfo>(
      "/upload",
      formData,
      {
        headers: contentRange ? { "Content-Range": contentRange } : undefined,
        onUploadProgress,
        authType: AuthType.AccessToken,
      }
    );
    return response.data;
  }

  async fetchUploadedFileSize(
    objectId: string,
    reservationToken: string
  ): Promise<number> {
    const response = await this.axios.head(`/upload/${objectId}`, {
      headers: {
        "X-Skp-Auth": `${reservationToken}`,
      },
      authType: AuthType.AccessToken,
    });
    return Number(response.headers["content-length"] ?? "0");
  }

  async fetchTransfers({
    location,
    search,
  }: {
    location?: TransferLocation;
    search?: string;
  }): Promise<Transfer[]> {
    const response = await this.axios.get<ListResponse<Transfer, "transfers">>(
      "/transfers",
      {
        params: { location, search },
        authType: AuthType.AccessToken,
      }
    );
    return response.data.transfers;
  }

  async fetchTransfer(recipientId: string): Promise<Transfer> {
    const response = await this.axios.get<Transfer>(
      `transfers/${recipientId}`,
      { authType: AuthType.AccessToken }
    );
    return response.data;
  }

  async copyTransferToArchive({
    recipientId,
    folderIdx,
  }: {
    recipientId: string;
    folderIdx: number;
  }): Promise<Transfer> {
    const response = await this.axios.post<Transfer>(
      `transfers/${recipientId}/copy`,
      { idx: folderIdx },
      { authType: AuthType.AccessToken }
    );
    return response.data;
  }

  async streamTransferFile({
    file,
    onUploadProgress,
  }: {
    file: TransferFile;
    onUploadProgress?: (progressEvent: any) => void;
  }): Promise<Readable> {
    const response = await this.axios.get<Readable>(file.url, {
      responseType: "stream",
      onDownloadProgress: onUploadProgress,
      authType: AuthType.None,
    });
    return response.data;
  }
}

class SkpTokenClient implements TokenClient {
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

type ListResponse<T, K extends string> = {
  total: number;
} & {
  [key in K]: T[];
};
