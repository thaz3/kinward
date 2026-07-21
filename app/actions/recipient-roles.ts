"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import { writeRecipientRoleOperationalLog } from "@/lib/recipient-role-logging";
import { recipientRoleMutationSchema } from "@/lib/recipient-roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RecipientRoleActionState = {
  status: "idle" | "error";
  message?: string;
};
const unavailable = (): RecipientRoleActionState => ({
  status: "error",
  message: "The role change could not be completed.",
});

export async function assignRecipientRole(
  _: RecipientRoleActionState,
  formData: FormData,
): Promise<RecipientRoleActionState> {
  const account = await requireAuthenticatedAdult();
  const input = recipientRoleMutationSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!input.success || !input.data.roleCode) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("assign_recipient_role", {
        p_circle_id: input.data.circleId,
        p_care_recipient_id: input.data.careRecipientId,
        p_membership_id: input.data.membershipId,
        p_role_code: input.data.roleCode,
        p_idempotency_key: input.data.idempotencyKey,
      })
    : null;
  if (!result || result.error) return unavailable();
  writeRecipientRoleOperationalLog({
    correlationId: input.data.idempotencyKey,
    event: "assignment",
    result: "success",
  });
  redirect(
    `/circles/${input.data.circleId}/care-recipients/${input.data.careRecipientId}/roles?role=assigned`,
  );
}

export async function transitionRecipientRole(
  _: RecipientRoleActionState,
  formData: FormData,
): Promise<RecipientRoleActionState> {
  const account = await requireAuthenticatedAdult();
  const operation = formData.get("operation");
  const input = recipientRoleMutationSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (
    !input.success ||
    !input.data.assignmentId ||
    (operation !== "suspend" && operation !== "remove")
  )
    return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("transition_recipient_role", {
        p_assignment_id: input.data.assignmentId,
        p_operation: operation,
        p_expected_version: input.data.expectedVersion,
        p_idempotency_key: input.data.idempotencyKey,
      })
    : null;
  if (!result || result.error) return unavailable();
  writeRecipientRoleOperationalLog({
    correlationId: input.data.idempotencyKey,
    event: "lifecycle",
    result: "success",
  });
  redirect(
    `/circles/${input.data.circleId}/care-recipients/${input.data.careRecipientId}/roles?role=${operation}d`,
  );
}
