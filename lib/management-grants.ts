import { z } from "zod";
import {
  MANAGEMENT_SCOPE_CODES,
  MANAGEMENT_SCOPE_COPY,
} from "@/lib/management-grant-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export {
  EXCLUDED_OWNERSHIP_SCOPE,
  MANAGEMENT_SCOPE_CATALOG_VERSION,
  MANAGEMENT_SCOPE_COPY,
} from "@/lib/management-grant-catalog";

export const managementScopeSchema = z.enum(MANAGEMENT_SCOPE_CODES);
export type ManagementScopeCode = z.infer<typeof managementScopeSchema>;

export const managementGrantMutationSchema = z.object({
  circleId: z.string().uuid(),
  careRecipientId: z.string().uuid(),
  membershipId: z.string().uuid(),
  selectionMode: z.enum(["selected", "all_current"]),
  permissionCodes: z
    .union([z.array(managementScopeSchema), z.string()])
    .transform((value) =>
      Array.isArray(value)
        ? value
        : value
            .split(",")
            .map((part) => part.trim())
            .filter(Boolean),
    )
    .pipe(z.array(managementScopeSchema).min(1)),
  idempotencyKey: z.string().uuid(),
});

export type GrantMember = {
  membershipId: string;
  displayName: string;
  isCurrentActor: boolean;
};

export type SharedGrantSummary = {
  grantId: string;
  membershipId: string;
  displayName: string;
  status: "active";
  selectionMode: "selected" | "all_current";
  permissionCodes: ManagementScopeCode[];
  version: number;
};

export async function canManageManagementGrants(
  circleId: string,
  careRecipientId: string,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const result = await supabase.rpc("can_manage_management_grants", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  return !result.error && result.data === true;
}

export async function listManagementGrantMembers(
  circleId: string,
  careRecipientId: string,
): Promise<GrantMember[] | null> {
  if (!(await canManageManagementGrants(circleId, careRecipientId)))
    return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const result = await supabase.rpc("list_management_grant_members", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  if (result.error) return null;
  return ((result.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    membershipId: String(row.membership_id),
    displayName: String(row.display_name),
    isCurrentActor: row.is_current_actor === true,
  }));
}

export async function listSharedManagementGrants(
  circleId: string,
  careRecipientId: string,
): Promise<SharedGrantSummary[] | null> {
  if (!(await canManageManagementGrants(circleId, careRecipientId)))
    return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const result = await supabase.rpc("list_shared_management_grants", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  if (result.error) return null;
  const grants = new Map<string, SharedGrantSummary>();
  for (const row of (result.data ?? []) as Array<Record<string, unknown>>) {
    const code = managementScopeSchema.safeParse(row.permission_code);
    const current = grants.get(String(row.grant_id)) ?? {
      grantId: String(row.grant_id),
      membershipId: String(row.membership_id),
      displayName: String(row.display_name),
      status: "active" as const,
      selectionMode:
        row.selection_mode === "all_current" ? "all_current" : "selected",
      permissionCodes: [] as ManagementScopeCode[],
      version: Number(row.grant_version),
    };
    if (code.success) current.permissionCodes.push(code.data);
    grants.set(current.grantId, current);
  }
  return [...grants.values()];
}

export function resolveScopeSelection(
  selectionMode: "selected" | "all_current",
  selected: ManagementScopeCode[],
): ManagementScopeCode[] {
  if (selectionMode === "all_current") return [...MANAGEMENT_SCOPE_CODES];
  return [...new Set(selected)];
}

export function scopeLabels(codes: ManagementScopeCode[]) {
  return codes.map((code) => MANAGEMENT_SCOPE_COPY[code].label);
}
