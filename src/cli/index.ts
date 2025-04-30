import { Command } from "commander";
import { config } from "../services/config.js";
import { buildInitCommand } from "./commands/init.js";

const program = new Command();

program.name("teambeam").description("Modern TeamBeam CLI").version("3.0.0");

program.addCommand(buildInitCommand(config));

// Parse args
program.parseAsync().catch((err) => {
  console.error("❌ Unexpected error:", err.message);
  process.exit(1);
});
