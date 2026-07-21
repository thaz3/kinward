import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const circleWideRoleSchema = z.enum([
  "circle_head",
  "family_coordinator",
]);
export const roleOperationSchema = z.enum(["suspend", "remove"]);
export const roleMutationSchema = z.object({
  circleId: z.string().uuid(),
  membershipId: z.string().uuid(),
  assignmentId: z.string().uuid().optional(),
  expectedVersion: z.coerce.number().int().positive().optional(),
  idempotencyKey: z.string().uuid(),
});

export type CircleRoleMember = {
  membershipId: string;
  displayName: string;
  isCurrentActor: boolean;
  assignments: Array<{
    id: string;
    roleCode: "circle_head" | "family_coordinator";
    status: "active" | "suspended";
    version: number;
  }>;
};

type RoleRow = {
  membership_id: string;
  display_name: string;
  assignment_id: string | null;
  role_code: "circle_head" | "family_coordinator" | null;
  role_status: "active" | "suspended" | null;
  assignment_version: number | null;
  is_current_actor: boolean;
};

export async function listCircleRoleMembers(
  circleId: string,
): Promise<CircleRoleMember[] | null> {
  const supabase = await createSupabaseServerClient();
  const authorization = supabase
    ? await supabase.rpc("can_view_circle_roles", { p_circle_id: circleId })
    : null;
  if (!authorization || authorization.error || authorization.data !== true)
    return null;
  const result = supabase
    ? await supabase.rpc("list_circle_role_members", { p_circle_id: circleId })
    : null;
  if (!result || result.error) return null;
  const members = new Map<string, CircleRoleMember>();
  for (const row of (result.data ?? []) as RoleRow[]) {
    const member = members.get(row.membership_id) ?? {
      membershipId: row.membership_id,
      displayName: row.display_name,
      isCurrentActor: row.is_current_actor,
      assignments: [],
    };
    if (
      row.assignment_id &&
      row.role_code &&
      row.role_status &&
      row.assignment_version
    ) {
      member.assignments.push({
        id: row.assignment_id,
        roleCode: row.role_code,
        status: row.role_status,
        version: row.assignment_version,
      });
    }
    members.set(row.membership_id, member);
  }
  return [...members.values()];
}

export async function canViewCircleRoles(circleId: string): Promise<boolean> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return false;
  const result = await supabase.rpc("can_view_circle_roles", {
    p_circle_id: circleId,
  });
  return !result.error && result.data === true;
}

export function roleLabel(role: "circle_head" | "family_coordinator") {
  return role === "circle_head" ? "Circle Head" : "Family Coordinator";
}
