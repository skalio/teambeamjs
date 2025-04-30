interface SkpEnvironment {
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

interface Expiration {
  values: number[];
  default: number;
}
 export { Expiration, SkpEnvironment };

