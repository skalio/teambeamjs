import { AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import { AuthManager } from "./authManager.js";
import { AuthType } from "./authType.js";
import { AuthenticatedRequestConfig } from "./authenticatedRequestConfig.js";

export function createAuthInterceptor(
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