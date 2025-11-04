#!/usr/bin/env node

// src/cli/index.ts
import {
  Command as Command6,
  InvalidArgumentError as InvalidArgumentError2,
  InvalidOptionArgumentError as InvalidOptionArgumentError2
} from "@commander-js/extra-typings";
import colors8 from "ansi-colors";
import { isAxiosError } from "axios";

// src/services/config.ts
import Conf from "conf";
var ConfigService = class {
  constructor() {
    this.store = new Conf({ projectName: "teambeamjs" });
  }
  get(key) {
    return this.store.get(key);
  }
  set(values) {
    this.store.set(values);
  }
  clear() {
    this.store.clear();
  }
  assertFullyConfigured() {
    const missing = ["host", "email", "idToken"].filter(
      (key) => !this.get(key)
    );
    if (missing.length > 0) {
      throw new Error("Incomplete config: please run 'teambeamjs init' first");
    }
  }
};
var config = new ConfigService();

// src/utils/symbols.ts
import colors from "ansi-colors";
var symbols = {
  tick: "\u2714",
  info: "\u2139",
  warning: "\u26A0",
  cross: "\u2718",
  squareSmall: "\u25FB",
  squareSmallFilled: "\u25FC",
  circle: "\u25EF",
  circleFilled: "\u25C9",
  circleDotted: "\u25CC",
  circleDouble: "\u25CE",
  circleCircle: "\u24DE",
  circleCross: "\u24E7",
  circlePipe: "\u24BE",
  radioOn: "\u25C9",
  radioOff: "\u25EF",
  checkboxOn: "\u2612",
  checkboxOff: "\u2610",
  checkboxCircleOn: "\u24E7",
  checkboxCircleOff: "\u24BE",
  pointer: "\u276F",
  triangleUpOutline: "\u25B3",
  triangleLeft: "\u25C0",
  triangleRight: "\u25B6",
  triangleLeftOutlined: "\u25C1",
  triangleRightOutlined: "\u25B7",
  lozenge: "\u25C6",
  lozengeOutline: "\u25C7",
  hamburger: "\u2630",
  smiley: "\u32E1",
  mustache: "\u0DF4",
  star: "\u2605",
  play: "\u25B6",
  nodejs: "\u2B22",
  oneSeventh: "\u2150",
  oneNinth: "\u2151",
  oneTenth: "\u2152",
  fullHeightBar: "\u2502"
};
var coloredSymbols = {
  tick: colors.green("\u2714"),
  info: colors.yellow("\u25B6"),
  warning: colors.red.bold("\u26A0"),
  cross: colors.red.bold("\u2718"),
  stepPrefix: "\u250C",
  stepInfo: "\u25C7",
  stepGap: "\u2502",
  stepActive: colors.cyan("\u25C7"),
  stepSuccess: colors.green("\u25C6"),
  stepDone: colors.green("\u2714"),
  stepSuffix: "\u2514"
};

// src/cli/commands/copy.ts
import { Command } from "@commander-js/extra-typings";
import colors2 from "ansi-colors";
import cliProgress from "cli-progress";

// src/services/apiSkp.ts
import axios2 from "axios";

// src/core/constants.ts
var constants = {
  initialChunkSize: 1e3 * 1e3 * 50,
  // 50MB
  maxChunkSize: 500 * 1e3 * 1e3,
  // 500 MB
  idealChunkUploadDuration: 60,
  // 60 seconds
  maxUploadRetries: 10,
  maxDelayBetweenRetriesSec: 20,
  // 20 seconds
  tempDirName: "teambeamjs",
  basePathSkalioId: "/api/id/v3",
  basePathSkp: "/api/skp/v1",
  defaultHost: "https://free.teambeam.de"
};

// src/services/auth/authManager.ts
var AuthManager = class {
  constructor(getIdToken, tokenApiClient) {
    this.getIdToken = getIdToken;
    this.tokenApiClient = tokenApiClient;
    this.accessToken = null;
  }
  /**
   * Returns an access token, fetching a new one if none is cached in-memory.
   *
   * @returns Anaccess token (either cached or freshly fetched)
   */
  async getAccessToken() {
    if (this.accessToken) {
      return this.accessToken;
    }
    const idToken = this.getIdToken();
    if (!idToken) throw new Error("No ID token available");
    const token = await this.tokenApiClient.fetchAccessToken(idToken);
    this.accessToken = token;
    return token;
  }
  /**
   * Clears the cached access token, forcing the next call to fetch a new one.
   */
  clearAccessToken() {
    this.accessToken = null;
  }
};

// src/services/auth/authRetryInterceptor.ts
import axios from "axios";
function createAuthRetryInterceptor(authManager) {
  return async (error) => {
    const config2 = error.config;
    if (error.response?.status === 401 && config2.authType === "access_token" /* AccessToken */ && !config2._isRetry) {
      config2._isRetry = true;
      authManager.clearAccessToken();
      try {
        const newToken = await authManager.getAccessToken();
        config2.headers = {
          ...config2.headers,
          Authorization: `Bearer ${newToken}`
        };
        return axios(config2);
      } catch {
      }
    }
    return Promise.reject(error);
  };
}

// src/services/auth/authTokenInjector.ts
function createAuthTokenInjectorInterceptor(authManager, getIdToken) {
  return async (config2) => {
    const req = config2;
    switch (req.authType) {
      case "id_token" /* IdToken */: {
        const idToken = getIdToken();
        if (!idToken) throw new Error("No ID token available");
        req.headers = {
          ...req.headers,
          Authorization: `Bearer ${idToken}`
        };
        break;
      }
      case "access_token" /* AccessToken */: {
        const accessToken = await authManager.getAccessToken();
        req.headers = {
          ...req.headers,
          Authorization: `Bearer ${accessToken}`
        };
        break;
      }
    }
    return req;
  };
}

// src/services/apiSkp.ts
function createSkpApi(config2, overrideHost) {
  return new SkpApi(
    overrideHost ?? config2.get("host"),
    () => config2.get("idToken")
  );
}
var SkpApi = class {
  constructor(host, getIdToken) {
    const baseURL = `${host}${constants.basePathSkp}`;
    const tokenClient = new SkpTokenClient(baseURL);
    const authManager = new AuthManager(getIdToken, tokenClient);
    this.axios = axios2.create({ baseURL });
    this.axios.interceptors.request.use(
      createAuthTokenInjectorInterceptor(authManager, getIdToken)
    );
    this.axios.interceptors.response.use(
      void 0,
      createAuthRetryInterceptor(authManager)
    );
  }
  async fetchEnvironment() {
    const response = await this.axios.get("/environment", {
      authType: "none" /* None */
    });
    return response.data;
  }
  async createReservation(request) {
    const response = await this.axios.post(
      "/reservations",
      request,
      { authType: "access_token" /* AccessToken */ }
    );
    return response.data;
  }
  async confirmReservation(reservationId) {
    const response = await this.axios.post(
      `/reservations/${reservationId}/confirm`,
      void 0,
      { authType: "access_token" /* AccessToken */ }
    );
    return response.data;
  }
  async uploadFileChunk({
    startByte,
    endByte,
    formData,
    totalBytes,
    onUploadProgress
  }) {
    let contentRange;
    if (startByte !== void 0 && endByte !== void 0 && totalBytes !== void 0) {
      contentRange = `bytes ${startByte}-${endByte - 1}/${totalBytes}`;
    }
    const response = await this.axios.postForm(
      "/upload",
      formData,
      {
        headers: contentRange ? { "Content-Range": contentRange } : void 0,
        onUploadProgress,
        authType: "access_token" /* AccessToken */
      }
    );
    return response.data;
  }
  async fetchUploadedFileSize(objectId, reservationToken) {
    const response = await this.axios.head(`/upload/${objectId}`, {
      headers: {
        "X-Skp-Auth": `${reservationToken}`
      },
      authType: "access_token" /* AccessToken */
    });
    return Number(response.headers["content-length"] ?? "0");
  }
  async fetchTransfers({
    location,
    search
  }) {
    const response = await this.axios.get(
      "/transfers",
      {
        params: { location, search },
        authType: "access_token" /* AccessToken */
      }
    );
    return response.data.transfers;
  }
  async fetchTransfer(recipientId) {
    const response = await this.axios.get(
      `transfers/${recipientId}`,
      { authType: "access_token" /* AccessToken */ }
    );
    return response.data;
  }
  async copyTransferToArchive({
    recipientId,
    folderIdx
  }) {
    const response = await this.axios.post(
      `transfers/${recipientId}/copy`,
      { idx: folderIdx },
      { authType: "access_token" /* AccessToken */ }
    );
    return response.data;
  }
  async streamTransferFile({
    file,
    onUploadProgress
  }) {
    const response = await this.axios.get(file.url, {
      responseType: "stream",
      onDownloadProgress: onUploadProgress,
      authType: "access_token" /* AccessToken */
    });
    return response.data;
  }
};
var SkpTokenClient = class {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }
  async fetchAccessToken(idToken) {
    const response = await axios2.post(
      `${this.baseUrl}/auth/access`,
      void 0,
      {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      }
    );
    return response.data.token;
  }
};

// src/utils/runner.ts
import ora from "ora";

// src/utils/delay.ts
async function delay(seconds) {
  await new Promise((resolve2) => setTimeout(resolve2, seconds * 1e3));
}

// src/utils/output.ts
function logTime() {
  const now = /* @__PURE__ */ new Date();
  const time = now.toLocaleTimeString("en-GB", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  console.log(`[${time}]`);
}

// src/utils/runner.ts
async function runWithOptionalInterval(interval, fn) {
  const watch = interval !== void 0;
  do {
    if (watch) {
      logTime();
    }
    await fn();
    if (watch) {
      const spinner = ora(`Next run in ${interval}s...`).start();
      await delay(interval);
      spinner.stop();
    }
  } while (watch);
}

// src/cli/commands/copy.ts
function buildCopyCommand(config2) {
  return new Command("copy").description("Copy transfers from your inbox to an archive folder").requiredOption(
    "-f, --folder <folderIdx>",
    "Archive folder ID where to copy the transfer into",
    parseInt
  ).option(
    "-i, --interval <interval>",
    "Run in loop, with delay of <interval> seconds between checks",
    parseInt
  ).action(async (options) => {
    config2.assertFullyConfigured();
    const apiSkp = createSkpApi(config2);
    const { folder: folderIdx, interval } = options;
    await runWithOptionalInterval(interval, async () => {
      console.log(`${coloredSymbols.stepPrefix} Fetching transfers...`);
      var transfers = await apiSkp.fetchTransfers({
        location: "received"
      });
      transfers = transfers.filter((t) => t.isUnread);
      if (transfers.length !== 0) {
        console.log(
          `${coloredSymbols.stepSuccess} Found ${transfers.length} transfer${transfers.length > 1 ? "s" : ""} to copy`
        );
        console.log(`${coloredSymbols.stepGap}`);
        console.log(
          `${coloredSymbols.stepGap} Copying into archive folder ${folderIdx}...`
        );
        const bar = new cliProgress.SingleBar(
          {
            clearOnComplete: false,
            hideCursor: true,
            format: `{prefix} [{bar}] {value}/{total} transfer${transfers.length > 1 ? "s" : ""}`
          },
          cliProgress.Presets.shades_classic
        );
        bar.start(transfers.length, 0, {
          prefix: coloredSymbols.stepActive
        });
        for (const transfer of transfers) {
          await apiSkp.copyTransferToArchive({
            recipientId: transfer.recipientId,
            folderIdx
          });
          bar.increment();
        }
        bar.update(transfers.length, { prefix: coloredSymbols.stepSuccess });
        bar.stop();
        console.log(`${coloredSymbols.stepGap}`);
        console.log(coloredSymbols.stepSuffix + colors2.green(" Done!\n"));
      } else {
        console.log(`${coloredSymbols.stepGap}`);
        console.log(`${coloredSymbols.stepSuffix} No new transfers found
`);
      }
    });
  });
}

// src/cli/commands/debug.ts
import { Command as Command2 } from "@commander-js/extra-typings";
import colors3 from "ansi-colors";
import fs from "fs-extra";
import open from "open";
import ora2 from "ora";

// src/utils/jwt.ts
function jwtDecode(token) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid JWT format");
  }
  const payload = parts[1];
  const jsonStr = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
  return JSON.parse(jsonStr);
}
function determineToken(decodedJwt) {
  if ("scope" in decodedJwt !== true) return;
  const token = decodedJwt;
  switch (token.scope) {
    case "uidtoken":
    case "preflight":
    case "park":
      return token;
    case "idtoken":
      return token;
    case "mfa":
      return token;
    case "access": {
      const accessToken = token;
      switch (accessToken.aud) {
        case "http://skalio.com/id":
          return accessToken;
        case "http://skalio.com/skp":
          return accessToken;
        default:
          return;
      }
    }
    default:
      const exhaustiveCheck = token.scope;
      throw new Error(`Unhandled case over token scope switch: ${exhaustiveCheck}`);
  }
}

// src/utils/tmpDir.ts
import * as os from "os";
import * as path from "path";
function getTmpDir() {
  return path.join(os.tmpdir(), constants.tempDirName);
}

// src/cli/commands/debug.ts
function addDebugCommands(program2) {
  const tmpDir = getTmpDir();
  const tmpBase = new Command2("tmpdir").aliases(["tmp", "tempdir", "temp"]);
  tmpBase.command("open").description("Open the directory for temporary files created by teambeamjs").action(async () => {
    open(tmpDir);
  });
  tmpBase.command("clean").description("Remove all leftover temporary files").action(async () => {
    console.log(coloredSymbols.stepPrefix);
    console.log(
      `${coloredSymbols.stepInfo} Clearing temporary files in ${tmpDir}`
    );
    console.log(coloredSymbols.stepGap);
    if (!await fs.pathExists(tmpDir)) {
      console.log(
        `${coloredSymbols.info} No temporary files found. Nothing to clean.`
      );
      console.log(coloredSymbols.stepSuffix);
      return;
    }
    const files = await fs.readdir(tmpDir);
    if (files.length === 0) {
      console.log(
        `${coloredSymbols.info} No temporary files found. Nothing to clean.`
      );
      console.log(coloredSymbols.stepSuffix);
      return;
    }
    const spinner = ora2(
      `Found ${files.length} temporary file(s). Cleaning up...`
    );
    spinner.start();
    for (const file of files) {
      const fullPath = `${tmpDir}/${file}`;
      await fs.remove(fullPath);
    }
    spinner.succeed(
      `Successfully cleaned temporary directory by removing ${files.length} files.`
    );
    console.log(coloredSymbols.stepSuffix);
  });
  const l = Buffer.from("dGVhbWJlYW1qcw==", "base64").toString();
  const z4 = String.fromCharCode;
  const bw = 26;
  const t = z4(9556) + "\u2550".repeat(bw) + z4(9559);
  const s = z4(9553);
  const b = z4(9562) + "\u2550".repeat(bw) + z4(9565);
  const ll = (s2) => "         " + s2;
  const p = " ".repeat(bw);
  const m = s + p + s;
  const d = z4(9617);
  const dd = d + d;
  const sp = " ";
  const pad5 = " ".repeat(5);
  const c = s + pad5 + dd + sp + l + sp + dd + pad5 + s;
  const bx = [t, m, c, m, b].map(ll);
  const cfns = [
    colors3.redBright,
    colors3.yellowBright,
    colors3.greenBright,
    colors3.cyanBright,
    colors3.blueBright,
    colors3.magentaBright
  ].map((c2) => c2.bold);
  const cmd = String.fromCharCode(112, 97, 114, 116, 121);
  const fun = new Command2(cmd).action(() => {
    let i = 0;
    process.stdout.write("\x1B[?25l");
    process.stdout.write("\x1B[0;0H\x1B[0J");
    const interval = setInterval(() => {
      const colorFn = cfns[i % cfns.length];
      process.stdout.write("\x1B[0;0H");
      console.log("\n");
      for (const line of bx) {
        console.log("   " + colorFn(line));
      }
      i++;
    }, 100);
    setTimeout(() => {
      clearInterval(interval);
      process.stdout.write("\x1B[0;0H\x1B[0J");
      process.stdout.write("\x1B[?25h");
      process.exit(0);
    }, 8e3);
  });
  const configBase = new Command2("config").description("Inspect or open the config used by teambeamjs").action(() => {
    const store = config["store"];
    const path5 = store.path;
    console.log(colors3.cyanBright.bold("teambeamjs Config Overview\n"));
    console.log(colors3.gray("Config file location:"));
    console.log(`  ${path5}
`);
    const conf = store.store;
    if (!conf || Object.keys(conf).length === 0) {
      console.log(
        coloredSymbols.warning + colors3.yellow(" No config found or config is empty.\n")
      );
    } else {
      console.log(colors3.cyanBright("Current Config:"));
      console.log(JSON.stringify(conf, null, 2), "\n");
      if (conf.idToken) {
        try {
          const decoded = jwtDecode(conf.idToken);
          console.log(colors3.cyanBright("Decoded ID Token Claims:"));
          console.log(JSON.stringify(decoded, null, 2), "\n");
        } catch (e) {
          console.log(colors3.red("Failed to decode ID token."));
        }
      }
    }
    try {
      config.assertFullyConfigured();
      console.log(coloredSymbols.tick + colors3.green(" Config is valid."));
    } catch (e) {
      console.log(
        coloredSymbols.warning + colors3.red(` Config is invalid: ${e.message}`)
      );
    }
  });
  configBase.command("open").description("Open the config file in the default editor").action(() => {
    const path5 = config["store"].path;
    if (path5) {
      open(path5);
    } else {
      console.log(`${coloredSymbols.info} No config file found.`);
    }
  });
  configBase.command("clear").aliases(["clean", "delete"]).description("Remove all saved config values").action(() => {
    config.clear();
    console.log(
      coloredSymbols.tick + colors3.green(" Cleared all saved config values.")
    );
  });
  [tmpBase, fun, configBase].forEach(
    (cmd2) => program2.addCommand(cmd2, { hidden: true })
  );
}

// src/cli/commands/download.ts
import { Command as Command3 } from "@commander-js/extra-typings";
import colors4 from "ansi-colors";
import cliProgress2 from "cli-progress";
import downloadsFolder from "downloads-folder";
import * as fs2 from "fs";
import * as path2 from "path";

// src/services/apiSkalioId.ts
import axios3 from "axios";
function createSkalioIdApi(config2, overrideHost) {
  return new SkalioIdApi(
    overrideHost ?? config2.get("host"),
    () => config2.get("idToken")
  );
}
var SkalioIdApi = class {
  constructor(host, getIdToken) {
    const baseURL = `${host}${constants.basePathSkalioId}`;
    const tokenClient = new SkalioIdTokenClient(baseURL, getIdToken);
    const authManager = new AuthManager(getIdToken, tokenClient);
    this.axios = axios3.create({
      baseURL,
      headers: { "Content-Type": "application/json" }
    });
    this.axios.interceptors.request.use(
      createAuthTokenInjectorInterceptor(authManager, getIdToken)
    );
    this.axios.interceptors.response.use(
      void 0,
      createAuthRetryInterceptor(authManager)
    );
  }
  async fetchEnvironment() {
    const response = await this.axios.get("/environment", {
      authType: "none" /* None */
    });
    return response.data;
  }
  async doesAccountExist(emailAddress) {
    const response = await this.axios.post(
      "/auth/exists",
      { address: emailAddress },
      {
        validateStatus: (status) => status >= 200 && status < 300 || status === 404,
        authType: "none" /* None */
      }
    );
    return response.status === 200;
  }
  async login(input) {
    const requestData = {
      ...input,
      type: "bcrypt"
    };
    const response = await this.axios.post(
      "/auth/login",
      requestData,
      { authType: "none" /* None */ }
    );
    return response.data;
  }
  async provideTotpCode(input, mfaToken) {
    const requestData = {
      ...input,
      type: "totp"
    };
    const response = await this.axios.post(
      "/auth/login",
      requestData,
      {
        headers: { Authorization: `Bearer ${mfaToken}` },
        authType: "none" /* None */
      }
    );
    return response.data;
  }
  async fetchAllEmails() {
    const response = await this.axios.get(
      "/profile/emails",
      {
        authType: "access_token" /* AccessToken */
      }
    );
    return response.data.emails;
  }
};
var SkalioIdTokenClient = class {
  constructor(baseUrl, getIdToken) {
    this.baseUrl = baseUrl;
    this.getIdToken = getIdToken;
  }
  async fetchAccessToken() {
    const response = await axios3.post(
      `${this.baseUrl}/auth/access`,
      void 0,
      {
        headers: {
          Authorization: `Bearer ${this.getIdToken()}`
        }
      }
    );
    return response.data.token;
  }
};

// src/utils/stream.ts
function streamPromise(stream) {
  return new Promise((resolve2, reject) => {
    stream.on("end", () => {
      resolve2();
    });
    stream.on("finish", () => {
      resolve2();
    });
    stream.on("error", (error) => {
      reject(error);
    });
  });
}

// src/cli/commands/download.ts
function buildDownloadCommand(config2) {
  return new Command3("download").description("Download transfers from your inbox").option(
    "-d, --dir <directory>",
    "Path to directory where transfers will be stored"
  ).option(
    "-i, --interval <interval>",
    "Run in loop, with delay of <interval> seconds between checks",
    parseInt
  ).option("-O, --include-old", "Download previously transfers as well", false).option("-S, --include-sent", "Download sent transfers as well", false).option(
    "-F, --use-filename",
    "Store downloaded files using their actual filenames",
    false
  ).action(async (options) => {
    config2.assertFullyConfigured();
    const apiSkp = createSkpApi(config2);
    const apiSkalioId = createSkalioIdApi(config2);
    const targetBaseDir = options.dir ? path2.resolve(options.dir) : path2.join(downloadsFolder(), "transfers");
    const location = options.includeSent ? "sentandreceived" : "received";
    return await runWithOptionalInterval(options.interval, async () => {
      console.log(`${symbols.triangleRightOutlined} Fetching emails...`);
      const emails = await apiSkalioId.fetchAllEmails();
      console.log(`Fetched ${emails.length} emails:`, emails[0]);
      console.log(`${symbols.triangleRightOutlined} Fetching transfers...`);
      var transfers = await apiSkp.fetchTransfers({ location });
      if (!options.includeOld) {
        transfers = transfers.filter((t) => t.isUnread);
      }
      if (transfers.length > 0) {
        console.log(
          `${symbols.triangleRight} ${transfers.length} transfer${transfers.length > 1 ? "s" : ""} found. Downloading...`
        );
        console.log();
        for (const transfer of transfers) {
          console.log(
            `${coloredSymbols.stepPrefix} Transfer ${transfer.recipientId}`
          );
          console.log(coloredSymbols.stepGap);
          const multibar = new cliProgress2.MultiBar(
            {
              clearOnComplete: false,
              hideCursor: true,
              format: "{prefix} File {filename} |" + colors4.cyan("{bar}") + "| {percentage}%"
            },
            cliProgress2.Presets.rect
          );
          const recipientFolder = path2.join(
            targetBaseDir,
            transfer.recipientId
          );
          fs2.mkdirSync(recipientFolder, { recursive: true });
          for (const file of transfer.files) {
            const fileName = options.useFilename ? file.name : file.objectId;
            const filePath = path2.join(recipientFolder, fileName);
            const bar = multibar.create(file.size, 0, {
              filename: fileName,
              prefix: coloredSymbols.stepActive
            });
            const fileStream = await apiSkp.streamTransferFile({
              file,
              onUploadProgress: ({ loaded }) => {
                bar.update(loaded, {
                  prefix: loaded === file.size ? coloredSymbols.stepSuccess : coloredSymbols.stepActive
                });
              }
            });
            const writeStream = fs2.createWriteStream(filePath);
            const out = fileStream.pipe(writeStream);
            await streamPromise(out);
            bar.update(file.size);
            bar.stop();
          }
          multibar.stop();
          const updatedTransfer = await apiSkp.fetchTransfer(
            transfer.recipientId
          );
          const jsonPath = path2.join(recipientFolder, "transfer.json");
          const jsonStream = fs2.createWriteStream(jsonPath);
          jsonStream.write(JSON.stringify(updatedTransfer, null, 2));
          jsonStream.end();
          console.log(coloredSymbols.stepGap);
          console.log(
            `${coloredSymbols.stepSuffix} ${colors4.green("Done!")}`
          );
          console.log();
        }
      } else {
        console.log(`${symbols.triangleRight} No new transfers found`);
      }
      console.log();
    });
  });
}

// src/cli/commands/init.ts
import { Command as Command4 } from "@commander-js/extra-typings";
import colors6 from "ansi-colors";
import { z as z2 } from "zod";

// src/utils/input.ts
import colors5 from "ansi-colors";
import inquirer from "inquirer";
import ora3 from "ora";
import { z } from "zod";

// src/utils/entities.ts
var mapRecipients = (type, list) => list?.map((email) => ({ email, type })) || [];

// src/utils/input.ts
async function getOrPromptInput({
  key,
  message,
  flagValue,
  defaultValue,
  validate
}) {
  if (flagValue !== void 0) {
    if (validate) {
      const result = await validate(flagValue);
      if (result !== true) {
        throw new Error(`Invalid value for --${key}: ${result}`);
      }
    }
    return flagValue;
  }
  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message,
      default: defaultValue,
      validate
    }
  ]);
  return value;
}
async function getOrPromptSecret({
  key,
  message,
  flagValue,
  defaultValue,
  validate
}) {
  if (flagValue !== void 0) {
    if (validate) {
      const result = await validate(flagValue);
      if (result !== true) {
        throw new Error(`Invalid value for --${key}: ${result}`);
      }
    }
    return flagValue;
  }
  if (defaultValue) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `Existing ${key} '${"*".repeat(defaultValue.length)}' found. Overwrite?`,
        default: false
      }
    ]);
    if (!overwrite) {
      if (validate) {
        const spinner = ora3(
          `${message} ${colors5.cyan("*".repeat(defaultValue.length))}`
        );
        spinner.start();
        const result = await validate(defaultValue);
        if (result !== true) {
          spinner.fail();
          throw new Error(`Invalid value for --${key}: ${result}`);
        } else {
          spinner.succeed();
        }
      }
      return defaultValue;
    }
  }
  const { value } = await inquirer.prompt([
    {
      type: "password",
      name: "value",
      message,
      default: defaultValue,
      mask: true,
      validate
    }
  ]);
  return value;
}
async function getOrPromptEditor({
  key,
  message,
  flagValue,
  defaultValue,
  validate
}) {
  if (flagValue !== void 0) {
    if (validate) {
      const result = await validate(flagValue);
      if (result !== true) {
        throw new Error(`Invalid value for --${key}: ${result}`);
      }
    }
    return flagValue;
  }
  const { value } = await inquirer.prompt([
    {
      type: "editor",
      name: "value",
      message,
      default: defaultValue,
      waitForUseInput: true,
      validate
    }
  ]);
  return value;
}
async function promptRecipients() {
  const recipients = [];
  while (recipients.length == 0) {
    for (const type of ["to", "cc", "bcc"]) {
      const emails = await promptRecipientsOfType(type);
      recipients.push(...mapRecipients(type, emails));
    }
    if (recipients.length == 0)
      console.error("Please provide at least one recipient");
  }
  return recipients;
}
async function promptRecipientsOfType(type) {
  const { addRecipients } = await inquirer.prompt([
    {
      type: "confirm",
      name: "addRecipients",
      message: `$Add recipients of tyoe '${type}'?`,
      default: false
    }
  ]);
  if (!addRecipients) {
    return [];
  }
  let recipients = [];
  while (true) {
    const { email } = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: `Add recipient (${type}):`,
        validate: (input) => {
          if (input.length == 0) return "Please enter an email address";
          if (z.string().email().safeParse(input).error)
            return "Please enter a valid email address";
          return true;
        }
      }
    ]);
    recipients.push(email);
    const { addMore } = await inquirer.prompt([
      {
        type: "confirm",
        name: "addMore",
        message: `Transfer has ${recipients.length} recipient${recipients.length === 1 ? "" : "s"} of type '${type}'. Add more?`,
        default: false
      }
    ]);
    if (!addMore) {
      console.log(
        `Added ${recipients.length} '${type}' recipients:`,
        recipients.reduce((prev, curr) => prev + ", " + curr),
        ""
      );
      return recipients;
    }
  }
}
async function getOrPromptTtl({
  flagValue,
  defaultValue,
  values
}) {
  if (flagValue !== void 0) {
    const schema = z.union([
      z.number().refine((num) => values.includes(num), {
        message: `TTL value must be one of the allowed TTL values: ${values.join(", ")}.`
      }),
      z.undefined()
    ]);
    const result = schema.safeParse(flagValue);
    if (result.error) {
      throw Error(result.error.issues[0].message);
    } else {
      return flagValue;
    }
  } else {
    const input = (await inquirer.prompt([
      {
        type: "list",
        name: "ttl",
        message: `TTL:`,
        choices: values.slice().sort((a, b) => a - b).map((ttl) => ({
          name: `${ttl} day${ttl > 1 ? "s" : ""}`,
          value: ttl
        })),
        default: values.indexOf(defaultValue)
      }
    ])).ttl;
    return input;
  }
}

// src/utils/totp.ts
import { authenticator } from "otplib";
function generateTotpCode(secret) {
  return authenticator.generate(secret);
}

// src/cli/commands/init.ts
function buildInitCommand(config2) {
  return new Command4("init").description("Initialize configuration for teambeamjs").option("-H, --host <host>", "API server hostname").option("-e, --email <email>", "Email address").option("-p --password <password>", "Password").option("-o --otp <otp>", "OTP secret (Base32)").action(async (options) => {
    const previous = {
      host: config2.get("host"),
      email: config2.get("email"),
      password: config2.get("password"),
      otp: config2.get("otp")
    };
    var environment;
    const host = await getOrPromptInput({
      key: "host",
      message: "API Host:",
      flagValue: options.host,
      defaultValue: previous.host ?? constants.defaultHost,
      validate: async (input) => {
        if (z2.string().url().safeParse(input).error)
          return "Must be a valid URL";
        if (z2.string().url().refine((val) => {
          try {
            const url = new URL(val);
            return url.pathname === "/" && url.search === "" && url.hash === "" && !val.endsWith("/");
          } catch {
            return false;
          }
        }).safeParse(input).error)
          return "Must be a valid URL with no path and no trailing slash";
        const apiSkalioId2 = createSkalioIdApi(config2, input);
        const apiSkp = createSkpApi(config2, input);
        let environmentSkp;
        try {
          environmentSkp = await apiSkp.fetchEnvironment();
          environment = await apiSkalioId2.fetchEnvironment();
          return true;
        } catch (error) {
          if (environmentSkp && environment === void 0) {
            return `This version of teambeamjs is not compatible anymore with the provided TeamBeam server.
Consider downgrading to a previous version.`;
          } else {
            return `No TeamBeam server found at provided host. Error: '${error}'`;
          }
        }
      }
    });
    config2.set({ host });
    const apiSkalioId = createSkalioIdApi(config2);
    const email = await getOrPromptInput({
      key: "email",
      message: "Email:",
      flagValue: options.email,
      defaultValue: previous.email,
      validate: async (input) => {
        if (!z2.string().email().safeParse(input).success)
          return "Invalid email format";
        const exists = await apiSkalioId.doesAccountExist(input);
        return exists || "Email does not exist on server";
      }
    });
    let idToken = null;
    let mfaToken = null;
    let mfaRequired = false;
    const password = await getOrPromptSecret({
      key: "password",
      message: "Password:",
      flagValue: options.password,
      defaultValue: previous.password,
      validate: async (input) => {
        if (!input) return "Password is required";
        try {
          const { token } = await apiSkalioId.login({ email, key: input });
          const decodedJwt = jwtDecode(token);
          const typedToken = determineToken(decodedJwt);
          if (typedToken?.scope == "idtoken") {
            mfaRequired = false;
            mfaToken = null;
            idToken = token;
            return true;
          } else if (typedToken?.scope == "mfa") {
            mfaRequired = true;
            mfaToken = token;
            idToken = null;
            return true;
          } else {
            return `Something went wrong: unexpected token response '${decodedJwt}'`;
          }
        } catch (error) {
          return `Login with provided password failed: ${error}`;
        }
      }
    });
    if (options.otp && mfaToken === null) {
      if (idToken === null) {
        throw new Error(
          "StateError: should have obtained either ID- or MFA token by now"
        );
      } else {
        console.log(
          coloredSymbols.info + colors6.yellow(
            ` OTP secret '${options.otp}' provided but not needed for account '${email}', ignoring
`
          )
        );
      }
    }
    let otp = options.otp ?? previous.otp ?? "";
    if (mfaRequired) {
      otp = await getOrPromptSecret({
        key: "otp",
        message: "OTP Secret:",
        flagValue: options.otp,
        defaultValue: previous.otp,
        validate: async (val) => {
          if (!val) return "Please provide your TOTP secret";
          const sanitized = val.replace(/\s+/g, "");
          const code = generateTotpCode(sanitized);
          try {
            const { token } = await apiSkalioId.provideTotpCode(
              { email, key: code },
              mfaToken
            );
            const decodedJwt = jwtDecode(token);
            const typedToken = determineToken(decodedJwt);
            if (typedToken?.scope != "idtoken")
              return `Something went wrong: unexpected token response '${decodedJwt}'`;
            idToken = token;
            return true;
          } catch (error) {
            return `Login with provided TOTP code failed: ${error}`;
          }
        }
      });
      otp = otp.replace(/\s+/g, "");
    }
    if (idToken === null)
      throw new Error("StateError: should have obtained idToken by now");
    console.log(
      `${coloredSymbols.stepDone} ${colors6.green("Successfully logged in")}`
    );
    config2.set({ host, email, password, idToken, otp });
    console.log(
      `${coloredSymbols.stepDone} ${colors6.green("Config has been saved")} at ${colors6.italic(config2["store"].path)}`
    );
  });
}

// src/cli/commands/upload.ts
import {
  Command as Command5,
  InvalidArgumentError,
  InvalidOptionArgumentError
} from "@commander-js/extra-typings";
import colors7 from "ansi-colors";
import cliProgress3 from "cli-progress";
import fs5 from "fs-extra";
import ora4, { oraPromise } from "ora";
import path4 from "path";
import { z as z3 } from "zod";

// src/services/transferUpload.ts
import axios4 from "axios";
import FormData from "form-data";
import fs3 from "fs";
var TransferUploadService = class {
  constructor(skpApi) {
    this.skpApi = skpApi;
  }
  async uploadTransfer({
    filePaths,
    reservationRequest,
    onProgress,
    onReservationCreated,
    onReservationConfirm
  }) {
    const totalFilesSize = reservationRequest.files.reduce(
      (acc, file) => acc + file.size,
      0
    );
    onProgress(0);
    let completedUploadSize = 0;
    let currentUploadSize = 0;
    const pushProgress = (uploadedBytes, startByte) => {
      currentUploadSize = completedUploadSize + startByte + uploadedBytes;
      let uploadProgress = Math.floor(
        currentUploadSize / totalFilesSize * 100
      );
      onProgress(Math.min(uploadProgress, 100));
    };
    const reservation = await this.skpApi.createReservation(reservationRequest);
    onReservationCreated();
    const uploadDataList = filePaths.map((filePath, i) => ({
      reservedFile: reservation.files.find((f) => f.id === `${i}`),
      filePath,
      startByte: 0
    }));
    for (const uploadData of uploadDataList) {
      await this.initiateUpload({
        currentChunkSize: constants.initialChunkSize,
        uploadData,
        reservationToken: reservation.token,
        shouldCheckUploadedFileSize: false,
        retryCount: 0,
        pushProgress
      });
      completedUploadSize += uploadData.reservedFile.size;
    }
    onReservationConfirm();
    const result = await this.skpApi.confirmReservation(reservation.token);
    await delay(2);
    return result;
  }
  async initiateUpload(props) {
    if (props.shouldCheckUploadedFileSize) {
      try {
        props.uploadData.startByte = await this.skpApi.fetchUploadedFileSize(
          props.uploadData.reservedFile.objectId,
          props.reservationToken
        );
      } catch (error) {
        if (props.retryCount >= constants.maxUploadRetries) throw error;
        if (axios4.isAxiosError(error) && error.response?.status === 404) {
          props.uploadData.startByte = 0;
        } else {
          return await this.retryUpload(props);
        }
      }
    }
    props.uploadData.endByte = Math.min(
      props.uploadData.startByte + props.currentChunkSize,
      props.uploadData.reservedFile.size
    );
    props.uploadData.formData = await this.createUploadFormData(
      props.uploadData,
      props.reservationToken
    );
    try {
      const chunkUploadStartTime = Date.now();
      const response = await this.skpApi.uploadFileChunk({
        startByte: props.uploadData.startByte,
        endByte: props.uploadData.endByte,
        formData: props.uploadData.formData,
        totalBytes: props.uploadData.reservedFile.size,
        onUploadProgress: (event) => props.pushProgress(event.loaded, props.uploadData.startByte)
      });
      props.retryCount = 0;
      const duration = Math.floor((Date.now() - chunkUploadStartTime) / 1e3);
      const newChunkSize = this.calculateNewChunkSize(
        duration,
        props.currentChunkSize
      );
      if (response.size < props.uploadData.reservedFile.size) {
        props.uploadData.startByte = response.size;
        return await this.initiateUpload({
          ...props,
          currentChunkSize: newChunkSize,
          shouldCheckUploadedFileSize: false
        });
      }
    } catch (error) {
      if (props.retryCount >= constants.maxUploadRetries) throw error;
      return await this.retryUpload(props);
    }
  }
  async retryUpload(props) {
    props.retryCount++;
    const wait = Math.min(
      2 ** props.retryCount,
      constants.maxDelayBetweenRetriesSec
    );
    await delay(wait);
    props.uploadData.startByte = 0;
    props.shouldCheckUploadedFileSize = true;
    return await this.initiateUpload(props);
  }
  async createUploadFormData(uploadData, token) {
    const stream = fs3.createReadStream(uploadData.filePath, {
      start: uploadData.startByte,
      end: uploadData.endByte - 1
      // `end` is inclusive
    });
    const formData = new FormData();
    formData.append("objectId", uploadData.reservedFile.objectId);
    formData.append("authToken", token);
    formData.append("f", stream, {
      filename: uploadData.reservedFile.name,
      knownLength: uploadData.endByte - uploadData.startByte
    });
    return formData;
  }
  calculateNewChunkSize(duration, currentSize) {
    const factor = constants.idealChunkUploadDuration / duration;
    const newSize = Math.round(currentSize * factor);
    return Math.min(newSize, constants.maxChunkSize);
  }
};

// src/services/zip.ts
import archiver from "archiver";
import { createWriteStream as createWriteStream2 } from "fs";
import * as fs4 from "fs-extra";
import * as path3 from "path";
var ZipService = class {
  constructor(overrideTmpDir) {
    this.tmpDir = overrideTmpDir ?? getTmpDir();
  }
  /**
   * Zips the contents of the given directory and stores the archive
   * in the temp/teambeamjs directory with a unique name.
   * @param dirPath Path to the directory to zip
   * @returns The full path to the created zip file
   */
  async zipDirectory(dirPath) {
    await fs4.ensureDir(this.tmpDir);
    const dirName = path3.basename(dirPath);
    let zipPath = path3.join(this.tmpDir, `${dirName}.zip`);
    let counter = 1;
    while (await fs4.pathExists(zipPath)) {
      zipPath = path3.join(this.tmpDir, `${dirName}_${counter++}.zip`);
    }
    try {
      await this.createZip(dirPath, zipPath);
      return zipPath;
    } catch (error) {
      await fs4.remove(zipPath).catch(() => {
      });
      throw new Error(`Failed to create zip: ${error.message}`);
    }
  }
  async createZip(sourceDir, outPath) {
    return new Promise((resolve2, reject) => {
      const output = createWriteStream2(outPath);
      const archive = archiver("zip", { zlib: { level: 0 } });
      output.on("close", () => resolve2());
      output.on("error", (err) => reject(err));
      archive.on("error", (err) => reject(err));
      archive.pipe(output);
      archive.directory(sourceDir, false);
      archive.finalize();
    });
  }
};

// src/cli/commands/upload.ts
function buildUploadCommand(config2) {
  return new Command5("upload").description("Send a transfer").option("-T, --to <emails...>", "Recipients").option("-C, --cc <emails...>", "Recipients in copy").option("-B, --bcc <emails...>", "Recipients in blind copy").option("-s, --subject <subject>", "Transfer subject").option("-m, --message <message>", "Transfer message").option("-t, --ttl <ttl>", "Time to live in days", parseInt).option("-P, --password [password]", "Transfer password").argument("<files...>", "Files of the transfer").action(async (args, options) => {
    config2.assertFullyConfigured();
    const apiSkp = createSkpApi(config2);
    const zipService = new ZipService();
    const uploadService = new TransferUploadService(apiSkp);
    const { localFiles, temporaryFiles, reservationFiles } = await prepareFiles(args, zipService);
    const cleanup = async () => {
      for (const tempFile of temporaryFiles) {
        await fs5.remove(tempFile);
      }
    };
    process.on("SIGINT", async () => {
      await cleanup();
      process.exit(1);
    });
    try {
      const recipients = [
        ...prepareFlagRecipients({
          to: options.to,
          cc: options.cc,
          bcc: options.bcc
        })
      ];
      if (recipients.length == 0) {
        const recipientsInput = await promptRecipients();
        recipients.push(...recipientsInput);
      }
      const subject = await getOrPromptInput({
        key: "subject",
        message: "Subject:",
        flagValue: options.subject
      });
      const message = await getOrPromptEditor({
        key: "message",
        message: "Message:",
        flagValue: options.message
      });
      const { default: ttlDefault, values: ttlValues } = (await apiSkp.fetchEnvironment()).expiration;
      const ttl = await getOrPromptTtl({
        flagValue: options.ttl,
        defaultValue: ttlDefault,
        values: ttlValues
      });
      const transferPassword = options.password === void 0 ? void 0 : options.password === true ? await getOrPromptSecret({
        key: "password",
        message: "Transfer password: ",
        validate: (input) => {
          if (input.length <= 0)
            return "Please provide a transfer password";
          return true;
        }
      }) : options.password;
      const protection = transferPassword ? { enabled: true, key: transferPassword } : void 0;
      const reservationRequest = {
        receivers: recipients,
        subject,
        description: message,
        protection,
        ttl,
        files: reservationFiles
      };
      const progressBar = new cliProgress3.SingleBar(
        {
          format: "{prefix} Transfer upload |" + colors7.cyan("{bar}") + "| {percentage}%"
        },
        cliProgress3.Presets.rect
      );
      const spinnerCreate = ora4({
        text: "Creating reservation...",
        isEnabled: false,
        isSilent: true
      });
      const spinnerConfirm = ora4({
        text: "Confirming reservation...",
        isEnabled: false,
        isSilent: true
      });
      spinnerCreate.start();
      const result = await uploadService.uploadTransfer({
        filePaths: localFiles,
        reservationRequest,
        onProgress: (progress) => {
          progressBar.update(progress, {
            prefix: progress === 100 ? coloredSymbols.tick : symbols.triangleRight
          });
        },
        onReservationCreated: () => {
          spinnerCreate.succeed("Created reservation");
          progressBar.start(100, 0, { prefix: symbols.triangleRight });
        },
        onReservationConfirm: () => {
          progressBar.stop();
          spinnerConfirm.start();
        }
      });
      spinnerConfirm.succeed("Confirmed reservation");
      console.log(
        `${coloredSymbols.tick} ${colors7.green.bold("Successfully uploaded transfer")}`
      );
      console.log(
        `  ${colors7.italic(`${config2.get("host")}/transfer/get/${result.result[0].recipientId}`)}`
      );
    } finally {
      await cleanup();
    }
  });
}
async function prepareFiles(filePaths, zipService) {
  const localFiles = [];
  const temporaryFiles = [];
  const reservationFiles = [];
  for (var [i, filePath] of filePaths.entries()) {
    if (!fs5.existsSync(filePath)) {
      throw new InvalidArgumentError(
        `Provided file does not exist: '${filePath}'`
      );
    }
    let stat = fs5.statSync(filePath);
    if (stat.isDirectory()) {
      const zipPath = await oraPromise(zipService.zipDirectory(filePath), {
        text: `Creating zip file for '${filePath}'...`,
        successText: `Created zip file for '${filePath}'`
      });
      let zipStat = fs5.statSync(zipPath);
      localFiles.push(zipPath);
      temporaryFiles.push(zipPath);
      reservationFiles.push({
        name: path4.basename(zipPath),
        size: zipStat.size,
        id: `${i}`
      });
      continue;
    } else if (stat.isFile()) {
      localFiles.push(filePath);
      reservationFiles.push({
        name: path4.basename(filePath),
        size: stat.size,
        id: `${i}`
      });
      continue;
    } else {
      throw new InvalidArgumentError(
        `Unsupported file type found for  '${filePath}'`
      );
    }
  }
  return { localFiles, temporaryFiles, reservationFiles };
}
function prepareFlagRecipients({
  to,
  cc,
  bcc
}) {
  const flagRecipients = [
    ...mapRecipients("to", to),
    ...mapRecipients("cc", cc),
    ...mapRecipients("bcc", bcc)
  ];
  if (flagRecipients.some((r) => z3.string().email().safeParse(r.email).error)) {
    throw new InvalidOptionArgumentError(
      "Please provide valid email addresses"
    );
  }
  return flagRecipients;
}

// src/cli/index.ts
var program = new Command6();
program.name("teambeam").description("TeamBeam CLI").version("1.0.0");
program.helpCommand(false);
program.addCommand(buildInitCommand(config));
program.addCommand(buildUploadCommand(config));
program.addCommand(buildDownloadCommand(config));
program.addCommand(buildCopyCommand(config));
addDebugCommands(program);
program.parseAsync().catch((err) => {
  let errorPrefix;
  let message;
  let extraDetails = [];
  if (err instanceof InvalidArgumentError2) {
    errorPrefix = "Invalid argument";
    message = err.message;
  } else if (err instanceof InvalidOptionArgumentError2) {
    errorPrefix = "Invalid option";
    message = err.message;
  } else if (isAxiosError(err)) {
    errorPrefix = "HTTP error";
    if (err.response?.data?.error) {
      errorPrefix = "API error";
      const {
        code,
        message: backendMessage,
        details
      } = err.response.data.error;
      message = `${backendMessage} (code ${code})`;
      if (Array.isArray(details)) {
        extraDetails = details;
      }
    } else if (err.response) {
      message = `Received ${err.response.status} response from server.`;
    } else if (err.request) {
      message = "No response received from server.";
    } else {
      message = err.message;
    }
  } else {
    errorPrefix = "Unexpected error";
    message = err.message || String(err);
  }
  console.error(
    colors8.red.bold(`
${coloredSymbols.cross} ${errorPrefix}:`),
    message
  );
  if (extraDetails.length > 0) {
    for (const detail of extraDetails) {
      console.error(colors8.red(`  \u2022 ${detail}`));
    }
  }
  process.exit(1);
});
//# sourceMappingURL=index.js.map