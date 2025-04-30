import {
    AccessToken,
    AccessTokenSkalioId,
    AccessTokenSkp,
    IdToken,
    MfaToken,
    Token,
} from "../entities/skalioId.js";

/**
 * Decodes a JWT (header.payload.signature) and returns the payload as an object.
 */
export function jwtDecode(token: string): Object {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }

  // Payload is the second part
  const payload = parts[1];

  // Decode from base64
  const jsonStr = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(jsonStr) as Object;
}

export function determineToken(decodedJwt: Object): Token | undefined {
  if ("scope" in decodedJwt !== true) return;
  const token = decodedJwt as Token;
  switch (token.scope) {
    case "uidtoken":
    case "preflight":
    case "park":
      return token;
    case "idtoken":
      return token as IdToken;
    case "mfa":
      return token as MfaToken;
    case "access": {
      const accessToken = token as AccessToken;
      switch (accessToken.aud) {
        case "http://skalio.com/id":
          return accessToken as AccessTokenSkalioId;
        case "http://skalio.com/skp":
          return accessToken as AccessTokenSkp;
        default:
          return;
      }
    }
    default:
      const exhaustiveCheck: never = token.scope;
      throw new Error(`Unhandled color case: ${exhaustiveCheck}`);
  }
}
