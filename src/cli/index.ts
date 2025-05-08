import {
  Command,
  InvalidArgumentError,
  InvalidOptionArgumentError,
} from "@commander-js/extra-typings";
import colors from "ansi-colors";
import { config } from "../services/config.js";
import { coloredSymbols } from "../utils/symbols.js";
import { buildInitCommand } from "./commands/init.js";
import { buildUploadCommand } from "./commands/upload.js";

const program = new Command();

program.name("teambeam").description("Modern TeamBeam CLI").version("3.0.0");

program.addCommand(buildInitCommand(config));

program.addCommand(buildUploadCommand(config));

// Parse args
program.parseAsync().catch((err) => {
  let errorPrefix: string;
  if (err instanceof InvalidArgumentError) {
    errorPrefix = "Invalid argument";
  } else if (err instanceof InvalidOptionArgumentError) {
    errorPrefix = "Invalid option";
  } else {
    errorPrefix = "Unexpected error";
  }
  console.error(
    colors.red.bold(`${coloredSymbols.cross} ${errorPrefix}:`),
    err.message
  );
  process.exit(1);
});
