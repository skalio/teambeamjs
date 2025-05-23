import { Command } from "@commander-js/extra-typings";
import colors from "ansi-colors";
import cliProgress from "cli-progress";
import downloadsFolder from "downloads-folder";
import * as fs from "fs";
import * as path from "path";
import { TransferLocation } from "../../entities/skp.js";
import { createSkalioIdApi } from "../../services/apiSkalioId.js";
import { createSkpApi } from "../../services/apiSkp.js";
import { ConfigService } from "../../services/config.js";
import { runWithOptionalInterval } from "../../utils/runner.js";
import { streamPromise } from "../../utils/stream.js";
import { coloredSymbols, symbols } from "../../utils/symbols.js";

export function buildDownloadCommand(config: ConfigService): Command {
  return new Command("download")
    .description("Download transfers from your inbox")
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
      config.assertFullyConfigured();

      const apiSkp = createSkpApi(config);
      const apiSkalioId = createSkalioIdApi(config);

      const targetBaseDir = options.dir
        ? path.resolve(options.dir)
        : path.join(downloadsFolder(), "transfers");

      const location: TransferLocation = options.includeSent
        ? "sentandreceived"
        : "received";

      return await runWithOptionalInterval(options.interval, async () => {
        console.log(`${symbols.triangleRightOutlined} Fetching emails...`);

        const emails = await apiSkalioId.fetchAllEmails();
        console.log(`Fetched ${emails.length} emails:`, emails[0]);

        console.log(`${symbols.triangleRightOutlined} Fetching transfers...`);

        var transfers = await apiSkp.fetchTransfers({ location: location });

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
            const multibar = new cliProgress.MultiBar(
              {
                clearOnComplete: false,
                hideCursor: true,
                format:
                  "{prefix} File {filename} |" +
                  colors.cyan("{bar}") +
                  "| {percentage}%",
              },
              cliProgress.Presets.rect
            );
            const recipientFolder = path.join(
              targetBaseDir,
              transfer.recipientId
            );
            fs.mkdirSync(recipientFolder, { recursive: true });
            for (const file of transfer.files) {
              const fileName = options.useFilename ? file.name : file.objectId;
              const filePath = path.join(recipientFolder, fileName);

              const bar = multibar.create(file.size, 0, {
                filename: fileName,
                prefix: coloredSymbols.stepActive,
              });

              const fileStream = await apiSkp.streamTransferFile({
                file,
                onUploadProgress: ({ loaded }) => {
                  bar.update(loaded, {
                    prefix:
                      loaded === file.size
                        ? coloredSymbols.stepSuccess
                        : coloredSymbols.stepActive,
                  });
                },
              });
              const writeStream = fs.createWriteStream(filePath);
              const out = fileStream.pipe(writeStream);
              await streamPromise(out);
              bar.update(file.size);
              bar.stop();
            }
            multibar.stop();

            const updatedTransfer = await apiSkp.fetchTransfer(
              transfer.recipientId
            );
            const jsonPath = path.join(recipientFolder, "transfer.json");
            const jsonStream = fs.createWriteStream(jsonPath);
            jsonStream.write(JSON.stringify(updatedTransfer, null, 2));
            jsonStream.end();
            console.log(coloredSymbols.stepGap);
            console.log(
              `${coloredSymbols.stepSuffix} ${colors.green("Done!")}`
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
