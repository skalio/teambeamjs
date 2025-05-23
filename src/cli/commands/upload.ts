import {
  Command,
  InvalidArgumentError,
  InvalidOptionArgumentError,
} from "@commander-js/extra-typings";
import colors from "ansi-colors";
import cliProgress from "cli-progress";
import fs from "fs-extra";
import ora, { oraPromise } from "ora";
import path from "path";
import { z } from "zod";
import {
  ReservationRequest,
  ReservationRequestFile,
  TransferProtection,
  TransferReceiver,
} from "../../entities/skp.js";
import { createSkpApi } from "../../services/apiSkp.js";
import { ConfigService } from "../../services/config.js";
import { TransferUploadService } from "../../services/transferUpload.js";
import { ZipService } from "../../services/zip.js";
import { mapRecipients } from "../../utils/entities.js";
import {
  getOrPromptEditor,
  getOrPromptInput,
  getOrPromptSecret,
  getOrPromptTtl,
  promptRecipients,
} from "../../utils/input.js";
import { coloredSymbols, symbols } from "../../utils/symbols.js";

export function buildUploadCommand(config: ConfigService): Command<[string[]]> {
  return new Command("upload")
    .description("Send a transfer")
    .option("-T, --to <emails...>", "Recipients")
    .option("-C, --cc <emails...>", "Recipients in copy")
    .option("-B, --bcc <emails...>", "Recipients in blind copy")
    .option("-s, --subject <subject>", "Transfer subject")
    .option("-m, --message <message>", "Transfer message")
    .option("-t, --ttl <ttl>", "Time to live in days", parseInt)
    .option("-P, --password [password]", "Transfer password")
    .argument("<files...>", "Files of the transfer")
    .action(async (args, options) => {
      config.assertFullyConfigured();
      
      const apiSkp = createSkpApi(config);
      const zipService = new ZipService();
      const uploadService = new TransferUploadService(apiSkp);

      const { localFiles, temporaryFiles, reservationFiles } =
        await prepareFiles(args, zipService);

      const cleanup = async () => {
        for (const tempFile of temporaryFiles) {
          await fs.remove(tempFile);
        }
      };

      process.on("SIGINT", async () => {
        await cleanup();
        process.exit(1);
      });

      try {
        const recipients = [
          ...prepareFlagRecipients({
            to: options.to,
            cc: options.cc,
            bcc: options.bcc,
          }),
        ];

        if (recipients.length == 0) {
          const recipientsInput = await promptRecipients();
          recipients.push(...recipientsInput);
        }

        const subject = await getOrPromptInput({
          key: "subject",
          message: "Subject:",
          flagValue: options.subject,
        });

        const message = await getOrPromptEditor({
          key: "message",
          message: "Message:",
          flagValue: options.message,
        });

        const { default: ttlDefault, values: ttlValues } = (
          await apiSkp.fetchEnvironment()
        ).expiration;

        const ttl = await getOrPromptTtl({
          flagValue: options.ttl,
          defaultValue: ttlDefault,
          values: ttlValues,
        });

        const transferPassword: string | undefined =
          options.password === undefined
            ? undefined
            : options.password === true
              ? await getOrPromptSecret({
                  key: "password",
                  message: "Transfer password: ",
                  validate: (input) => {
                    if (input.length <= 0)
                      return "Please provide a transfer password";
                    return true;
                  },
                })
              : options.password;

        const protection: TransferProtection | undefined = transferPassword
          ? { enabled: true, key: transferPassword }
          : undefined;

        const reservationRequest: ReservationRequest = {
          receivers: recipients,
          subject: subject,
          description: message,
          protection: protection,
          ttl: ttl,
          files: reservationFiles,
        };

        const progressBar = new cliProgress.SingleBar(
          {
            format:
              "{prefix} Transfer upload |" +
              colors.cyan("{bar}") +
              "| {percentage}%",
          },
          cliProgress.Presets.rect
        );
        const spinnerCreate = ora({
          text: "Creating reservation...",
          isEnabled: false,
          isSilent: true,
        });
        const spinnerConfirm = ora({
          text: "Confirming reservation...",
          isEnabled: false,
          isSilent: true,
        });

        spinnerCreate.start();

        const result = await uploadService.uploadTransfer({
          filePaths: localFiles,
          reservationRequest: reservationRequest,
          onProgress: (progress) => {
            progressBar.update(progress, {
              prefix:
                progress === 100 ? coloredSymbols.tick : symbols.triangleRight,
            });
          },
          onReservationCreated: () => {
            spinnerCreate.succeed("Created reservation");
            progressBar.start(100, 0, { prefix: symbols.triangleRight });
          },
          onReservationConfirm: () => {
            progressBar.stop();
            spinnerConfirm.start();
          },
        });

        spinnerConfirm!.succeed("Confirmed reservation");

        console.log(
          `${coloredSymbols.tick} ${colors.green.bold("Successfully uploaded transfer")}`
        );
        console.log(
          `  ${colors.italic(`${config.get("host")}/transfer/get/${result.result[0].recipientId}`)}`
        );
      } finally {
        await cleanup();
      }
    });
}
async function prepareFiles(
  filePaths: string[],
  zipService: ZipService
): Promise<{
  localFiles: string[];
  temporaryFiles: string[];
  reservationFiles: ReservationRequestFile[];
}> {
  const localFiles: string[] = [];
  const temporaryFiles: string[] = [];
  const reservationFiles: ReservationRequestFile[] = [];

  for (var [i, filePath] of filePaths.entries()) {
    if (!fs.existsSync(filePath)) {
      throw new InvalidArgumentError(
        `Provided file does not exist: '${filePath}'`
      );
    }
    let stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      const zipPath = await oraPromise(zipService.zipDirectory(filePath), {
        text: `Creating zip file for '${filePath}'...`,
        successText: `Created zip file for '${filePath}'`,
      });
      let zipStat = fs.statSync(zipPath);
      localFiles.push(zipPath);
      temporaryFiles.push(zipPath);
      reservationFiles.push({
        name: path.basename(zipPath),
        size: zipStat.size,
        id: `${i}`,
      });
      continue;
    } else if (stat.isFile()) {
      localFiles.push(filePath);
      reservationFiles.push({
        name: path.basename(filePath),
        size: stat.size,
        id: `${i}`,
      });
      continue;
    } else {
      throw new InvalidArgumentError(
        `Unsupported file type found for  '${filePath}'`
      );
    }
  }

  return { localFiles, temporaryFiles, reservationFiles };
}

function prepareFlagRecipients({
  to,
  cc,
  bcc,
}: {
  to?: string[];
  cc?: string[];
  bcc?: string[];
}): TransferReceiver[] {
  const flagRecipients: TransferReceiver[] = [
    ...mapRecipients("to", to),
    ...mapRecipients("cc", cc),
    ...mapRecipients("bcc", bcc),
  ];

  if (flagRecipients.some((r) => z.string().email().safeParse(r.email).error)) {
    throw new InvalidOptionArgumentError(
      "Please provide valid email addresses"
    );
  }

  return flagRecipients;
}
