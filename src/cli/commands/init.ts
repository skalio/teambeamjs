import { Command } from "@commander-js/extra-typings";
import colors from "ansi-colors";
import { z } from "zod";
import { SkalioIdEnvironment } from "../../entities/skalioId.js";
import { createSkalioIdApi } from "../../services/apiSkalioId.js";
import { ConfigService } from "../../services/config.js";
import { getOrPrompt } from "../../utils/input.js";
import { determineToken, jwtDecode } from "../../utils/jwt.js";
import { coloredSymbols } from "../../utils/symbols.js";
import { generateTotpCode } from "../../utils/totp.js";

export function buildInitCommand(config: ConfigService): Command {
  return new Command("init")
    .description("Initialize TeamBeam CLI configuration")
    .option("-H, --host <host>", "API server hostname")
    .option("-e, --email <email>", "Email address")
    .option("-p --password <password>", "Password")
    .option("-o --otp <otp>", "OTP secret (Base32)")
    .action(async (options) => {
      const previous = {
        host: config.get("host"),
        email: config.get("email"),
        password: config.get("password"),
        otp: config.get("otp"),
      };

      var environment: SkalioIdEnvironment;

      const host = await getOrPrompt({
        key: "host",
        message: "API Host:",
        flagValue: options.host,
        defaultValue: previous.host,
        validate: async (input) => {
          if (z.string().url().safeParse(input).error)
            return "Must be a valid URL";
          if (
            z
              .string()
              .url()
              .refine((val) => {
                try {
                  const url = new URL(val);
                  return (
                    url.pathname === "/" &&
                    url.search === "" &&
                    url.hash === "" &&
                    !val.endsWith("/")
                  );
                } catch {
                  return false;
                }
              })
              .safeParse(input).error
          )
            return "Must be a valid URL with no path and no trailing slash";

          const apiSkalioId = createSkalioIdApi(config, input);
          try {
            environment = await apiSkalioId.fetchEnvironment();
            return true;
          } catch (error) {
            return `No Skalio ID REST API found at provided host. Error: '${error}'`;
          }
        },
      });

      config.set({ host });

      const apiSkalioId = createSkalioIdApi(config);

      const email = await getOrPrompt({
        key: "email",
        message: "Email:",
        flagValue: options.email,
        defaultValue: previous.email,
        validate: async (input) => {
          if (!z.string().email().safeParse(input).success)
            return "Invalid email format";
          const exists = await apiSkalioId.doesAccountExist(input);
          return exists || "Email does not exist on server";
        },
      });

      let idToken: string | null = null;
      let mfaToken: string | null = null;
      let mfaRequired = false;

      const password = await getOrPrompt({
        key: "password",
        message: "Password:",
        flagValue: options.password,
        defaultValue: previous.password,
        mask: true,
        validate: async (input) => {
          if (!input) return "Password is required";
          try {
            const { token } = await apiSkalioId.login({ email, key: input });
            const decodedJwt = jwtDecode(token);
            const typedToken = determineToken(decodedJwt);

            if (typedToken?.scope == "idtoken") {
              mfaRequired = false;
              mfaToken = null;
              idToken = token;
              return true;
            } else if (typedToken?.scope == "mfa") {
              mfaRequired = true;
              mfaToken = token;
              idToken = null;
              return true;
            } else {
              return `Something went wrong: unexpected token response '${decodedJwt}'`;
            }
          } catch (error) {
            return `Login with provided password failed: ${error}`;
          }
        },
      });

      if (options.otp && mfaToken === null) {
        if (idToken === null) {
          throw new Error(
            "StateError: should have obtained either ID- or MFA token by now"
          );
        } else {
          console.log(
            coloredSymbols.info +
              colors.yellow(
                ` OTP secret '${options.otp}' provided but not needed for account '${email}', ignoring\n`
              )
          );
        }
      }

      let otp = options.otp ?? previous.otp ?? "";

      if (mfaRequired) {
        otp = await getOrPrompt({
          key: "otp",
          message: "OTP Secret:",
          mask: true,
          flagValue: options.otp,
          defaultValue: previous.otp,
          validate: async (val) => {
            if (!val) return "Please provide your TOTP secret";
            const code = generateTotpCode(val);
            try {
              const { token } = await apiSkalioId.provideTotpCode(
                { email, key: code },
                mfaToken!
              );
              const decodedJwt = jwtDecode(token);
              const typedToken = determineToken(decodedJwt);
              if (typedToken?.scope != "idtoken")
                return `Something went wrong: unexpected token response '${decodedJwt}'`;

              idToken = token;
              return true;
            } catch (error) {
              return `Login with provided TOTP code failed: ${error}`;
            }
          },
        });
      }

      if (idToken === null)
        throw new Error("StateError: should have obtained idToken by now");

      config.set({ host, email, password, idToken, otp });
    });
}
