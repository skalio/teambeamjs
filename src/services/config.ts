import Conf from "conf";

export interface ConfigSchema {
  host: string;
  email: string;
  password: string;
  idToken: string;
  otp?: string;
}

export class ConfigService {
  private store = new Conf<ConfigSchema>({ projectName: "teambeamjs" });

  get<K extends keyof ConfigSchema>(key: K): ConfigSchema[K] | undefined {
    return this.store.get(key);
  }

  set(values: Partial<ConfigSchema>): void {
    this.store.set(values);
  }

  clear(): void {
    this.store.clear();
  }

  assertFullyConfigured(): void {
    const missing = ["host", "email", "idToken"].filter(
      (key) => !this.get(key as keyof ConfigSchema)
    );
    if (missing.length > 0) {
      throw new Error("Incomplete config: please run 'teambeamjs init' first");
    }
  }
}

export const config = new ConfigService();
