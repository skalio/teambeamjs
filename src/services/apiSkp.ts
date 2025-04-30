import axios, { AxiosInstance } from "axios";
import { SkpEnvironment } from "../entities/skp.js";

const basePathSkp: string = "/api/skp/v1";

// =============================================================================
//                                skp-server
// =============================================================================

class SkpApi {
  protected apiClient: AxiosInstance;

  constructor({ host }: { host: string }) {
    this.apiClient = axios.create({
      baseURL: `${host}${basePathSkp}`,
      headers: { "Content-Type": "application/json" },
    });
  }

  async fetchEnvironment(): Promise<SkpEnvironment> {
    const response = await this.apiClient.get<SkpEnvironment>("/environment");
    return response.data;
  }
}

export function createSkpApi({ host }: { host: string }): SkpApi {
  return new SkpApi({ host: host });
}
// =============================================================================
//                                skalio ID
// =============================================================================
