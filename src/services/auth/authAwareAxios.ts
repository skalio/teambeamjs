import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

/**
 * Variant of {@link AxiosInstance} that supports {@link AuthenticatedRequestConfig}
 * on all common HTTP methods.
 *
 * This type ensures that each request can carry `authType` metadata for automatic token injection.
 */
export type AuthAwareAxiosInstance = Omit<
  AxiosInstance,
  | "request"
  | "get"
  | "delete"
  | "head"
  | "options"
  | "post"
  | "put"
  | "patch"
  | "postForm"
> & {
  request<T = any, R = AxiosResponse<T>>(
    config: AuthenticatedRequestConfig
  ): Promise<R>;
  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
  head<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
  options<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
  postForm<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AuthenticatedRequestConfig
  ): Promise<R>;
};

/**
 * Extension of {@link AxiosRequestConfig} that supports custom authentication metadata.
 *
 * - `authType`: Indicates whether the request requires an {@link AuthType.AccessToken}, {@link AuthType.IdToken}, or no auth.
 * - `_isRetry`: Internal flag used to track whether a failed request has already been retried once.
 */
export interface AuthenticatedRequestConfig extends AxiosRequestConfig {
  authType?: AuthType;
  _isRetry?: boolean;
}

/**
 * Declares the authentication mode for a request.
 */
export enum AuthType {
  /**
   * No authentication required for the request.
   */
  None = "none",

  /**
   * Inject an ID token in the `Authorization` header.
   */
  IdToken = "id_token",

  /**
   * Inject an access token in the `Authorization` header.
   * Can be either a Skalio ID or skp-server access token.
   */
  AccessToken = "access_token",
}
