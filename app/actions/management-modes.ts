"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import { writeManagementModeOperationalLog } from "@/lib/management-mode-logging";
import { managementModeMutationSchema } from "@/lib/management-modes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ManagementModeActionState = {
  status: "idle" | "error";
  message?: string;
};

const unavailable = (): ManagementModeActionState => ({
  status: "error",
  message: "The management mode change could not be completed.",
});

export async function selectCareManagementMode(
  _: ManagementModeActionState,
  formData: FormData,
): Promise<ManagementModeActionState> {
  const account = await requireAuthenticatedAdult();
  const input = managementModeMutationSchema.safeParse(
    Object.fromEntries(formData),
  );
  if (!input.success) return unavailable();
  const recipient = await getOwnedCareRecipient(
    account.userId,
    input.data.circleId,
    input.data.careRecipientId,
  );
  if (!recipient) return unavailable();
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("select_care_management_mode", {
        p_circle_id: input.data.circleId,
        p_care_recipient_id: input.data.careRecipientId,
        p_mode_code: input.data.modeCode,
        p_expected_version: input.data.expectedVersion,
        p_idempotency_key: input.data.idempotencyKey,
      })
    : null;
  if (!result || result.error) {
    writeManagementModeOperationalLog({
      correlationId: input.data.idempotencyKey,
      event: "select",
      result: "unavailable",
    });
    return unavailable();
  }
  writeManagementModeOperationalLog({
    correlationId: input.data.idempotencyKey,
    event: "select",
    result: "success",
  });
  redirect(
    `/circles/${input.data.circleId}/care-recipients/${input.data.careRecipientId}/management-mode?mode=selected`,
  );
}
