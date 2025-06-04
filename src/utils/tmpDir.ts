import * as os from "os";
import * as path from "path";
import { constants } from "../core/constants.js";

export function getTmpDir(): string {
  return path.join(os.tmpdir(), constants.tempDirName);
}
