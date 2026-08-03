"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import {
  accessReviewSchema,
  activationSchema,
  finiteExpirationSchema,
  lifecycleTransitionSchema,
  representativeAcceptanceSchema,
  untilRevokedSchema,
} from "@/lib/delegated-grants";
import {
  writeManagementGrantOperationalLog,
  type ManagementGrantOperationalEvent,
} from "@/lib/management-grant-logging";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DelegationActionState = {
  status: "idle" | "error";
  message?: string;
};

const unavailable = (): DelegationActionState => ({
  status: "error",
  message: "The delegation change could not be completed.",
});

function detailPath(input: {
  circleId: string;
  careRecipientId: string;
  grantId: string;
}) {
  return `/circles/${input.circleId}/care-recipients/${input.careRecipientId}/management/delegated/${input.grantId}`;
}

async function callDelegationRpc(input: {
  correlationId: string;
  event: ManagementGrantOperationalEvent;
  procedure: string;
  args: Record<string, unknown>;
}) {
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc(input.procedure, input.args)
    : null;
  writeManagementGrantOperationalLog({
    correlationId: input.correlationId,
    event: input.event,
    result: !result || result.error ? "unavailable" : "success",
  });
  return Boolean(result && !result.error);
}

export async function setDelegationFiniteExpiration(
  _: DelegationActionState,
  formData: FormData,
): Promise<DelegationActionState> {
  const account = await requireAuthenticatedAdult();
  const input = finiteExpirationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const succeeded = await callDelegationRpc({
    correlationId: input.data.idempotencyKey,
    event: "delegated_duration_finite",
    procedure: "set_delegation_finite_expiration",
    args: {
      p_circle_id: input.data.circleId,
      p_care_recipient_id: input.data.careRecipientId,
      p_grant_id: input.data.grantId,
      p_expiration_local_date: input.data.expirationLocalDate,
      p_expected_version: input.data.expectedVersion,
      p_idempotency_key: input.data.idempotencyKey,
    },
  });
  if (!succeeded) return unavailable();
  redirect(`${detailPath(input.data)}?duration=finite`);
}

export async function setDelegationUntilRevoked(
  _: DelegationActionState,
  formData: FormData,
): Promise<DelegationActionState> {
  const account = await requireAuthenticatedAdult();
  const input = untilRevokedSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const succeeded = await callDelegationRpc({
    correlationId: input.data.idempotencyKey,
    event: "delegated_duration_until_revoked",
    procedure: "set_delegation_until_revoked",
    args: {
      p_circle_id: input.data.circleId,
      p_care_recipient_id: input.data.careRecipientId,
      p_grant_id: input.data.grantId,
      p_consent_version: input.data.consentVersion,
      p_expected_version: input.data.expectedVersion,
      p_idempotency_key: input.data.idempotencyKey,
    },
  });
  if (!succeeded) return unavailable();
  redirect(`${detailPath(input.data)}?duration=until_revoked`);
}

export async function acceptDelegationAsRepresentative(
  _: DelegationActionState,
  formData: FormData,
): Promise<DelegationActionState> {
  await requireAuthenticatedAdult();
  const input = representativeAcceptanceSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!input.success) return unavailable();
  const succeeded = await callDelegationRpc({
    correlationId: input.data.idempotencyKey,
    event: "delegated_acceptance",
    procedure: "accept_delegation_as_representative",
    args: {
      p_circle_id: input.data.circleId,
      p_care_recipient_id: input.data.careRecipientId,
      p_grant_id: input.data.grantId,
      p_terms_fingerprint: input.data.termsFingerprint,
      p_consent_version: input.data.consentVersion,
      p_idempotency_key: input.data.idempotencyKey,
    },
  });
  if (!succeeded) return unavailable();
  redirect(`${detailPath(input.data)}?delegation=accepted`);
}

export async function activateDelegatedGrant(
  _: DelegationActionState,
  formData: FormData,
): Promise<DelegationActionState> {
  const account = await requireAuthenticatedAdult();
  const input = activationSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const succeeded = await callDelegationRpc({
    correlationId: input.data.idempotencyKey,
    event: "delegated_activation",
    procedure: "activate_delegated_grant",
    args: {
      p_circle_id: input.data.circleId,
      p_care_recipient_id: input.data.careRecipientId,
      p_grant_id: input.data.grantId,
      p_terms_fingerprint: input.data.termsFingerprint,
      p_consent_version: input.data.consentVersion,
      p_expected_version: input.data.expectedVersion,
      p_idempotency_key: input.data.idempotencyKey,
    },
  });
  if (!succeeded) return unavailable();
  redirect(`${detailPath(input.data)}?delegation=activated`);
}

const LIFECYCLE_PROCEDURES = {
  suspend: {
    procedure: "suspend_delegated_grant",
    event: "delegated_suspend" as ManagementGrantOperationalEvent,
    outcome: "suspended",
  },
  restore: {
    procedure: "restore_delegated_grant",
    event: "delegated_restore" as ManagementGrantOperationalEvent,
    outcome: "restored",
  },
  revoke: {
    procedure: "revoke_delegated_grant",
    event: "delegated_revoke" as ManagementGrantOperationalEvent,
    outcome: "revoked",
  },
} as const;

export async function transitionDelegatedGrant(
  _: DelegationActionState,
  formData: FormData,
): Promise<DelegationActionState> {
  const account = await requireAuthenticatedAdult();
  const input = lifecycleTransitionSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const transition = LIFECYCLE_PROCEDURES[input.data.operation];
  const succeeded = await callDelegationRpc({
    correlationId: input.data.idempotencyKey,
    event: transition.event,
    procedure: transition.procedure,
    args: {
      p_circle_id: input.data.circleId,
      p_care_recipient_id: input.data.careRecipientId,
      p_grant_id: input.data.grantId,
      p_expected_version: input.data.expectedVersion,
      p_idempotency_key: input.data.idempotencyKey,
    },
  });
  if (!succeeded) return unavailable();
  redirect(`${detailPath(input.data)}?delegation=${transition.outcome}`);
}

export async function completeDelegationAccessReview(
  _: DelegationActionState,
  formData: FormData,
): Promise<DelegationActionState> {
  const account = await requireAuthenticatedAdult();
  const input = accessReviewSchema.safeParse(Object.fromEntries(formData));
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const succeeded = await callDelegationRpc({
    correlationId: input.data.idempotencyKey,
    event: "delegated_access_review",
    procedure: "complete_delegation_access_review",
    args: {
      p_circle_id: input.data.circleId,
      p_care_recipient_id: input.data.careRecipientId,
      p_grant_id: input.data.grantId,
      p_decision: input.data.decision,
      p_expected_version: input.data.expectedVersion,
      p_idempotency_key: input.data.idempotencyKey,
    },
  });
  if (!succeeded) return unavailable();
  redirect(`${detailPath(input.data)}?delegation=reviewed`);
}
