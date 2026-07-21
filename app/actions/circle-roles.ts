"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import { writeCircleRoleOperationalLog } from "@/lib/circle-role-logging";
import { roleMutationSchema, roleOperationSchema } from "@/lib/circle-roles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type RoleActionState = {
  status: "idle" | "error";
  message?: string;
};

function safeError(): RoleActionState {
  return {
    status: "error",
    message: "The role change could not be completed.",
  };
}

export async function assignFamilyCoordinator(
  _: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const account = await requireAuthenticatedAdult();
  const input = roleMutationSchema.safeParse({
    circleId: formData.get("circleId"),
    membershipId: formData.get("membershipId"),
    idempotencyKey: formData.get("idempotencyKey"),
  });
  if (!input.success) return safeError();
  const circle = await getAuthorizedCircle(account.userId, input.data.circleId);
  if (!circle?.isCircleHead) return safeError();
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("assign_family_coordinator", {
        p_circle_id: circle.id,
        p_membership_id: input.data.membershipId,
        p_idempotency_key: input.data.idempotencyKey,
      })
    : null;
  if (!result || result.error) return safeError();
  writeCircleRoleOperationalLog({
    channel: "circle-role-operations",
    correlationId: input.data.idempotencyKey,
    event: "assignment",
    result: "success",
  });
  redirect(`/circles/${circle.id}/members?role=assigned`);
}

export async function transitionCircleRole(
  _: RoleActionState,
  formData: FormData,
): Promise<RoleActionState> {
  const account = await requireAuthenticatedAdult();
  const operation = roleOperationSchema.safeParse(formData.get("operation"));
  const input = roleMutationSchema.safeParse({
    circleId: formData.get("circleId"),
    membershipId: formData.get("membershipId"),
    assignmentId: formData.get("assignmentId"),
    expectedVersion: formData.get("expectedVersion"),
    idempotencyKey: formData.get("idempotencyKey") || randomUUID(),
  });
  if (!operation.success || !input.success || !input.data.assignmentId)
    return safeError();
  const circle = await getAuthorizedCircle(account.userId, input.data.circleId);
  if (!circle?.isCircleHead) return safeError();
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("transition_circle_role", {
        p_assignment_id: input.data.assignmentId,
        p_operation: operation.data,
        p_expected_version: input.data.expectedVersion,
        p_idempotency_key: input.data.idempotencyKey,
      })
    : null;
  if (!result || result.error) return safeError();
  writeCircleRoleOperationalLog({
    channel: "circle-role-operations",
    correlationId: input.data.idempotencyKey,
    event: "lifecycle",
    result: "success",
  });
  const data = result.data as { outcome?: string };
  if (data.outcome === "final_head_blocked")
    redirect(`/circles/${circle.id}/members?role=final-head-blocked`);
  redirect(`/circles/${circle.id}/members?role=${operation.data}d`);
}
