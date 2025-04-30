// src/cli/commands/init.ts

import { Command } from "commander";
import { z } from "zod";
import { SkalioIdEnvironment } from "../../entities/skalioId.js";
import { createSkalioIdApi } from "../../services/apiSkalioId.js";
import { createSkpApi } from "../../services/apiSkp.js";
import { ConfigService } from "../../services/config.js";
import { getOrPrompt } from "../../utils/input.js";
import { determineToken, jwtDecode } from "../../utils/jwt.js";
import { generateTotpCode } from "../../utils/totp.js";

interface LoginResult {
  success: boolean;
  token?: string;
  mfaRequired?: boolean;
  error?: string;
}

async function attemptPasswordLogin(
  host: string,
  email: string,
  password: string
): Promise<LoginResult> {
  console.log(`[stub] password login for ${email} @ ${host}`);
  return {
    success: true,
    token: "temporary-token",
    mfaRequired: false, // simulate MFA requirement
  };
}

async function attemptOtpLogin(
  host: string,
  token: string,
  otpCode: string
): Promise<LoginResult> {
  console.log(`[stub] otp login with code ${otpCode} @ ${host}`);
  return {
    success: true,
    token: "real-id-token",
    mfaRequired: false,
  };
}

export function buildInitCommand(config: ConfigService): Command {
  return new Command("init")
    .description("Initialize TeamBeam CLI configuration")
    .option("--host <host>", "API server hostname")
    .option("--email <email>", "Email address")
    .option("--password <password>", "Password")
    .option("--otp <otp>", "OTP secret (Base32)")
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

          const apiSkalioId = createSkalioIdApi({ host: input });
          try {
            environment = await apiSkalioId.fetchEnvironment();
            return true;
          } catch (error) {
            return `No Skalio ID REST API found at provided host. Error: '${error}'`;
          }
        },
      });

      const apiSkalioId = createSkalioIdApi({ host: host });
      const apiSkp = createSkpApi({ host: host });

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

      let otp = options.otp ?? previous.otp ?? "";

      if (mfaRequired) {
        otp = await getOrPrompt({
          key: "otp",
          message: "OTP Secret:",
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

      console.log(`\n✅ ID token successfully obtained\n`);
      console.dir(jwtDecode(idToken));
      console.log("\n\n");

      config.set({ host, email, password, idToken, otp });

      console.log("\n✅ Config saved successfully:");
      console.log(`Host: ${host}`);
      console.log(`Email: ${email}`);
      console.log(`MFA required: ${mfaRequired ? "Yes" : "No"}`);
    });
}
