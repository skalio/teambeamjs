import { Command } from "@commander-js/extra-typings";
import colors from "ansi-colors";
import { createSkpApi } from "../../services/apiSkp.js";
import { ConfigService } from "../../services/config.js";
import { coloredSymbols } from "../../utils/symbols.js";

export function buildCopyCommand(config: ConfigService): Command {
  return new Command("copy")
    .description("TODO")
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
      const { drive: folderIdx } = options;
      const apiSkp = createSkpApi(config);

      const receivedTransfers = await apiSkp.fetchTransfers({
        location: "received",
      });
      console.log("Received transfers found: ", receivedTransfers.length);

      const unaccessedTransfers = receivedTransfers.filter((t) => t.isUnread);

      console.log(
        "Unaccessed transfers of those: ",
        unaccessedTransfers.length
      );

      if (unaccessedTransfers.length === 0) {
        console.log("Nothing to do here, exiting");
        return;
      }

      console.log(
        `Copying ${unaccessedTransfers.length} transfers into drive ${folderIdx}`
      );

      for (const transfer of unaccessedTransfers) {
        await apiSkp.copyTransferToDrive({
          recipientId: transfer.recipientId,
          folderIdx: folderIdx,
        });
      }

      console.log(coloredSymbols.tick + colors.green(" Done!"));
      /*
      const copiedtransfer = await apiSkp.copyTransferToDrive({
        recipientId: "ffh3t7lfeh2q45dvv8rx2ik1i51bxr3gm67n2h0j",
        folderIdx: 3208,
      });
      console.dir(copiedtransfer);
      */
    });
}
