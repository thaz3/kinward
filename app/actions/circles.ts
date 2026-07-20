"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  circleIdSchema,
  circleNameSchema,
  getAuthorizedCircle,
} from "@/lib/circles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CircleActionState = {
  status: "idle" | "error";
  message?: string;
  fieldError?: string;
};

export async function createCircle(
  _: CircleActionState,
  formData: FormData,
): Promise<CircleActionState> {
  await requireAuthenticatedAdult();
  const name = circleNameSchema.safeParse(formData.get("circleName"));
  const key = circleIdSchema.safeParse(formData.get("idempotencyKey"));
  if (!name.success)
    return {
      status: "error",
      message: "Check the highlighted field",
      fieldError: "Use 2–60 characters.",
    };
  if (!key.success)
    return {
      status: "error",
      message: "We could not create this Circle. Try again.",
    };
  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("create_family_circle", {
        p_display_name: name.data,
        p_idempotency_key: key.data,
      })
    : null;
  if (!result || result.error || !circleIdSchema.safeParse(result.data).success)
    return {
      status: "error",
      message: "We could not create this Circle. Try again.",
    };
  redirect(`/circles/${result.data}`);
}

export async function switchCircle(formData: FormData) {
  const account = await requireAuthenticatedAdult();
  const id = formData.get("circleId");
  const circle =
    typeof id === "string"
      ? await getAuthorizedCircle(account.userId, id)
      : null;
  if (!circle) redirect("/my-kinward?notice=unavailable");
  redirect(`/circles/${circle.id}`);
}
