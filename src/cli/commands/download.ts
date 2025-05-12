import { Command } from "@commander-js/extra-typings";
import { createSkalioIdApi } from "../../services/apiSkalioId.js";
import { createSkpApi } from "../../services/apiSkp.js";
import { ConfigService } from "../../services/config.js";

export function buildDownloadCommand(config: ConfigService): Command {
  return new Command("download")
    .description("Download files from your inbox")
    .option(
      "-d, --dir <directory>",
      "Path to directory where transfers will be stored"
    )
    .option(
      "-i, --interval <interval>",
      "Run in loop, with delay of <interval> seconds between checks",
      parseInt
    )
    .option("-O, --include-old", "Download previously transfers as well", false)
    .option("-S, --include-sent", "Download sent transfers as well", false)
    .option(
      "-F, --use-filename",
      "Store downloaded files using their actual filenames",
      false
    )
    .action(async (options) => {
      const apiSkalioId = createSkalioIdApi(config);
      const apiSkp = createSkpApi(config);

      //const transfers = await apiSkp.fetchTransfers({location: "sent"});
      //console.dir(transfers);
      const transfer = await apiSkp.fetchTransfer(
        "ffh3t7lfeh2q45dvv8rx2ik1i51bxr3gm67n2h0j"
      );
      console.dir(transfer);
    });
}
