import { z } from "zod";
import { MANAGEMENT_MODE_CODES } from "@/lib/management-mode-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export { MANAGEMENT_MODE_COPY } from "@/lib/management-mode-catalog";
export const managementModeSchema = z.enum(MANAGEMENT_MODE_CODES);
export type ManagementModeCode = z.infer<typeof managementModeSchema>;

export const managementModeMutationSchema = z.object({
  circleId: z.string().uuid(),
  careRecipientId: z.string().uuid(),
  modeCode: managementModeSchema,
  expectedVersion: z.coerce.number().int().nonnegative(),
  idempotencyKey: z.string().uuid(),
});

export type CareManagementMode = {
  modeId: string;
  modeCode: ManagementModeCode;
  status: "active";
  version: number;
};

export async function canSelectManagementMode(
  circleId: string,
  careRecipientId: string,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const result = await supabase.rpc("can_select_management_mode", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  return !result.error && result.data === true;
}

export async function getCareManagementMode(
  circleId: string,
  careRecipientId: string,
): Promise<CareManagementMode | null | undefined> {
  if (!(await canSelectManagementMode(circleId, careRecipientId)))
    return undefined;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return undefined;
  const result = await supabase.rpc("get_care_management_mode", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  if (result.error) return undefined;
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  if (!row) return null;
  const mode = managementModeSchema.safeParse(row.mode_code);
  if (!mode.success) return undefined;
  return {
    modeId: String(row.mode_id),
    modeCode: mode.data,
    status: "active",
    version: Number(row.mode_version),
  };
}
