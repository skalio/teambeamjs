import {
  Command,
  InvalidArgumentError,
  InvalidOptionArgumentError,
} from "@commander-js/extra-typings";
import colors from "ansi-colors";
import cliProgress from "cli-progress";
import fs from "fs";
import inquirer from "inquirer";
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
import { mapRecipients } from "../../utils/entities.js";
import { promptRecipients } from "../../utils/input.js";
import { coloredSymbols, symbols } from "../../utils/symbols.js";

export function buildUploadCommand(config: ConfigService): Command<[string[]]> {
  return new Command("upload")
    .description("Send a TeamBeam transfer")
    .option("-T, --to <emails...>", "Recipients")
    .option("-C, --cc <emails...>", "Recipients in copy")
    .option("-B, --bcc <emails...>", "Recipients in blind copy")
    .option("-s, --subject <subject>", "Transfer subject")
    .option("-m, --message <message>", "Transfer message")
    .option("-t, --ttl <ttl>", "Time to live in days", parseInt)
    .option("-P, --password [password]", "Transfer password")
    .argument("<files...>", "Files of the transfer")
    .action(async (args, options) => {
      const files: ReservationRequestFile[] = [];

      for (var [i, fileName] of args.entries()) {
        if (!fs.existsSync(fileName)) {
          throw new InvalidArgumentError(
            `Provided file does not exist: '${fileName}'`
          );
        }
        let stat = fs.statSync(fileName);
        if (!stat.isFile()) {
          throw new InvalidArgumentError(
            `Directories are not supported yet (${fileName})`
          );
        }
        files.push({
          name: path.basename(fileName),
          size: stat.size,
          id: `${i}`,
        });
      }

      const flagRecipients: TransferReceiver[] = [
        ...mapRecipients("to", options.to),
        ...mapRecipients("cc", options.cc),
        ...mapRecipients("bcc", options.bcc),
      ];

      if (
        flagRecipients.some((r) => z.string().email().safeParse(r.email).error)
      ) {
        throw new InvalidOptionArgumentError(
          "Please provide valid email addresses"
        );
      }

      const recipients = [...flagRecipients];

      if (recipients.length == 0) {
        const recipientsInput = await promptRecipients();
        recipients.push(...recipientsInput);
      }

      const subject =
        options.subject ??
        (
          await inquirer.prompt([
            {
              type: "input",
              name: "subject",
              message: `Subject:`,
            },
          ])
        ).subject;

      const message =
        options.message ??
        (
          await inquirer.prompt([
            {
              type: "editor",
              name: "message",
              message: `Message:`,
            },
          ])
        ).message;

      const apiSkp = createSkpApi(config);

      const { default: ttlDefault, values: ttlValues } = (
        await apiSkp.fetchEnvironment()
      ).expiration;

      let ttl: number;
      if (options.ttl) {
        const schema = z.union([
          z.number().refine((num) => ttlValues.includes(num), {
            message: `TTL value must be one of the allowed TTL values: ${ttlValues.join(", ")}.`,
          }),
          z.undefined(),
        ]);
        const result = schema.safeParse(options.ttl);
        if (result.error) {
          throw Error(result.error.issues[0].message);
        }
        ttl = options.ttl;
      } else {
        ttl = (
          await inquirer.prompt([
            {
              type: "list",
              name: "ttl",
              message: `TTL:`,
              choices: ttlValues.map((ttl) => `${ttl} days`),
              default: ttlValues.indexOf(ttlDefault),
            },
          ])
        ).ttl;
      }

      let protection: TransferProtection | undefined;
      if (options.password === undefined) {
        protection = undefined;
      } else {
        const transferPassword =
          options.password === true
            ? (
                await inquirer.prompt([
                  {
                    type: "password",
                    name: "input",
                    message: "Transfer password",
                    validate: (input) => {
                      if (input.length <= 0)
                        return "Please provide a transfer password";
                      return true;
                    },
                  },
                ])
              ).input
            : options.password;
        protection = { enabled: true, key: transferPassword };
      }

      const reservationRequest: ReservationRequest = {
        receivers: recipients,
        subject: subject,
        description: message,
        protection: protection,
        files: files,
      };

      const progressBar = new cliProgress.SingleBar(
        {
          format:
            "{prefix} Transfer upload |" +
            colors.cyan("{bar}") +
            "| {percentage}%",
        },
        cliProgress.Presets.shades_classic
      );

      progressBar.start(100, 0, { prefix: symbols.triangleRight });

      const uploadService = new TransferUploadService(apiSkp);

      const result = await uploadService.uploadTransfer(
        args,
        reservationRequest,
        (progress) => {
          progressBar.update(progress, {
            prefix:
              progress === 100 ? coloredSymbols.tick : symbols.triangleRight,
          });
        }
      );

      progressBar.stop();

      console.log(
        `${coloredSymbols.tick} ${colors.green.bold("Successfully uploaded transfer:")} ${colors.italic(`${config.get("host")}/transfer/get/${result.result[0].recipientId}`)}`
      );
    });
}
