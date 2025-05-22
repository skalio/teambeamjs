import axios from "axios";
import { Readable } from "stream";
import {
  ReservationConfirmResult,
  ReservationRequest,
  ReservationResponse,
  SkpEnvironment,
  Transfer,
  TransferFile,
  TransferLocation,
  UploadInfo
} from "../entities/skp.js";
import type { AuthAwareAxiosInstance } from "./auth/authAwareAxiosInstance.js";
import { AuthManager } from "./auth/authManager.js";
import { AuthType } from "./auth/authType.js";
import { create401RetryInterceptor } from "./auth/create401RetryInterceptor.js";
import { createAuthInterceptor } from "./auth/createAuthInterceptor.js";
import { TokenApiClient } from "./auth/tokenApiClient.js";
import { ConfigService } from "./config.js";

const basePathSkp: string = "/api/skp/v1";

export class SkpApi {
  private readonly axios: AuthAwareAxiosInstance;

  constructor(host: string, getIdToken: () => string | undefined) {
    const baseURL = `${host}${basePathSkp}`;

    const tokenApiClient = new TokenApiClient(baseURL);
    const authManager = new AuthManager(getIdToken, tokenApiClient);

    this.axios = axios.create({ baseURL }) as AuthAwareAxiosInstance;
    this.axios.interceptors.request.use(
      createAuthInterceptor(authManager, getIdToken)
    );
    this.axios.interceptors.response.use(
      undefined,
      create401RetryInterceptor(authManager)
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

export function createSkpApi(
  config: ConfigService,
  overrideHost?: string
): SkpApi {
  return new SkpApi(
    overrideHost ?? config.get("host")!,
    () => config.get("idToken")!
  );
}

type ListResponse<T, K extends string> = {
  total: number;
} & {
  [key in K]: T[];
};
