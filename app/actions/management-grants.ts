"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import { writeManagementGrantOperationalLog } from "@/lib/management-grant-logging";
import {
  managementGrantMutationSchema,
  resolveScopeSelection,
} from "@/lib/management-grants";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagementGrantActionState = {
  status: "idle" | "error";
  message?: string;
};

const unavailable = (): ManagementGrantActionState => ({
  status: "error",
  message: "The management grant change could not be completed.",
});

export async function createSharedManagementGrant(
  _: ManagementGrantActionState,
  formData: FormData,
): Promise<ManagementGrantActionState> {
  const account = await requireAuthenticatedAdult();
  const rawCodes = formData.getAll("permissionCodes").map(String);
  const input = managementGrantMutationSchema.safeParse({
    ...Object.fromEntries(formData),
    permissionCodes: rawCodes.length
      ? rawCodes
      : formData.get("permissionCodes"),
  });
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const codes = resolveScopeSelection(
    input.data.selectionMode,
    input.data.permissionCodes,
  );
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("create_shared_management_grant", {
        p_circle_id: input.data.circleId,
        p_care_recipient_id: input.data.careRecipientId,
        p_membership_id: input.data.membershipId,
        p_permission_codes: codes,
        p_selection_mode: input.data.selectionMode,
        p_idempotency_key: input.data.idempotencyKey,
      })
    : null;
  if (!result || result.error) {
    writeManagementGrantOperationalLog({
      correlationId: input.data.idempotencyKey,
      event: "shared_create",
      result: "unavailable",
    });
    return unavailable();
  }
  writeManagementGrantOperationalLog({
    correlationId: input.data.idempotencyKey,
    event: "shared_create",
    result: "success",
  });
  redirect(
    `/circles/${input.data.circleId}/care-recipients/${input.data.careRecipientId}/management/shared?grant=created`,
  );
}

export async function createPendingDelegatedGrant(
  _: ManagementGrantActionState,
  formData: FormData,
): Promise<ManagementGrantActionState> {
  const account = await requireAuthenticatedAdult();
  const rawCodes = formData.getAll("permissionCodes").map(String);
  const input = managementGrantMutationSchema.safeParse({
    ...Object.fromEntries(formData),
    permissionCodes: rawCodes.length
      ? rawCodes
      : formData.get("permissionCodes"),
  });
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const codes = resolveScopeSelection(
    input.data.selectionMode,
    input.data.permissionCodes,
  );
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("create_pending_delegated_grant", {
        p_circle_id: input.data.circleId,
        p_care_recipient_id: input.data.careRecipientId,
        p_membership_id: input.data.membershipId,
        p_permission_codes: codes,
        p_selection_mode: input.data.selectionMode,
        p_idempotency_key: input.data.idempotencyKey,
      })
    : null;
  if (!result || result.error) {
    writeManagementGrantOperationalLog({
      correlationId: input.data.idempotencyKey,
      event: "delegated_pending_create",
      result: "unavailable",
    });
    return unavailable();
  }
  writeManagementGrantOperationalLog({
    correlationId: input.data.idempotencyKey,
    event: "delegated_pending_create",
    result: "success",
  });
  redirect(
    `/circles/${input.data.circleId}/care-recipients/${input.data.careRecipientId}/management/delegated/scopes?pending=1&membershipId=${input.data.membershipId}`,
  );
}
