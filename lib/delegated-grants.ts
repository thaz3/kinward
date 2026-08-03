import { z } from "zod";
import {
  MANAGEMENT_SCOPE_CODES,
  type ManagementScopeCode,
} from "@/lib/management-grant-catalog";
import {
  DELEGATION_CONSENT_VERSIONS,
  DELEGATION_DURATION_MODES,
  DELEGATION_STATUSES,
  type DelegationDurationMode,
  type DelegationStatus,
} from "@/lib/delegation-lifecycle-catalog";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import { canManageManagementGrants } from "@/lib/management-grants";
import { getCareManagementMode } from "@/lib/management-modes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export {
  DELEGATION_CONSENT_VERSIONS,
  DELEGATION_DURATION_COPY,
  DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS,
  DELEGATION_STATUS_COPY,
  DELEGATION_BOUNDARY_NOTES,
} from "@/lib/delegation-lifecycle-catalog";

const scopeSchema = z.enum(MANAGEMENT_SCOPE_CODES);
const fingerprintSchema = z.string().regex(/^[0-9a-f]{64}$/);
const localDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const grantContextSchema = z.object({
  circleId: z.string().uuid(),
  careRecipientId: z.string().uuid(),
  grantId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
});

const versionedContextSchema = grantContextSchema.extend({
  expectedVersion: z.coerce.number().int().positive(),
});

export const finiteExpirationSchema = versionedContextSchema.extend({
  expirationLocalDate: localDateSchema,
});

export const untilRevokedSchema = versionedContextSchema.extend({
  consentVersion: z.literal(DELEGATION_CONSENT_VERSIONS.untilRevoked),
});

export const representativeAcceptanceSchema = grantContextSchema.extend({
  termsFingerprint: fingerprintSchema,
  consentVersion: z.literal(
    DELEGATION_CONSENT_VERSIONS.representativeAcceptance,
  ),
});

export const activationSchema = versionedContextSchema.extend({
  termsFingerprint: fingerprintSchema,
  consentVersion: z.literal(DELEGATION_CONSENT_VERSIONS.ownerActivation),
});

export const lifecycleTransitionSchema = versionedContextSchema.extend({
  operation: z.enum(["suspend", "restore", "revoke"]),
});

export const accessReviewSchema = versionedContextSchema.extend({
  decision: z.literal("keep_access"),
});

export type DelegatedGrantDetail = {
  grantId: string;
  viewerRole: "owner" | "representative";
  careRecipientLabel: string;
  membershipId: string;
  displayName: string;
  status: DelegationStatus;
  selectionMode: "selected" | "all_current";
  permissionCodes: ManagementScopeCode[];
  durationMode: DelegationDurationMode | null;
  governingTimeZone: string | null;
  circleTimeZone: string | null;
  expirationLocalDate: string | null;
  expiresAt: string | null;
  activatedAt: string | null;
  suspendedAt: string | null;
  restoredAt: string | null;
  revokedAt: string | null;
  expiredAt: string | null;
  nextReviewAt: string | null;
  lastReviewedAt: string | null;
  lastReviewDecision: "keep_access" | null;
  reviewDue: boolean;
  termsFingerprint: string | null;
  representativeAccepted: boolean;
  ownerActivationConsented: boolean;
  version: number;
};

export type DelegatedGrantSummary = Pick<
  DelegatedGrantDetail,
  | "grantId"
  | "membershipId"
  | "displayName"
  | "status"
  | "durationMode"
  | "governingTimeZone"
  | "expirationLocalDate"
  | "expiresAt"
  | "nextReviewAt"
  | "reviewDue"
  | "permissionCodes"
  | "representativeAccepted"
  | "ownerActivationConsented"
  | "version"
>;

const statusSchema = z.enum(DELEGATION_STATUSES);
const durationSchema = z.enum(DELEGATION_DURATION_MODES);

function text(value: unknown) {
  return typeof value === "string" && value.length ? value : null;
}

export async function getSuggestedExpirationDate(
  circleId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const result = await supabase.rpc("suggested_delegation_expiration_date", {
    p_circle_id: circleId,
  });
  if (result.error) return null;
  const parsed = localDateSchema.safeParse(result.data);
  return parsed.success ? parsed.data : null;
}

export async function getCircleTimeZone(
  circleId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const result = await supabase.rpc("get_family_circle_time_zone", {
    p_circle_id: circleId,
  });
  if (result.error) return null;
  return text(result.data);
}

export async function hasRecentTrustedAuthentication(): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const result = await supabase.rpc("has_recent_trusted_authentication");
  return !result.error && result.data === true;
}

export async function listDelegatedManagementGrants(
  circleId: string,
  careRecipientId: string,
): Promise<DelegatedGrantSummary[] | null> {
  if (!(await canManageManagementGrants(circleId, careRecipientId)))
    return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const result = await supabase.rpc("list_delegated_management_grants", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  if (result.error) return null;
  const grants = new Map<string, DelegatedGrantSummary>();
  for (const row of (result.data ?? []) as Array<Record<string, unknown>>) {
    const status = statusSchema.safeParse(row.grant_status);
    if (!status.success) continue;
    const grantId = String(row.grant_id);
    const duration = durationSchema.safeParse(row.duration_mode);
    const current = grants.get(grantId) ?? {
      grantId,
      membershipId: String(row.membership_id),
      displayName: String(row.display_name),
      status: status.data,
      durationMode: duration.success ? duration.data : null,
      governingTimeZone: text(row.governing_time_zone),
      expirationLocalDate: text(row.expiration_local_date),
      expiresAt: text(row.expires_at),
      nextReviewAt: text(row.next_review_at),
      reviewDue: row.review_due === true,
      permissionCodes: [] as ManagementScopeCode[],
      representativeAccepted: row.representative_accepted === true,
      ownerActivationConsented: row.owner_activation_consented === true,
      version: Number(row.grant_version),
    };
    const code = scopeSchema.safeParse(row.permission_code);
    if (code.success && !current.permissionCodes.includes(code.data))
      current.permissionCodes.push(code.data);
    grants.set(grantId, current);
  }
  return [...grants.values()];
}

export type DelegationReviewDue = {
  grantId: string;
  circleId: string;
  careRecipientId: string;
  careRecipientLabel: string;
  representativeName: string;
  governingTimeZone: string | null;
  nextReviewAt: string | null;
};

export async function listDelegationReviewsDue(): Promise<
  DelegationReviewDue[]
> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const result = await supabase.rpc("list_delegation_reviews_due");
  if (result.error) return [];
  return ((result.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    grantId: String(row.grant_id),
    circleId: String(row.circle_id),
    careRecipientId: String(row.care_recipient_id),
    careRecipientLabel: String(row.care_recipient_label),
    representativeName: String(row.representative_name),
    governingTimeZone: text(row.governing_time_zone),
    nextReviewAt: text(row.next_review_at),
  }));
}

export async function getDelegatedGrantDetail(
  circleId: string,
  careRecipientId: string,
  grantId: string,
): Promise<DelegatedGrantDetail | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const result = await supabase.rpc("get_delegated_grant_detail", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
    p_grant_id: grantId,
  });
  if (result.error) return null;
  const payload = result.data as Record<string, unknown> | null;
  if (!payload) return null;
  const status = statusSchema.safeParse(payload.status);
  if (!status.success) return null;
  const duration = durationSchema.safeParse(payload.duration_mode);
  const codes = Array.isArray(payload.permission_codes)
    ? payload.permission_codes.flatMap((value) => {
        const code = scopeSchema.safeParse(value);
        return code.success ? [code.data] : [];
      })
    : [];
  return {
    grantId: String(payload.grant_id),
    viewerRole:
      payload.viewer_role === "representative" ? "representative" : "owner",
    careRecipientLabel: text(payload.care_recipient_label) ?? "Care Recipient",
    membershipId: String(payload.membership_id),
    displayName: String(payload.display_name),
    status: status.data,
    selectionMode:
      payload.selection_mode === "all_current" ? "all_current" : "selected",
    permissionCodes: codes,
    durationMode: duration.success ? duration.data : null,
    governingTimeZone: text(payload.governing_time_zone),
    circleTimeZone: text(payload.circle_time_zone),
    expirationLocalDate: text(payload.expiration_local_date),
    expiresAt: text(payload.expires_at),
    activatedAt: text(payload.activated_at),
    suspendedAt: text(payload.suspended_at),
    restoredAt: text(payload.restored_at),
    revokedAt: text(payload.revoked_at),
    expiredAt: text(payload.expired_at),
    nextReviewAt: text(payload.next_review_at),
    lastReviewedAt: text(payload.last_reviewed_at),
    lastReviewDecision:
      payload.last_review_decision === "keep_access" ? "keep_access" : null,
    reviewDue: payload.review_due === true,
    termsFingerprint: text(payload.terms_fingerprint),
    representativeAccepted: payload.representative_accepted === true,
    ownerActivationConsented: payload.owner_activation_consented === true,
    version: Number(payload.version),
  };
}

// Owner lifecycle screens all require the same authorization: management-grant
// authority, an active Delegated Management mode, ownership of this Care
// Recipient, and an owner view of this exact grant. Any gap is a neutral denial.
export async function loadOwnerDelegationContext(
  userId: string,
  circleId: string,
  careRecipientId: string,
  grantId: string,
): Promise<{
  recipientLabel: string;
  grant: DelegatedGrantDetail;
} | null> {
  if (!(await canManageManagementGrants(circleId, careRecipientId)))
    return null;
  const mode = await getCareManagementMode(circleId, careRecipientId);
  if (mode?.modeCode !== "delegated_management") return null;
  const recipient = await getOwnedCareRecipient(
    userId,
    circleId,
    careRecipientId,
  );
  if (!recipient) return null;
  const grant = await getDelegatedGrantDetail(
    circleId,
    careRecipientId,
    grantId,
  );
  if (!grant || grant.viewerRole !== "owner") return null;
  return { recipientLabel: recipient.displayLabel, grant };
}

// A delegation may activate only when every closed precondition is already
// satisfied. This mirrors the database invariants so the interface never offers
// an activation that the server would refuse.
export function activationReadiness(grant: DelegatedGrantDetail): {
  ready: boolean;
  blockers: string[];
} {
  const blockers: string[] = [];
  if (grant.status !== "pending")
    blockers.push("This delegation is not pending.");
  if (!grant.durationMode) blockers.push("Choose a duration first.");
  if (grant.durationMode === "finite" && !grant.expirationLocalDate)
    blockers.push("Choose an expiration date first.");
  if (!grant.permissionCodes.length)
    blockers.push("An exact scope snapshot is required.");
  if (!grant.representativeAccepted)
    blockers.push(`${grant.displayName} has not accepted this delegation yet.`);
  if (!grant.termsFingerprint)
    blockers.push("This delegation version is incomplete.");
  if (
    grant.governingTimeZone &&
    grant.circleTimeZone &&
    grant.governingTimeZone !== grant.circleTimeZone
  )
    blockers.push(
      "This Circle's time zone changed. Confirm the duration again before activating.",
    );
  return { ready: blockers.length === 0, blockers };
}

export function formatInGoverningZone(
  value: string | null,
  timeZone: string | null,
): string | null {
  if (!value) return null;
  const moment = new Date(value);
  if (Number.isNaN(moment.getTime())) return null;
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "long",
      timeStyle: "short",
      timeZone: timeZone ?? "UTC",
    }).format(moment);
  } catch {
    return moment.toISOString();
  }
}

// The calendar date in a governing IANA zone, optionally shifted by whole days.
// Used to bound the custom-date control at the earliest date the server accepts.
export function localDateInZone(
  timeZone: string | null,
  offsetDays = 0,
): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timeZone ?? "UTC",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const [year, month, day] = parts.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + offsetDays))
    .toISOString()
    .slice(0, 10);
}

export function formatLocalDate(value: string | null): string | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function lifecycleActions(grant: DelegatedGrantDetail): {
  canReview: boolean;
  canSuspend: boolean;
  canRestore: boolean;
  canRevoke: boolean;
  canChooseDuration: boolean;
} {
  const owner = grant.viewerRole === "owner";
  return {
    canReview: owner && grant.status === "active" && grant.reviewDue,
    canSuspend: owner && grant.status === "active",
    canRestore:
      owner &&
      grant.status === "suspended" &&
      (!grant.expiresAt || new Date(grant.expiresAt).getTime() > Date.now()),
    canRevoke:
      owner && (grant.status === "active" || grant.status === "suspended"),
    canChooseDuration: owner && grant.status === "pending",
  };
}
