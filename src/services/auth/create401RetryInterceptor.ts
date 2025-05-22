import axios, { AxiosError } from "axios";
import { AuthenticatedRequestConfig } from "./authenticatedRequestConfig.js";
import { AuthManager } from "./authManager.js";
import { AuthType } from "./authType.js";

export function create401RetryInterceptor(authManager: AuthManager) {
  return async (error: AxiosError) => {
    const config = error.config as AuthenticatedRequestConfig;

    if (
      error.response?.status === 401 &&
      config.authType === AuthType.AccessToken &&
      !config._retry
    ) {
      config._retry = true;
      authManager.clearAccessToken();

      try {
        const newToken = await authManager.getValidAccessToken();
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${newToken}`,
        };

        return axios(config);
      } catch {
        // Failed to retry, fall through to original error
      }
    }

    return Promise.reject(error);
  };
}