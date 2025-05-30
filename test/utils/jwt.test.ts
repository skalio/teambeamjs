import { describe, expect, it } from "vitest";
import { determineToken, jwtDecode } from "../../src/utils/jwt.js";

const skalioIdAccessToken =
  "eyJraWQiOiI5eDVoLS1fbnU0bWE0aDktIiwiYWxnIjoiRVMyNTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwOi8vc2thbGlvLmNvbSIsImF1ZCI6Imh0dHA6Ly9za2FsaW8uY29tL2lkIiwic3ViIjoiMWJ1cTY1eDA5NW95OW1yZCIsImV4cCI6MTc0ODYxNjY4NSwiYXV0aF90aW1lIjoxNzQ4NjE1NzE3LCJzaWQiOiJvajF2cy52OTguMXE5emU0Iiwic2NvcGUiOiJhY2Nlc3MiLCJyb2xlcyI6WyJTZXJ2aWNlLlRyYW5zZmVyLkFyY2hpdmUuQ3JlYXRlUm9vdCIsIlNlcnZpY2UuRHJpdmUuQ3JlYXRlU3BhY2UiLCJDb250cmFjdC5SZWFkIiwiQ29udHJhY3QuQWRtaW4iLCJDbHVzdGVyLkFkbWluIiwiU2VydmljZS5UcmFuc2Zlci5Vc2UiLCJDbHVzdGVyLkFzc2V0TWFuYWdlbWVudCIsIk9yZ2FuaXphdGlvbi5BZG1pbiJdLCJhbXIiOlsicHdkIl19.EZDxZuYzfTOyK1l6weWCAr1hIFJ9fvEsf7VUbCWqfT6C37k9BPj-VOJevVXLNSCIoRXLWjxBKMygozRY0t7VPQ";

const skpAccessToken =
  "eyJraWQiOiIxX3ZrLWdvOXpqczNoYm1pIiwiYWxnIjoiRVMyNTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwOi8vc2thbGlvLmNvbS9za3AiLCJzdWIiOiIxYnVxNjV4MDk1b3k5bXJkIiwiZXhwIjoxNzQ4NjE2ODA3LCJhdWQiOiJodHRwOi8vc2thbGlvLmNvbS9za3AiLCJhdXRoX3RpbWUiOjE3NDg2MTYyMDcsInNjb3BlIjoiYWNjZXNzIiwiZW1haWwiOiJqc0Bza2FsaW8uY29tIiwiaHR0cDovL3NrYWxpby5jb20vaG9zdG5hbWUiOiJmdXR1cmUudGVhbWJlYW0uZGV2IiwiYW1yIjpbInB3ZCJdfQ.YgLz5xSqmEHpwic9iWOAN4F--kPRtQwBJFLW-4HlkaI3ELcEeB7-aTOJGtQsg7aNylsA5dXSNL0CKpE9XUmggA";

const mfaToken =
  "eyJraWQiOiI5eDVoLS1fbnU0bWE0aDktIiwiYWxnIjoiRVMyNTYiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwOi8vc2thbGlvLmNvbSIsImF1ZCI6Imh0dHA6Ly9za2FsaW8uY29tL2lkIiwic3ViIjoiYXI2M2IuODkxLno2NDFqaCIsImV4cCI6MTc0ODYxNjQ0NiwibG9jYWxlIjoiZW4tVVMiLCJzY29wZSI6Im1mYSIsImh0dHA6Ly9za2FsaW8uY29tL2F1dGhlbnRpY2F0b3JzIjpbInJlY292ZXJ5IiwidG90cCJdfQ.wMltDeZwTNiBNf-SG2854e5fZlvaRxtsCgdz9YAwlgq2htigZTFWvC4Fx1PO8uT5Rb4CNVcnSZ5N_sqUF_gZ4A";

describe("jwtDecode", () => {
  it("decodes Skalio ID access token", () => {
    const payload = jwtDecode(skalioIdAccessToken);
    expect(payload).toMatchObject({
      aud: "http://skalio.com/id",
      scope: "access",
      roles: expect.any(Array),
    });
  });

  it("decodes SKP access token", () => {
    const payload = jwtDecode(skpAccessToken);
    expect(payload).toMatchObject({
      aud: "http://skalio.com/skp",
      email: "js@skalio.com",
      scope: "access",
    });
  });

  it("decodes MFA token", () => {
    const payload = jwtDecode(mfaToken);
    expect(payload).toMatchObject({
      scope: "mfa",
      locale: "en-US",
    });
  });
});

describe("determineToken", () => {
  it("returns AccessTokenSkalioId type", () => {
    const decoded = jwtDecode(skalioIdAccessToken);
    const result = determineToken(decoded);
    expect(result?.scope).toBe("access");
    expect(result?.aud).toBe("http://skalio.com/id");
  });

  it("returns AccessTokenSkp type", () => {
    const decoded = jwtDecode(skpAccessToken);
    const result = determineToken(decoded);
    expect(result?.scope).toBe("access");
    expect(result?.aud).toBe("http://skalio.com/skp");
  });

  it("returns MfaToken type", () => {
    const decoded = jwtDecode(mfaToken);
    const result = determineToken(decoded);
    expect(result?.scope).toBe("mfa");
  });
});
