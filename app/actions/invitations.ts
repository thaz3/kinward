"use server";

import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { circleIdSchema, getAuthorizedCircle } from "@/lib/circles";
import {
  generateInvitationToken,
  invitationIdSchema,
  invitationTokenSchema,
  invitedEmailSchema,
  hashInvitationToken,
} from "@/lib/invitations";
import {
  deliverInvitationSynthetically,
  findSyntheticInvitationRecipient,
} from "@/lib/invitations/delivery";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type InvitationActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldError?: string;
  invitationId?: string;
  deliveryCaptured?: boolean;
};

function genericCreateError(): InvitationActionState {
  return {
    status: "error",
    message: "We could not create this invitation. Try again.",
  };
}

export async function createInvitation(
  _: InvitationActionState,
  formData: FormData,
): Promise<InvitationActionState> {
  const account = await requireAuthenticatedAdult();
  const circleId = circleIdSchema.safeParse(formData.get("circleId"));
  const email = invitedEmailSchema.safeParse(formData.get("invitedEmail"));
  const key = circleIdSchema.safeParse(formData.get("idempotencyKey"));
  if (!circleId.success || !key.success) return genericCreateError();
  if (!email.success) {
    return {
      status: "error",
      message: "Check the highlighted field",
      fieldError:
        "Enter a valid synthetic verified-email address using example.test or example.com.",
    };
  }

  const circle = await getAuthorizedCircle(account.userId, circleId.data);
  if (!circle?.isCircleHead) {
    return {
      status: "error",
      message: "This action is unavailable",
    };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return genericCreateError();

  const { token, digest } = generateInvitationToken();
  const created = await supabase.rpc("create_circle_invitation", {
    p_circle_id: circle.id,
    p_invited_email: email.data,
    p_token_digest: digest,
    p_idempotency_key: key.data,
  });

  if (created.error) {
    const code = created.error.message ?? "";
    // already_member and other conflicts use the same generic confirmation so
    // account existence and membership facts are not disclosed by creation errors.
    if (code.includes("invalid_email") || code.includes("synthetic_email")) {
      return {
        status: "error",
        message: "Check the highlighted field",
        fieldError:
          "Enter a valid synthetic verified-email address using example.test or example.com.",
      };
    }
    return genericCreateError();
  }

  const payload = created.data as {
    invitation_id?: string;
    created?: boolean;
  } | null;
  const invitationId = invitationIdSchema.safeParse(payload?.invitation_id);
  if (!invitationId.success) return genericCreateError();

  let deliveryCaptured = false;
  if (payload?.created) {
    const delivery = await deliverInvitationSynthetically({
      supabase,
      invitationId: invitationId.data,
      invitedEmail: email.data,
      token,
    });
    deliveryCaptured = delivery.status === "captured";
  }

  redirect(
    `/circles/${circle.id}/invitations/${invitationId.data}?created=1${
      payload?.created && !deliveryCaptured ? "&delivery=pending" : ""
    }`,
  );
}

export async function cancelInvitation(formData: FormData) {
  const account = await requireAuthenticatedAdult();
  const circleId = circleIdSchema.safeParse(formData.get("circleId"));
  const invitationId = invitationIdSchema.safeParse(
    formData.get("invitationId"),
  );
  if (!circleId.success || !invitationId.success) {
    redirect("/my-kinward?notice=unavailable");
  }
  const circle = await getAuthorizedCircle(account.userId, circleId.data);
  if (!circle?.isCircleHead) redirect("/my-kinward?notice=unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    redirect(`/circles/${circle.id}/invitations/${invitationId.data}?error=1`);
  const result = await supabase.rpc("cancel_circle_invitation", {
    p_invitation_id: invitationId.data,
  });
  if (result.error) {
    redirect(`/circles/${circle.id}/invitations/${invitationId.data}?error=1`);
  }
  redirect(`/circles/${circle.id}/invitations?cancelled=1`);
}

export async function resendInvitation(formData: FormData) {
  const account = await requireAuthenticatedAdult();
  const circleId = circleIdSchema.safeParse(formData.get("circleId"));
  const invitationId = invitationIdSchema.safeParse(
    formData.get("invitationId"),
  );
  const key = circleIdSchema.safeParse(formData.get("idempotencyKey"));
  if (!circleId.success || !invitationId.success || !key.success) {
    redirect("/my-kinward?notice=unavailable");
  }
  const circle = await getAuthorizedCircle(account.userId, circleId.data);
  if (!circle?.isCircleHead) redirect("/my-kinward?notice=unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    redirect(`/circles/${circle.id}/invitations/${invitationId.data}?error=1`);
  }

  const invitedEmail = await findSyntheticInvitationRecipient(
    invitationId.data,
  );
  if (!invitedEmail) {
    redirect(
      `/circles/${circle.id}/invitations/${invitationId.data}?delivery=pending`,
    );
  }

  const { token, digest } = generateInvitationToken();
  const result = await supabase.rpc("resend_circle_invitation", {
    p_invitation_id: invitationId.data,
    p_token_digest: digest,
    p_idempotency_key: key.data,
  });
  if (result.error || typeof result.data !== "string") {
    redirect(`/circles/${circle.id}/invitations/${invitationId.data}?error=1`);
  }
  const newId = invitationIdSchema.parse(result.data);
  const delivery = await deliverInvitationSynthetically({
    supabase,
    invitationId: newId,
    invitedEmail,
    token,
  });
  redirect(
    `/circles/${circle.id}/invitations/${newId}?resent=1${
      delivery.status === "captured" ? "" : "&delivery=pending"
    }`,
  );
}

export async function acceptInvitation(formData: FormData) {
  await requireAuthenticatedAdult();
  const token = invitationTokenSchema.safeParse(formData.get("token"));
  if (!token.success) redirect("/invitations/unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/invitations/unavailable");
  const result = await supabase.rpc("accept_circle_invitation", {
    p_token_digest: hashInvitationToken(token.data),
  });
  const outcome =
    result.data && typeof result.data === "object"
      ? String((result.data as { outcome?: string }).outcome ?? "unavailable")
      : "unavailable";
  if (outcome === "accepted") {
    const circleId = circleIdSchema.safeParse(
      (result.data as { circle_id?: string }).circle_id,
    );
    if (circleId.success) redirect(`/circles/${circleId.data}?joined=1`);
  }
  redirect(`/invitations/accept/${encodeURIComponent(token.data)}`);
}

export async function declineInvitation(formData: FormData) {
  await requireAuthenticatedAdult();
  const token = invitationTokenSchema.safeParse(formData.get("token"));
  if (!token.success) redirect("/invitations/unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/invitations/unavailable");
  const result = await supabase.rpc("decline_circle_invitation", {
    p_token_digest: hashInvitationToken(token.data),
  });
  const outcome =
    result.data && typeof result.data === "object"
      ? String((result.data as { outcome?: string }).outcome ?? "unavailable")
      : "unavailable";
  if (outcome === "declined") redirect("/my-kinward?invitation=declined");
  redirect(`/invitations/accept/${encodeURIComponent(token.data)}`);
}

export async function resolveInvitationPreview(token: string) {
  const parsed = invitationTokenSchema.safeParse(token);
  if (!parsed.success) return { outcome: "unavailable" as const };
  await requireAuthenticatedAdult();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { outcome: "unavailable" as const };
  const result = await supabase.rpc("preview_circle_invitation", {
    p_token_digest: hashInvitationToken(parsed.data),
  });
  if (result.error || !result.data || typeof result.data !== "object") {
    return { outcome: "unavailable" as const };
  }
  return result.data as Record<string, unknown>;
}

export async function declineMyInvitation(formData: FormData) {
  await requireAuthenticatedAdult();
  const invitationId = invitationIdSchema.safeParse(
    formData.get("invitationId"),
  );
  if (!invitationId.success) redirect("/invitations/unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/invitations/unavailable");
  const result = await supabase.rpc("decline_my_circle_invitation", {
    p_invitation_id: invitationId.data,
  });
  const outcome =
    result.data && typeof result.data === "object"
      ? String((result.data as { outcome?: string }).outcome ?? "unavailable")
      : "unavailable";
  if (outcome === "declined") redirect("/my-kinward?invitation=declined");
  redirect(`/invitations/mine/${invitationId.data}`);
}
