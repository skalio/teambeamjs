import { Command } from "@commander-js/extra-typings";
import colors from "ansi-colors";
import fs from "fs-extra";
import open from "open";
import ora from "ora";
import { config } from "../../services/config.js";
import { jwtDecode } from "../../utils/jwt.js";
import { coloredSymbols } from "../../utils/symbols.js";
import { getTmpDir } from "../../utils/tmpDir.js";

export function addDebugCommands(program: Command) {
  const tmpDir = getTmpDir();

  const tmpBase = new Command("tmpdir").aliases(["tmp", "tempdir", "temp"]);

  tmpBase
    .command("open")
    .description("Open the directory for temporary files created by teambeamjs")
    .action(async () => {
      open(tmpDir);
    });

  tmpBase
    .command("clean")
    .description("Remove all leftover temporary files")
    .action(async () => {
      console.log(coloredSymbols.stepPrefix);
      console.log(
        `${coloredSymbols.stepInfo} Clearing temporary files in ${tmpDir}`
      );
      console.log(coloredSymbols.stepGap);

      if (!(await fs.pathExists(tmpDir))) {
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

      const spinner = ora(
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
  const z = String.fromCharCode;
  const bw = 26;
  const t = z(9556) + "═".repeat(bw) + z(9559);
  const s = z(9553);
  const b = z(9562) + "═".repeat(bw) + z(9565);
  const ll = (s: string) => "         " + s;
  const p = " ".repeat(bw);
  const m = s + p + s;
  const d = z(9617);
  const dd = d + d;
  const sp = " ";
  const pad5 = " ".repeat(5);
  const c = s + pad5 + dd + sp + l + sp + dd + pad5 + s;
  const bx = [t, m, c, m, b].map(ll);

  const cfns: Array<(text: string) => string> = [
    colors.redBright,
    colors.yellowBright,
    colors.greenBright,
    colors.cyanBright,
    colors.blueBright,
    colors.magentaBright,
  ].map((c) => c.bold);

  const cmd = String.fromCharCode(0x70, 0x61, 0x72, 0x74, 0x79);

  const fun = new Command(cmd).action(() => {
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
    }, 8000);
  });

  const configBase = new Command("config")
    .description("Inspect or open the config used by teambeamjs")
    .action(() => {
      const store = config["store"];
      const path = store.path;

      console.log(colors.cyanBright.bold("teambeamjs Config Overview\n"));

      console.log(colors.gray("Config file location:"));
      console.log(`  ${path}\n`);

      const conf = store.store;
      if (!conf || Object.keys(conf).length === 0) {
        console.log(
          coloredSymbols.warning +
            colors.yellow(" No config found or config is empty.\n")
        );
      } else {
        console.log(colors.cyanBright("Current Config:"));
        console.log(JSON.stringify(conf, null, 2), "\n");

        if (conf.idToken) {
          try {
            const decoded = jwtDecode(conf.idToken);
            console.log(colors.cyanBright("Decoded ID Token Claims:"));
            console.log(JSON.stringify(decoded, null, 2), "\n");
          } catch (e) {
            console.log(colors.red("Failed to decode ID token."));
          }
        }
      }

      try {
        config.assertFullyConfigured();
        console.log(coloredSymbols.tick + colors.green(" Config is valid."));
      } catch (e) {
        console.log(
          coloredSymbols.warning +
            colors.red(` Config is invalid: ${(e as Error).message}`)
        );
      }
    });

  configBase
    .command("open")
    .description("Open the config file in the default editor")
    .action(() => {
      const path = config["store"].path;
      if (path) {
        open(path);
      } else {
        console.log(`${coloredSymbols.info} No config file found.`);
      }
    });

  configBase
    .command("clear")
    .aliases(["clean", "delete"])
    .description("Remove all saved config values")
    .action(() => {
      config.clear();
      console.log(
        coloredSymbols.tick + colors.green(" Cleared all saved config values.")
      );
    });

  [tmpBase, fun, configBase].forEach((cmd) =>
    program.addCommand(cmd, { hidden: true })
  );
}
