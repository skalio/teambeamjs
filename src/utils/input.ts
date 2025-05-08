import inquirer from "inquirer";
import { z } from "zod";
import { RecipientType, TransferReceiver } from "../entities/skp.js";
import { mapRecipients } from "./entities.js";

export async function getOrPrompt({
  key,
  message,
  flagValue,
  defaultValue,
  validate,
  mask = false,
}: {
  key: string;
  message: string;
  flagValue?: string;
  defaultValue?: string;
  validate?: (value: string) => true | string | Promise<true | string>;
  mask?: boolean;
}): Promise<string> {
  if (flagValue !== undefined) {
    if (validate) {
      const result = await validate(flagValue);
      if (result !== true) {
        throw new Error(`Invalid value for --${key}: ${result}`);
      }
    }
    return flagValue;
  }

  if (mask && defaultValue) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: `Existing ${key} '${"*".repeat(defaultValue.length)}' found. Overwrite?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      if (validate) {
        const result = await validate(defaultValue);
        if (result !== true) {
          throw new Error(`Invalid value for --${key}: ${result}`);
        }
      }
      return defaultValue;
    }
  }

  const { value } = await inquirer.prompt([
    {
      type: mask ? "password" : "input",
      name: "value",
      message,
      default: defaultValue,
      validate,
    },
  ]);

  return value;
}

export async function promptRecipients(): Promise<TransferReceiver[]> {
  const recipients: TransferReceiver[] = [];
  while (recipients.length == 0) {
    for (const type of ["to", "cc", "bcc"] as RecipientType[]) {
      const emails = await promptRecipientsOfType(type);
      recipients.push(...mapRecipients(type, emails));
    }
    if (recipients.length == 0)
      console.error("Please provide at least one recipient");
  }
  return recipients;
}

async function promptRecipientsOfType(type: RecipientType): Promise<string[]> {
  const { addRecipients } = await inquirer.prompt([
    {
      type: "confirm",
      name: "addRecipients",
      message: `$Add recipients of tyoe '${type}'?`,
      default: false,
    },
  ]);

  if (!addRecipients) {
    return [];
  }

  let recipients: string[] = [];
  while (true) {
    const { email } = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: `Add recipient (${type}):`,
        validate: (input) => {
          if (input.length == 0) return "Please enter an email address";
          if (z.string().email().safeParse(input).error)
            return "Please enter a valid email address";
          return true;
        },
      },
    ]);
    recipients.push(email);

    const { addMore } = await inquirer.prompt([
      {
        type: "confirm",
        name: "addMore",
        message: `Transfer has ${recipients.length} recipient${recipients.length === 1 ? "" : "s"} of type '${type}'. Add more?`,
        default: false,
      },
    ]);
    if (!addMore) {
      console.log(
        `Added ${recipients.length} '${type}' recipients:`,
        recipients.reduce((prev, curr) => prev + ", " + curr),
        ""
      );
      return recipients;
    }
  }
}
