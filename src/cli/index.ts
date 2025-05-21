import {
  Command,
  InvalidArgumentError,
  InvalidOptionArgumentError,
} from "@commander-js/extra-typings";
import colors from "ansi-colors";
import { isAxiosError } from "axios";
import { config } from "../services/config.js";
import { coloredSymbols } from "../utils/symbols.js";
import { buildCopyCommand } from "./commands/copy.js";
import { buildDownloadCommand } from "./commands/download.js";
import { buildInitCommand } from "./commands/init.js";
import { buildTmpDirCommand } from "./commands/tmpdir.js";
import { buildUploadCommand } from "./commands/upload.js";

const program = new Command();

program.name("teambeam").description("Modern TeamBeam CLI").version("3.0.0");

program.addCommand(buildInitCommand(config));
program.addCommand(buildUploadCommand(config));
program.addCommand(buildDownloadCommand(config));
program.addCommand(buildCopyCommand(config));

program.addCommand(buildTmpDirCommand(), { hidden: true });

program.parseAsync().catch((err) => {
  let errorPrefix: string;
  let message: string;
  let extraDetails: string[] = [];

  if (err instanceof InvalidArgumentError) {
    errorPrefix = "Invalid argument";
    message = err.message;
  } else if (err instanceof InvalidOptionArgumentError) {
    errorPrefix = "Invalid option";
    message = err.message;
  } else if (isAxiosError(err)) {
    errorPrefix = "HTTP error";
    if (err.response?.data?.error) {
      errorPrefix = "API error";
      const {
        code,
        message: backendMessage,
        details,
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
    colors.red.bold(`\n${coloredSymbols.cross} ${errorPrefix}:`),
    message
  );

  if (extraDetails.length > 0) {
    for (const detail of extraDetails) {
      console.error(colors.red(`  • ${detail}`));
    }
  }

  process.exit(1);
});
