import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { randomUUID } from "node:crypto";

export const circleNameSchema = z
  .string()
  .transform((value) => value.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(2).max(60));
export const circleIdSchema = z.string().uuid();

export type AuthorizedCircle = {
  id: string;
  displayName: string;
  isCircleHead: boolean;
};
type CircleRecord = { id: string; display_name: string; status: string };
type RoleRecord = { role_code: string; status: string };
type MembershipRecord = {
  family_circles: CircleRecord | CircleRecord[] | null;
  circle_role_assignments: RoleRecord[] | null;
};

export async function listAuthorizedCircles(
  userId: string,
): Promise<AuthorizedCircle[] | null> {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("circle_memberships")
    .select(
      "id,circle_id,family_circles!inner(id,display_name,status),circle_role_assignments(role_code,status)",
    )
    .eq("user_id", userId)
    .eq("status", "active");
  if (error) return null;
  return ((data ?? []) as unknown as MembershipRecord[]).flatMap((row) => {
    const circle = Array.isArray(row.family_circles)
      ? row.family_circles[0]
      : row.family_circles;
    if (!circle || circle.status !== "active") return [];
    return [
      {
        id: circle.id,
        displayName: circle.display_name,
        isCircleHead: (row.circle_role_assignments ?? []).some(
          (role) =>
            role.role_code === "circle_head" && role.status === "active",
        ),
      },
    ];
  });
}

export async function getAuthorizedCircle(userId: string, rawCircleId: string) {
  const parsed = circleIdSchema.safeParse(rawCircleId);
  if (!parsed.success) {
    await recordCircleAccessDenied();
    return null;
  }
  const circles = await listAuthorizedCircles(userId);
  const circle = circles?.find((item) => item.id === parsed.data) ?? null;
  if (!circle) await recordCircleAccessDenied(parsed.data);
  return circle;
}

async function recordCircleAccessDenied(attemptedContextId?: string) {
  const supabase = await createSupabaseServerClient();
  if (supabase)
    await supabase.rpc("record_circle_access_denied", {
      p_correlation_id: randomUUID(),
      p_attempted_context_id: attemptedContextId ?? null,
    });
}
