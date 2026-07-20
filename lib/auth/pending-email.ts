import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import { getServerEnvironment } from "@/lib/env";

export const PENDING_EMAIL_COOKIE = "kinward-pending-email";
export const PENDING_EMAIL_MAX_AGE_SECONDS = 15 * 60;

function encryptionKey() {
  const environment = getServerEnvironment();
  if (!environment) return null;
  return createHash("sha256")
    .update(environment.KINWARD_AUTH_COOKIE_SECRET)
    .digest();
}

export function sealPendingEmail(email: string): string | null {
  const key = encryptionKey();
  if (!key) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(email, "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString(
    "base64url",
  );
}

export function openPendingEmail(value: string | undefined): string | null {
  if (!value) return null;
  const key = encryptionKey();
  if (!key) return null;
  try {
    const payload = Buffer.from(value, "base64url");
    if (payload.length < 29) return null;
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      payload.subarray(0, 12),
    );
    decipher.setAuthTag(payload.subarray(12, 28));
    return Buffer.concat([
      decipher.update(payload.subarray(28)),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  if (!local || !domain) return "your email address";
  return `${local.slice(0, 1)}${"•".repeat(Math.min(3, Math.max(1, local.length - 1)))}@${domain}`;
}
