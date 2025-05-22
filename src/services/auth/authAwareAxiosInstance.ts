import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";
import { AuthType } from "./authType.js";

export interface AuthenticatedRequestConfig extends AxiosRequestConfig {
  authType?: AuthType;
}

export type AuthAwareAxiosInstance = Omit<AxiosInstance, "request" | "get" | "delete" | "head" | "options" | "post" | "put" | "patch" | "postForm"> & {
  request<T = any, R = AxiosResponse<T>>(config: AuthenticatedRequestConfig): Promise<R>;
  get<T = any, R = AxiosResponse<T>>(url: string, config?: AuthenticatedRequestConfig): Promise<R>;
  delete<T = any, R = AxiosResponse<T>>(url: string, config?: AuthenticatedRequestConfig): Promise<R>;
  head<T = any, R = AxiosResponse<T>>(url: string, config?: AuthenticatedRequestConfig): Promise<R>;
  options<T = any, R = AxiosResponse<T>>(url: string, config?: AuthenticatedRequestConfig): Promise<R>;
  post<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AuthenticatedRequestConfig): Promise<R>;
  put<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AuthenticatedRequestConfig): Promise<R>;
  patch<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AuthenticatedRequestConfig): Promise<R>;
  postForm<T = any, R = AxiosResponse<T>>(url: string, data?: any, config?: AuthenticatedRequestConfig): Promise<R>;
};