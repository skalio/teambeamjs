import axios, {
  AxiosInstance,
  AxiosProgressEvent,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { Readable } from "stream";
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
import { ConfigService } from "./config.js";

const basePathSkp: string = "/api/skp/v1";

// =============================================================================
//                                skp-server
// =============================================================================

export class SkpApi {
  protected authenticatedClient: AxiosInstance;
  protected unauthenticatedClient: AxiosInstance;
  protected tokenFetcherClient: AxiosInstance;
  protected getIdToken: () => string;

  constructor(host: string, getIdToken: () => string) {
    this.getIdToken = getIdToken;

    const axiosConfig = {
      baseURL: `${host}${basePathSkp}`,
    };

    this.authenticatedClient = axios.create(axiosConfig);
    this.unauthenticatedClient = axios.create(axiosConfig);
    this.tokenFetcherClient = axios.create(axiosConfig);

    const idTokenInjector = new IdTokenInjector(this.getIdToken);
    this.tokenFetcherClient.interceptors.request.use(idTokenInjector.onRequest);

    const accessTokenInterceptor = new AccessTokenInterceptor(() =>
      this.fetchAccessToken()
        .then((response) => response.token)
        .catch((error) => {
          console.error("Something went wrong: ", error);
          throw error;
        })
    );
    this.authenticatedClient.interceptors.request.use(
      accessTokenInterceptor.onRequest
    );
    this.authenticatedClient.interceptors.response.use(
      accessTokenInterceptor.onResponse,
      accessTokenInterceptor.onResponseError
    );
  }

  async fetchEnvironment(): Promise<SkpEnvironment> {
    const response =
      await this.unauthenticatedClient.get<SkpEnvironment>("/environment");
    return response.data;
  }

  async fetchAccessToken(): Promise<AccessTokenResponse> {
    const response =
      await this.tokenFetcherClient.post<AccessTokenResponse>("/auth/access");
    return response.data;
  }

  async createReservation(
    request: ReservationRequest
  ): Promise<ReservationResponse> {
    const response = await this.authenticatedClient.post<ReservationResponse>(
      "/reservations",
      request
    );
    return response.data;
  }

  async confirmReservation(
    reservationId: string
  ): Promise<ReservationConfirmResult> {
    const response =
      await this.authenticatedClient.post<ReservationConfirmResult>(
        `/reservations/${reservationId}/confirm`
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
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }): Promise<UploadInfo> {
    var contentRange;
    if (
      startByte !== undefined &&
      endByte !== undefined &&
      totalBytes !== undefined
    ) {
      contentRange = `bytes ${startByte}-${endByte - 1}/${totalBytes}`;
    }
    const response = await this.authenticatedClient.postForm<UploadInfo>(
      "/upload",
      formData,
      {
        headers: !contentRange
          ? undefined
          : {
              "Content-Range": contentRange,
            },
        onUploadProgress: onUploadProgress,
      }
    );
    return response.data;
  }

  async fetchUploadedFileSize(
    objectId: string,
    reservationToken: string
  ): Promise<number> {
    const response = await this.authenticatedClient.head(
      `/upload/${objectId}`,
      {
        headers: {
          "X-Skp-Auth": `${reservationToken}`,
        },
      }
    );
    return Number(response.headers["content-length"] ?? "0");
  }

  async fetchTransfers({
    location,
    search,
  }: {
    location?: TransferLocation;
    search?: string;
  }): Promise<Transfer[]> {
    const response = await this.authenticatedClient.get<
      ListResponse<Transfer, "transfers">
    >("/transfers", { params: { location: location, search: search } });
    return response.data.transfers;
  }

  async fetchTransfer(recipientId: string): Promise<Transfer> {
    const response = await this.authenticatedClient.get<Transfer>(
      `transfers/${recipientId}`
    );
    return response.data;
  }

  async copyTransferToDrive({
    recipientId,
    folderIdx,
  }: {
    recipientId: string;
    folderIdx: number;
  }): Promise<Transfer> {
    const response = await this.authenticatedClient.post<Transfer>(
      `transfers/${recipientId}/copy`,
      { idx: folderIdx }
    );
    return response.data;
  }

  //async downloadTransferFile({file, path} : {file: TransferFile, path: fs.PathLike}) : Promise<void> {
  async streamTransferFile({
    file,
    onUploadProgress,
  }: {
    file: TransferFile;
    onUploadProgress?: (progressEvent: AxiosProgressEvent) => void;
  }): Promise<Readable> {
    const reponse = await this.unauthenticatedClient.get<Readable>(file.url, {
      responseType: "stream",
      onDownloadProgress: onUploadProgress,
    });
    return reponse.data;
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

class IdTokenInjector {
  protected getIdToken: () => string;

  constructor(getIdToken: () => string) {
    this.getIdToken = getIdToken;
  }

  onRequest = async (
    requestConfig: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    requestConfig.headers.setAuthorization(`Bearer ${this.getIdToken()}`, true);
    return requestConfig;
  };
}

class AccessTokenInterceptor {
  private accessToken?: string;

  private fetchAccessToken: () => Promise<string>;

  constructor(fetchAccessToken: () => Promise<string>) {
    this.fetchAccessToken = fetchAccessToken;
  }

  getAccessToken = async (): Promise<string> =>
    this.accessToken ?? (await this.fetchAccessToken());

  onRequest = async (
    requestConfig: InternalAxiosRequestConfig
  ): Promise<InternalAxiosRequestConfig> => {
    requestConfig.headers.setAuthorization(
      `Bearer ${await this.getAccessToken()}`,
      true
    );
    return requestConfig;
  };

  onResponse = async (response: AxiosResponse): Promise<AxiosResponse> => {
    return response;
  };

  onResponseError = (error: any): any => {
    return Promise.reject(error);
  };
}

type ListResponse<T, K extends string> = {
  total: number;
} & {
  [key in K]: T[];
};
