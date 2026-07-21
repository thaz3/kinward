import { z } from "zod";
import { RECIPIENT_ROLE_CODES } from "@/lib/recipient-role-catalog";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export { RECIPIENT_ROLE_COPY } from "@/lib/recipient-role-catalog";
export const recipientRoleSchema = z.enum(RECIPIENT_ROLE_CODES);
export type RecipientRoleCode = z.infer<typeof recipientRoleSchema>;
export const recipientRoleMutationSchema = z.object({
  circleId: z.string().uuid(),
  careRecipientId: z.string().uuid(),
  membershipId: z.string().uuid(),
  assignmentId: z.string().uuid().optional(),
  roleCode: recipientRoleSchema.optional(),
  expectedVersion: z.coerce.number().int().positive().optional(),
  idempotencyKey: z.string().uuid(),
});

export type RecipientRoleMember = {
  membershipId: string;
  displayName: string;
  isCurrentActor: boolean;
  assignments: Array<{
    id: string;
    roleCode: RecipientRoleCode;
    status: "active" | "suspended";
    version: number;
  }>;
};

export async function canManageRecipientRoles(
  circleId: string,
  careRecipientId: string,
) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const result = await supabase.rpc("can_manage_recipient_roles", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  return !result.error && result.data === true;
}

export async function listRecipientRoleMembers(
  circleId: string,
  careRecipientId: string,
) {
  if (!(await canManageRecipientRoles(circleId, careRecipientId))) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const result = await supabase.rpc("list_recipient_role_members", {
    p_circle_id: circleId,
    p_care_recipient_id: careRecipientId,
  });
  if (result.error) return null;
  const members = new Map<string, RecipientRoleMember>();
  for (const row of (result.data ?? []) as Array<Record<string, unknown>>) {
    const role = recipientRoleSchema.safeParse(row.role_code);
    const member = members.get(String(row.membership_id)) ?? {
      membershipId: String(row.membership_id),
      displayName: String(row.display_name),
      isCurrentActor: row.is_current_actor === true,
      assignments: [],
    };
    if (
      row.assignment_id &&
      role.success &&
      (row.role_status === "active" || row.role_status === "suspended")
    ) {
      member.assignments.push({
        id: String(row.assignment_id),
        roleCode: role.data,
        status: row.role_status,
        version: Number(row.assignment_version),
      });
    }
    members.set(member.membershipId, member);
  }
  return [...members.values()];
}
