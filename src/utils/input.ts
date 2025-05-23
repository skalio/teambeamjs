import colors from "ansi-colors";
import inquirer from "inquirer";
import ora from "ora";
import { z } from "zod";
import { RecipientType, TransferReceiver } from "../entities/skp.js";
import { mapRecipients } from "./entities.js";

export async function getOrPromptInput({
  key,
  message,
  flagValue,
  defaultValue,
  validate,
}: {
  key: string;
  message: string;
  flagValue?: string;
  defaultValue?: string;
  validate?: (value: string) => true | string | Promise<true | string>;
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

  const { value } = await inquirer.prompt([
    {
      type: "input",
      name: "value",
      message,
      default: defaultValue,
      validate,
    },
  ]);

  return value;
}

export async function getOrPromptSecret({
  key,
  message,
  flagValue,
  defaultValue,
  validate,
}: {
  key: string;
  message: string;
  flagValue?: string;
  defaultValue?: string;
  validate?: (value: string) => true | string | Promise<true | string>;
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

  if (defaultValue) {
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
        const spinner = ora(
          `${message} ${colors.cyan("*".repeat(defaultValue.length))}`
        );
        spinner.start();
        const result = await validate(defaultValue);
        if (result !== true) {
          spinner.fail();
          throw new Error(`Invalid value for --${key}: ${result}`);
        } else {
          spinner.succeed();
        }
      }
      return defaultValue;
    }
  }

  const { value } = await inquirer.prompt([
    {
      type: "password",
      name: "value",
      message,
      default: defaultValue,
      mask: true,
      validate,
    },
  ]);

  return value;
}

export async function getOrPromptEditor({
  key,
  message,
  flagValue,
  defaultValue,
  validate,
}: {
  key: string;
  message: string;
  flagValue?: string;
  defaultValue?: string;
  validate?: (value: string) => true | string | Promise<true | string>;
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

  const { value } = await inquirer.prompt([
    {
      type: "editor",
      name: "value",
      message,
      default: defaultValue,
      waitForUseInput: true,
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

export async function getOrPromptTtl({
  flagValue,
  defaultValue,
  values,
}: {
  flagValue?: number;
  defaultValue: number;
  values: number[];
}): Promise<number> {
  if (flagValue !== undefined) {
    const schema = z.union([
      z.number().refine((num) => values.includes(num), {
        message: `TTL value must be one of the allowed TTL values: ${values.join(", ")}.`,
      }),
      z.undefined(),
    ]);
    const result = schema.safeParse(flagValue);
    if (result.error) {
      throw Error(result.error.issues[0].message);
    } else {
      return flagValue;
    }
  } else {
    const input = (
      await inquirer.prompt([
        {
          type: "list",
          name: "ttl",
          message: `TTL:`,
          choices: values
            .slice()
            .sort((a, b) => a - b)
            .map((ttl) => ({
              name: `${ttl} day${ttl > 1 ? "s" : ""}`,
              value: ttl,
            })),
          default: values.indexOf(defaultValue),
        },
      ])
    ).ttl;
    return input;
  }
}
