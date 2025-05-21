import { Command } from "@commander-js/extra-typings";
import fs from "fs-extra";
import open from "open";
import ora from "ora";
import { coloredSymbols } from "../../utils/symbols.js";
import { getTmpDir } from "../../utils/tmpDir.js";

export function buildTmpDirCommand(): Command {
  const tmpDir = getTmpDir();

  const base = new Command("tmpdir").aliases(["tmp", "tempdir", "temp"]);

  base
    .command("open")
    .description("Open the directory for temporary files created by teambeamjs")
    .action(async () => {
      open(tmpDir);
    });

  base
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

  return base;
}
