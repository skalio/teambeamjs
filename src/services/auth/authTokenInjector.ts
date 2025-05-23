import { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { AuthenticatedRequestConfig, AuthType } from "./authAwareAxios.js";
import { AuthManager } from "./authManager.js";

/**
 * Axios request interceptor that injects an Authorization header
 * based on the request's {@link AuthType}.
 *
 * Supports {@link AuthType.IdToken} and {@link AuthType.AccessToken}.
 * No-op for requests without an `authType`.
 */
export function createAuthTokenInjectorInterceptor(
  authManager: AuthManager,
  getIdToken: () => string | undefined
) {
  return async (config: AxiosRequestConfig) => {
    const req = config as AuthenticatedRequestConfig;

    switch (req.authType) {
      case AuthType.IdToken: {
        const idToken = getIdToken();
        if (!idToken) throw new Error("No ID token available");
        req.headers = {
          ...req.headers,
          Authorization: `Bearer ${idToken}`,
        };
        break;
      }
      case AuthType.AccessToken: {
        const accessToken = await authManager.getValidAccessToken();
        req.headers = {
          ...req.headers,
          Authorization: `Bearer ${accessToken}`,
        };
        break;
      }
    }

    return req as InternalAxiosRequestConfig;
  };
}
