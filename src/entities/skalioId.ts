export interface SkalioIdEnvironment {
  baseUrlId: string;
  baseUrlSkp: string;
  baseUrlDrive: string;
  availableLocales: string[];
  onPremises: boolean;
  productName: string;
  productUrl: string;
  providerName: string;
  providerUrl: string;
  supportContact: string;
  organizationProfile: OrganizationProfile;
  oidcSettings: OidcSettings;
  limitations: Limitations;
}

export interface OrganizationProfile {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  postCode?: string;
  city?: string;
  state?: string;
  country?: string;
  phoneNumber?: string;
  locale?: string;
  timeZone?: string;
  globalSignature?: string;
  legalNoticeUrl?: string;
  privacyPolicyUrl?: string;
  uid: string;
  hostname?: string;
  inactiveHostnames: string[];
  assets: OrganizationAsset[];
  mfaRequired: boolean;
}

export type OrganizationAsset = "logo" | "theme";

export interface OidcSettings {
  redirectUrl: string;
  clients: OidcClient[];
}

export interface OidcClient {
  type: "microsoft" | "google" | "apple" | "keycloak";
  issuer: string;
  name?: string;
  clientId: string;
}

export interface Limitations {
  orgUid: string;
  serviceEnabled: boolean;
  users: number;
  transferVolumeGb: number;
  storageVolumeGb: number;
  gdprContract: boolean;
  secureSpaces: boolean;
  newTransferLimit: number;
  newTransferDrainRate: number;
  newTransferReceiversLimit: number;
  adminPortal: boolean;
}

export interface AuthRequest {
  email: string;
  type: "bcrypt" | "totp" | "sms" | "u2f" | "recovery";
  key: string;
}

export interface TokenResponse {
  token: string;
}

export interface Token {
  iss: string;
  sub: string;
  aud: TokenAudience;
  exp: number;
  scope: TokenScope;
}

export type TokenScope =
  | "idtoken"
  | "uidtoken"
  | "preflight"
  | "mfa"
  | "access"
  | "park";

export type TokenAudience =
  | "http://skalio.com/id"
  | "http://skalio.com/uid"
  | "http://skalio.com/spaces"
  | "http://skalio.com/skp"
  | "http://skalio.com/drive";

export interface IdToken extends Token {
  scope: Extract<TokenScope, "idtoken">;
  iat: number;
  jti: string;
  ver: string;
  locale: string;
  zoneinfo: string;
  email_verified: boolean;
  roles: string[];
  // http://skalio.com/org_id
  // http://skalio.com/auth_level
  email: string;
}

export interface MfaToken extends Token {
  scope: Extract<TokenScope, "mfa">;
  locale: string;
  //http://skalio.com/authenticators string[]
}

export type AccessToken = AccessTokenSkalioId | AccessTokenSkp;

export interface AccessTokenSkalioId extends Token {
  scope: Extract<TokenScope, "access">;
  aud: Extract<TokenAudience, "http://skalio.com/id">;
}

export interface AccessTokenSkp extends Token {
  scope: Extract<TokenScope, "access">;
  aud: Extract<TokenAudience, "http://skalio.com/skp">;
  // http://skalio.com/hostname string: The token is tied to a specific hostname
}

export interface EmailAddress {
  address: string;
  primary: boolean;
  verified: boolean;
  removeAt?: string;
}
