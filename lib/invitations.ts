import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";

export const INVITATION_TOKEN_BYTES = 32;
export const INVITATION_EXPIRY_DAYS = 7;
export const SYNTHETIC_INVITE_DOMAINS = [
  "example.test",
  "example.com",
] as const;
export const SLICE_4_PROPOSED_ROLE = "family_coordinator" as const;

export const invitationIdSchema = z.string().uuid();
export const invitationTokenSchema = z
  .string()
  .min(40)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);

export const invitedEmailSchema = z
  .string()
  .trim()
  .max(254)
  .transform((email) => email.toLowerCase())
  .pipe(
    z.email().refine((email) => {
      const domain = email.split("@")[1] ?? "";
      return (SYNTHETIC_INVITE_DOMAINS as readonly string[]).includes(domain);
    }, "Use a synthetic example.test or example.com address."),
  );

export type InvitationOutcome =
  | "ready"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled"
  | "mismatch"
  | "already_used"
  | "unavailable"
  | "not_pending"
  | "pending";

export function normalizeInvitationEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateInvitationToken(): {
  token: string;
  digest: string;
} {
  const token = randomBytes(INVITATION_TOKEN_BYTES).toString("base64url");
  return { token, digest: hashInvitationToken(token) };
}

export function invitationDeliveryMarker(token: string): string {
  return createHash("sha256").update(`delivery:${token}`, "utf8").digest("hex");
}

export function destinationDomain(
  email: string,
): "example.test" | "example.com" {
  const domain = normalizeInvitationEmail(email).split("@")[1] ?? "";
  if (domain === "example.com") return "example.com";
  return "example.test";
}

export function maskInvitationEmail(email: string): string {
  const normalized = normalizeInvitationEmail(email);
  const [local = "", domain = ""] = normalized.split("@");
  if (!local || !domain) return "•••@••••";
  return `${local.slice(0, 1)}${"•".repeat(Math.min(3, Math.max(1, local.length - 1)))}@${domain}`;
}

export function invitationAcceptPath(token: string): string {
  return `/invitations/accept/${encodeURIComponent(token)}`;
}

export function proposedAssignmentSummary(): string {
  return "Family Coordinator · Circle-wide";
}
