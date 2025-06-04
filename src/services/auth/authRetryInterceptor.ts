import axios, { AxiosError } from "axios";
import { AuthenticatedRequestConfig, AuthType } from "./authAwareAxios.js";
import { AuthManager } from "./authManager.js";

/**
 * Axios response interceptor that retries requests with a fresh access token
 * after a 401 response. Only applies to requests with `authType: AccessToken`.
 *
 * Retries once, then falls back to the original error.
 */
export function createAuthRetryInterceptor(authManager: AuthManager) {
  return async (error: AxiosError) => {
    const config = error.config as AuthenticatedRequestConfig;

    if (
      error.response?.status === 401 &&
      config.authType === AuthType.AccessToken &&
      !config._isRetry
    ) {
      config._isRetry = true;
      authManager.clearAccessToken();

      try {
        const newToken = await authManager.getAccessToken();
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
