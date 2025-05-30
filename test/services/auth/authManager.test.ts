import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthManager } from "../../../src/services/auth/authManager.js";
import type { TokenClient } from "../../../src/services/auth/tokenClient.js";

const mockToken = "mock-access-token";

describe("AuthManager", () => {
  let getIdToken: () => string | undefined;
  let tokenClient: TokenClient;
  let manager: AuthManager;

  beforeEach(() => {
    getIdToken = vi.fn(() => "id-token-123");
    tokenClient = {
      fetchAccessToken: vi.fn().mockResolvedValue(mockToken),
    };
    manager = new AuthManager(getIdToken, tokenClient);
  });

  it("fetches a new access token when none is cached", async () => {
    const token = await manager.getAccessToken();
    expect(token).toBe(mockToken);
    expect(tokenClient.fetchAccessToken).toHaveBeenCalledWith("id-token-123");
  });

  it("returns cached access token if available", async () => {
    const first = await manager.getAccessToken();
    const second = await manager.getAccessToken();

    expect(first).toBe(mockToken);
    expect(second).toBe(mockToken);
    expect(tokenClient.fetchAccessToken).toHaveBeenCalledTimes(1);
  });

  it("clears cached token so next request triggers fetch", async () => {
    await manager.getAccessToken();
    manager.clearAccessToken();
    await manager.getAccessToken();

    expect(tokenClient.fetchAccessToken).toHaveBeenCalledTimes(2);
  });

  it("throws if getIdToken returns undefined", async () => {
    getIdToken = vi.fn(() => undefined);
    manager = new AuthManager(getIdToken, tokenClient);

    await expect(manager.getAccessToken()).rejects.toThrow(Error);
    expect(tokenClient.fetchAccessToken).not.toHaveBeenCalled();
  });
});
