import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequestConfig } from "../../../src/services/auth/authAwareAxios.js";
import { AuthType } from "../../../src/services/auth/authAwareAxios.js";
import type { AuthManager } from "../../../src/services/auth/authManager.js";
import { createAuthRetryInterceptor } from "../../../src/services/auth/authRetryInterceptor.js";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const mockAccessToken = "mock-access-token";

function createError(
  config: Partial<AuthenticatedRequestConfig>,
  status = 401
): any {
  return {
    config,
    response: { status },
    isAxiosError: true,
  };
}

describe("createAuthRetryInterceptor", () => {
  let authManager: AuthManager;

  beforeEach(() => {
    mockedAxios.mockClear();

    authManager = {
      getAccessToken: vi.fn().mockResolvedValue(mockAccessToken),
      clearAccessToken: vi.fn(),
    } as unknown as AuthManager;
  });

  it("retries once with new access token if 401 and authType is AccessToken", async () => {
    const retryInterceptor = createAuthRetryInterceptor(authManager);

    const config: AuthenticatedRequestConfig = {
      authType: AuthType.AccessToken,
      headers: {},
    };

    const error = createError(config);
    mockedAxios.mockResolvedValueOnce({ data: "retried response" });

    const result = await retryInterceptor(error);

    expect(authManager.clearAccessToken).toHaveBeenCalled();
    expect(authManager.getAccessToken).toHaveBeenCalled();
    expect(mockedAxios).toHaveBeenCalledWith({
      ...config,
      headers: { Authorization: `Bearer ${mockAccessToken}` },
      _isRetry: true,
    });
    expect(result).toEqual({ data: "retried response" });
  });

  it("does not retry if request already _isRetry", async () => {
    const retryInterceptor = createAuthRetryInterceptor(authManager);

    const config: AuthenticatedRequestConfig = {
      authType: AuthType.AccessToken,
      headers: {},
      _isRetry: true,
    };

    const error = createError(config);

    await expect(retryInterceptor(error)).rejects.toEqual(error);
    expect(authManager.clearAccessToken).not.toHaveBeenCalled();
  });

  it("does not retry if authType is not AccessToken", async () => {
    const retryInterceptor = createAuthRetryInterceptor(authManager);

    const config: AuthenticatedRequestConfig = {
      authType: AuthType.IdToken,
      headers: {},
    };

    const error = createError(config);

    await expect(retryInterceptor(error)).rejects.toEqual(error);

    expect(authManager.clearAccessToken).not.toHaveBeenCalled();
  });

  it("falls back to original error if retry fails", async () => {
    const retryInterceptor = createAuthRetryInterceptor(authManager);

    const config: AuthenticatedRequestConfig = {
      authType: AuthType.AccessToken,
      headers: {},
    };

    const error = createError(config);

    vi.mocked(authManager.getAccessToken).mockRejectedValueOnce(
      new Error("fail")
    );

    await expect(retryInterceptor(error)).rejects.toEqual(error);
    expect(authManager.clearAccessToken).toHaveBeenCalled();
  });
});
