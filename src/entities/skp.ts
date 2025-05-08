export interface SkpEnvironment {
  server_version: number;
  storagehostIdx: number;
  product_name: string;
  product_url: URL;
  provider_name: string;
  provider_url: URL;
  data_privacy_url_de: URL;
  data_privacy_url_en: URL;
  system_status_url: URL;
  available_lang: string[];
  offered_clients: string[];
  motd: string;
  show_remote_access: boolean;
  password_autocomplete: boolean;
  self_register_promo: boolean;
  freemiumEnabled: boolean;
  locale: string;
  mypublic_enabled: boolean;
  privacyModeEnabled: boolean;
  keepMeLoggedInChecked: boolean;
  minimumPasswordLength: number;
  extendedPasswordCriteriaEnabled: boolean;
  transferPasswordRequired: boolean;
  ttlEnabled: boolean;
  priorityEnabled: boolean;
  recipientAuthenticationEnabled: boolean;
  inviteEnabled: boolean;
  portalUrl: URL;
  timeZone: string;
  customerName: string;
  expiration: Expiration;
  privacyStatementUrl?: URL;
  legalNoticeUrl?: URL;
  browserLanguage: string;
  self_register_enabled: boolean;
  self_register_url?: URL;
  passwordRecoveryEnabled: boolean;
  passwordRecoveryMessage: string;
  lang: string;
}

export interface AccessTokenResponse {
  token: string;
  adminunit?: Adminunit;
}

export interface Adminunit {
  idx: number;
  uid: string;
  customerName?: string;
  hostname: string;
}

export interface Expiration {
  values: number[];
  default: number;
}

export interface ReservationRequest {
  subject?: string;
  description?: string;

  recipientNotification?: boolean;
  deliveryNotification?: boolean;
  recipientAuthentication?: false;
  ttl?: number;
  priority?: number;
  signatureId?: number;
  folderIdx?: number;
  receivers?: TransferReceiver[];
  groups?: ReceiverGroup[];
  protection?: TransferProtection;
  files: ReservationRequestFile[];
}

export type RecipientType = "to" | "cc" | "bcc";

export interface TransferReceiver {
  name?: string;
  email: string;
  type: RecipientType;
}

export interface ReceiverGroup {
  idx: number;
  type: RecipientType;
}

export interface TransferProtection {
  enabled: boolean;
  key: string;
}

export interface ReservationRequestFile {
  name: string;
  size: number;
  id: string;
}

export interface ReservationResponseFile extends ReservationRequestFile {
  objectId: string;
}

export interface ReservationResponse {
  token: string;
  files: ReservationResponseFile[];
  totalSize: number;
}

export interface ReservationConfirmResult {
  result: [{ recipientId: string }];
}

export interface UploadInfo {
  size: number;
  chunkStart: number;
  chunkEnd: number;
  totalSize: number;
}
