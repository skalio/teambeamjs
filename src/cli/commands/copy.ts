import { Command } from "@commander-js/extra-typings";
import colors from "ansi-colors";
import cliProgress from "cli-progress";
import { createSkpApi } from "../../services/apiSkp.js";
import { ConfigService } from "../../services/config.js";
import { runWithOptionalInterval } from "../../utils/runner.js";
import { coloredSymbols } from "../../utils/symbols.js";

export function buildCopyCommand(config: ConfigService): Command {
  return new Command("copy")
    .description("Copy transfers from your inbox to an archive folder")
    .requiredOption(
      "-f, --folder <folderIdx>",
      "Archive folder ID where to copy the transfer into",
      parseInt
    )
    .option(
      "-i, --interval <interval>",
      "Run in loop, with delay of <interval> seconds between checks",
      parseInt
    )
    .action(async (options) => {
      const { folder: folderIdx, interval } = options;
      const apiSkp = createSkpApi(config);

      await runWithOptionalInterval(interval, async () => {
        console.log(`${coloredSymbols.stepPrefix} Fetching transfers...`);
        var transfers = await apiSkp.fetchTransfers({
          location: "received",
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
              format: `{prefix} [{bar}] {value}/{total} transfer${transfers.length > 1 ? "s" : ""}`,
            },
            cliProgress.Presets.shades_classic
          );

          bar.start(transfers.length, 0, {
            prefix: coloredSymbols.stepActive,
          });

          for (const transfer of transfers) {
            await apiSkp.copyTransferToArchive({
              recipientId: transfer.recipientId,
              folderIdx,
            });
            bar.increment();
          }

          bar.update(transfers.length, { prefix: coloredSymbols.stepSuccess });

          bar.stop();
          console.log(`${coloredSymbols.stepGap}`);
          console.log(coloredSymbols.stepSuffix + colors.green(" Done!\n"));
        } else {
          console.log(`${coloredSymbols.stepGap}`);
          console.log(`${coloredSymbols.stepSuffix} No new transfers found\n`);
        }
      });
    });
}
