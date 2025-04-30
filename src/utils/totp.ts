import { authenticator } from 'otplib';

export function generateTotpCode(secret: string): string {
  return authenticator.generate(secret);
}