import { Command } from "@commander-js/extra-typings";
import colors from "ansi-colors";
import cliProgress from "cli-progress";
import { createSkpApi } from "../../services/apiSkp.js";
import { ConfigService } from "../../services/config.js";
import { runWithOptionalInterval } from "../../utils/runner.js";
import { coloredSymbols } from "../../utils/symbols.js";

export function buildCopyCommand(config: ConfigService): Command {
  return new Command("copy")
    .description("Copy transfers from your inbox to a drive folder")
    .requiredOption(
      "-d, --drive <folderIdx>",
      "Drive folder ID where to copy the transfer into",
      parseInt
    )
    .option(
      "-i, --interval <interval>",
      "Run in loop, with delay of <interval> seconds between checks",
      parseInt
    )
    .action(async (options) => {
      const { drive: folderIdx, interval } = options;
      const apiSkp = createSkpApi(config);

      await runWithOptionalInterval(interval, async () => {
        console.log(`${coloredSymbols.stepPrefix} Fetching transfers...`);
        var transfers = await apiSkp.fetchTransfers({
          location: "received",
        });

        transfers = transfers.filter((t) => t.isUnread);

        if (transfers.length !== 0) {
          console.log(
            `${coloredSymbols.stepSuccess} Transfers to copy: ${transfers.length}`
          );
          console.log(`${coloredSymbols.stepGap}`);
          console.log(
            `${coloredSymbols.stepGap} Copying into drive folder ${folderIdx}...`
          );

          const bar = new cliProgress.SingleBar(
            {
              clearOnComplete: false,
              hideCursor: true,
              format: `{prefix} Copying [{bar}] {value}/{total} Transfers`,
            },
            cliProgress.Presets.shades_classic
          );

          bar.start(transfers.length, 0, {
            prefix: coloredSymbols.stepActive,
          });

          for (const transfer of transfers) {
            await apiSkp.copyTransferToDrive({
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
