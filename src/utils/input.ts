import inquirer from "inquirer";

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
