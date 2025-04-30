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
    console.log(this.store.path);
  }

  clear(): void {
    this.store.clear();
  }
}

export const config = new ConfigService();
