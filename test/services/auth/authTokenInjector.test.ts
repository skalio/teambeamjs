import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequestConfig } from "../../../src/services/auth/authAwareAxios.js";
import { AuthType } from "../../../src/services/auth/authAwareAxios.js";
import type { AuthManager } from "../../../src/services/auth/authManager.js";
import { createAuthTokenInjectorInterceptor } from "../../../src/services/auth/authTokenInjector.js";

const mockIdToken = "mock-id-token";
const mockAccessToken = "mock-access-token";

describe("createAuthTokenInjectorInterceptor", () => {
  let authManager: AuthManager;
  let getIdToken: () => string | undefined;

  beforeEach(() => {
    authManager = {
      getAccessToken: vi.fn().mockResolvedValue(mockAccessToken),
    } as unknown as AuthManager;

    getIdToken = vi.fn(() => mockIdToken);
  });

  it("injects Authorization header with ID token when authType is IdToken", async () => {
    const interceptor = createAuthTokenInjectorInterceptor(
      authManager,
      getIdToken
    );
    const config: AuthenticatedRequestConfig = {
      authType: AuthType.IdToken,
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers?.Authorization).toBe(`Bearer ${mockIdToken}`);
  });

  it("injects Authorization header with access token when authType is AccessToken", async () => {
    const interceptor = createAuthTokenInjectorInterceptor(
      authManager,
      getIdToken
    );
    const config: AuthenticatedRequestConfig = {
      authType: AuthType.AccessToken,
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers?.Authorization).toBe(`Bearer ${mockAccessToken}`);
    expect(authManager.getAccessToken).toHaveBeenCalled();
  });

  it("does not modify headers if authType is undefined", async () => {
    const interceptor = createAuthTokenInjectorInterceptor(
      authManager,
      getIdToken
    );
    const config: AuthenticatedRequestConfig = {
      headers: {},
    };

    const result = await interceptor(config);

    expect(result.headers?.Authorization).toBeUndefined();
  });

  it("throws an error if authType is IdToken but getIdToken returns undefined", async () => {
    getIdToken = vi.fn(() => undefined);
    const interceptor = createAuthTokenInjectorInterceptor(
      authManager,
      getIdToken
    );

    const config: AuthenticatedRequestConfig = {
      authType: AuthType.IdToken,
      headers: {},
    };

    await expect(interceptor(config)).rejects.toThrow(Error);
  });
});
