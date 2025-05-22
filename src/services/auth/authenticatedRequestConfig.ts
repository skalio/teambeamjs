import { AxiosRequestConfig } from "axios";
import { AuthType } from "./authType.js";

export interface AuthenticatedRequestConfig extends AxiosRequestConfig {
  authType?: AuthType;
  _retry?: boolean;
}
