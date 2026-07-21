import { z } from "zod";
import {
  generateInvitationToken,
  hashInvitationToken,
  invitationTokenSchema,
  invitedEmailSchema,
  maskInvitationEmail,
  normalizeInvitationEmail,
} from "@/lib/invitations";

export const OWNERSHIP_CONSENT_VERSION = "kinward.ownership.v1" as const;
export const OWNERSHIP_INVITATION_EXPIRY_DAYS = 7;
export const CARE_RECIPIENT_LABEL_MIN = 2;
export const CARE_RECIPIENT_LABEL_MAX = 60;

export const careRecipientIdSchema = z.string().uuid();
export const ownershipTokenSchema = invitationTokenSchema;
export { invitedEmailSchema, generateInvitationToken, hashInvitationToken };

export const careRecipientLabelSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(CARE_RECIPIENT_LABEL_MIN).max(CARE_RECIPIENT_LABEL_MAX));

export const proposalModeSchema = z.enum(["propose_other", "self_add"]);

export const ownershipConsentSchema = z.literal("accepted");

export type OwnershipOutcome =
  | "ready"
  | "accepted"
  | "declined"
  | "expired"
  | "cancelled"
  | "mismatch"
  | "already_used"
  | "unavailable"
  | "consent_required"
  | "pending";

export type OwnedCareRecipient = {
  id: string;
  circleId: string;
  displayLabel: string;
  status: "active";
};

export type PendingCareRecipient = {
  id: string;
  circleId: string;
  displayLabel: string;
  status: "proposed";
  invitationId: string;
  invitedEmailMask: string;
  expiresAt: string;
};

export function ownershipAcceptPath(token: string): string {
  return `/ownership/accept/${encodeURIComponent(token)}`;
}

export function ownershipDeliveryMarker(token: string): string {
  return hashInvitationToken(`ownership-delivery:${token}`);
}

export function normalizeCareRecipientLabel(label: string): string {
  return label.trim().replace(/\s+/g, " ");
}

export function maskOwnerEmail(email: string): string {
  return maskInvitationEmail(normalizeInvitationEmail(email));
}

export const OWNERSHIP_CONSEQUENCE_COPY = [
  "You become the sole owner of this Care Recipient profile. The Circle Head does not remain an owner.",
  "You control who receives access and may manage or revoke access under Kinward’s approved permission model.",
  "Family relationship alone grants no authority.",
  "Circle-wide roles grant no Care Recipient access.",
  "Accepting does not create legal authority outside Kinward.",
  "Later management or delegation requires separate explicit setup.",
  "Your consent is required before private Care Recipient information becomes available. No private information is shown before acceptance.",
  "Acceptance activates sole ownership and any required Circle membership together. It does not use a second ordinary invitation.",
  "No medical information is being collected in this step.",
] as const;
