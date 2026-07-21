"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  OWNERSHIP_CONSENT_VERSION,
  careRecipientIdSchema,
  careRecipientLabelSchema,
  generateInvitationToken,
  hashInvitationToken,
  invitedEmailSchema,
  ownershipTokenSchema,
  proposalModeSchema,
} from "@/lib/care-recipients";
import { deliverInvitationSynthetically } from "@/lib/invitations/delivery";
import { circleIdSchema, getAuthorizedCircle } from "@/lib/circles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type CareRecipientActionState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldError?: string;
  careRecipientId?: string;
  deliveryCaptured?: boolean;
};

function genericProposalError(): CareRecipientActionState {
  return {
    status: "error",
    message: "We could not complete this proposal. Try again.",
  };
}

export async function proposeCareRecipient(
  _: CareRecipientActionState,
  formData: FormData,
): Promise<CareRecipientActionState> {
  const account = await requireAuthenticatedAdult();
  const circleId = circleIdSchema.safeParse(formData.get("circleId"));
  const mode = proposalModeSchema.safeParse(formData.get("proposalMode"));
  const label = careRecipientLabelSchema.safeParse(
    formData.get("displayLabel"),
  );
  const key = circleIdSchema.safeParse(formData.get("idempotencyKey"));
  if (!circleId.success || !mode.success || !key.success) {
    return genericProposalError();
  }
  if (!label.success) {
    return {
      status: "error",
      message: "Check the highlighted field",
      fieldError: "Enter a display label between 2 and 60 characters.",
    };
  }

  const circle = await getAuthorizedCircle(account.userId, circleId.data);
  if (!circle?.isCircleHead) {
    return { status: "error", message: "This action is unavailable" };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return genericProposalError();

  if (mode.data === "self_add") {
    const consent = formData.get("ownershipConsent");
    if (consent !== "accepted") {
      return {
        status: "error",
        message: "Check the highlighted field",
        fieldError:
          "Confirm that you understand you become the sole owner before continuing.",
      };
    }
    const created = await supabase.rpc("self_activate_care_recipient", {
      p_circle_id: circle.id,
      p_display_label: label.data,
      p_idempotency_key: key.data,
      p_consent_version: OWNERSHIP_CONSENT_VERSION,
    });
    if (created.error) return genericProposalError();
    const payload = created.data as {
      care_recipient_id?: string;
      created?: boolean;
    } | null;
    const recipientId = careRecipientIdSchema.safeParse(
      payload?.care_recipient_id,
    );
    if (!recipientId.success) return genericProposalError();
    redirect(
      `/circles/${circle.id}/care-recipients/${recipientId.data}?activated=1`,
    );
  }

  const email = invitedEmailSchema.safeParse(formData.get("ownerEmail"));
  if (!email.success) {
    return {
      status: "error",
      message: "Check the highlighted field",
      fieldError:
        "Enter a valid synthetic verified-email address using example.test or example.com.",
    };
  }

  const { token, digest } = generateInvitationToken();
  const created = await supabase.rpc("propose_care_recipient", {
    p_circle_id: circle.id,
    p_display_label: label.data,
    p_invited_email: email.data,
    p_token_digest: digest,
    p_idempotency_key: key.data,
  });

  if (created.error) {
    const code = created.error.message ?? "";
    if (code.includes("invalid_email") || code.includes("synthetic_email")) {
      return {
        status: "error",
        message: "Check the highlighted field",
        fieldError:
          "Enter a valid synthetic verified-email address using example.test or example.com.",
      };
    }
    return genericProposalError();
  }

  const payload = created.data as {
    care_recipient_id?: string;
    invitation_id?: string;
    created?: boolean;
  } | null;
  const recipientId = careRecipientIdSchema.safeParse(
    payload?.care_recipient_id,
  );
  const invitationId = careRecipientIdSchema.safeParse(payload?.invitation_id);
  if (!recipientId.success || !invitationId.success) {
    return genericProposalError();
  }

  let deliveryCaptured = false;
  if (payload?.created) {
    const delivery = await deliverInvitationSynthetically({
      supabase,
      invitationId: invitationId.data,
      invitedEmail: email.data,
      token,
      kind: "ownership",
    });
    deliveryCaptured = delivery.status === "captured";
  }

  redirect(
    `/circles/${circle.id}/care-recipients/pending/${recipientId.data}?created=1${
      payload?.created && !deliveryCaptured ? "&delivery=pending" : ""
    }`,
  );
}

export async function cancelOwnershipProposal(formData: FormData) {
  const account = await requireAuthenticatedAdult();
  const circleId = circleIdSchema.safeParse(formData.get("circleId"));
  const careRecipientId = careRecipientIdSchema.safeParse(
    formData.get("careRecipientId"),
  );
  if (!circleId.success || !careRecipientId.success) {
    redirect("/my-kinward?notice=unavailable");
  }
  const circle = await getAuthorizedCircle(account.userId, circleId.data);
  if (!circle?.isCircleHead) redirect("/my-kinward?notice=unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/my-kinward?notice=unavailable");
  await supabase.rpc("cancel_ownership_proposal", {
    p_care_recipient_id: careRecipientId.data,
  });
  redirect(`/circles/${circle.id}?proposal=cancelled`);
}

export async function resendOwnershipInvitation(formData: FormData) {
  const account = await requireAuthenticatedAdult();
  const circleId = circleIdSchema.safeParse(formData.get("circleId"));
  const careRecipientId = careRecipientIdSchema.safeParse(
    formData.get("careRecipientId"),
  );
  if (!circleId.success || !careRecipientId.success) {
    redirect("/my-kinward?notice=unavailable");
  }
  const circle = await getAuthorizedCircle(account.userId, circleId.data);
  if (!circle?.isCircleHead) redirect("/my-kinward?notice=unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/my-kinward?notice=unavailable");

  const { token, digest } = generateInvitationToken();
  const resent = await supabase.rpc("resend_ownership_invitation", {
    p_care_recipient_id: careRecipientId.data,
    p_token_digest: digest,
    p_idempotency_key: randomUUID(),
  });
  if (resent.error || !resent.data) {
    redirect(
      `/circles/${circle.id}/care-recipients/pending/${careRecipientId.data}?resend=failed`,
    );
  }

  const payload = resent.data as {
    invitation_id?: string;
    created?: boolean;
  };
  const newInvitationId = careRecipientIdSchema.safeParse(
    payload.invitation_id,
  );
  if (!newInvitationId.success) {
    redirect(
      `/circles/${circle.id}/care-recipients/pending/${careRecipientId.data}?resend=failed`,
    );
  }

  const { findSyntheticInvitationRecipient } =
    await import("@/lib/invitations/delivery");
  const recipientEmail = await findSyntheticInvitationRecipient(
    String(formData.get("invitationId") ?? ""),
  );
  let deliveryCaptured = false;
  if (recipientEmail && payload.created !== false) {
    const delivery = await deliverInvitationSynthetically({
      supabase,
      invitationId: newInvitationId.data,
      invitedEmail: recipientEmail,
      token,
      kind: "ownership",
    });
    deliveryCaptured = delivery.status === "captured";
  }

  redirect(
    `/circles/${circle.id}/care-recipients/pending/${careRecipientId.data}?resent=1${
      deliveryCaptured ? "" : "&delivery=pending"
    }`,
  );
}

export async function resolveOwnershipPreview(token: string) {
  const parsed = ownershipTokenSchema.safeParse(token);
  if (!parsed.success) return { outcome: "unavailable" as const };
  await requireAuthenticatedAdult();
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { outcome: "unavailable" as const };
  const preview = await supabase.rpc("preview_ownership_invitation", {
    p_token_digest: hashInvitationToken(parsed.data),
  });
  if (preview.error || !preview.data)
    return { outcome: "unavailable" as const };
  return preview.data as Record<string, unknown>;
}

export async function acceptOwnershipInvitation(formData: FormData) {
  const account = await requireAuthenticatedAdult();
  const token = ownershipTokenSchema.safeParse(formData.get("token"));
  const consent = formData.get("ownershipConsent");
  const key = circleIdSchema.safeParse(formData.get("idempotencyKey"));
  if (!token.success || !key.success) {
    redirect("/ownership/unavailable");
  }
  if (consent !== "accepted") {
    redirect(
      `/ownership/accept/${encodeURIComponent(token.data)}?error=consent`,
    );
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/ownership/unavailable");
  const result = await supabase.rpc("accept_ownership_invitation", {
    p_token_digest: hashInvitationToken(token.data),
    p_consent_version: OWNERSHIP_CONSENT_VERSION,
    p_idempotency_key: key.data,
  });
  if (result.error) redirect("/ownership/unavailable");
  const payload = result.data as Record<string, unknown> | null;
  const outcome = String(payload?.outcome ?? "unavailable");
  if (outcome !== "accepted") {
    redirect(
      outcome === "consent_required"
        ? `/ownership/accept/${encodeURIComponent(token.data)}?error=consent`
        : "/ownership/unavailable",
    );
  }
  const circleId = circleIdSchema.safeParse(payload?.circle_id);
  const careRecipientId = careRecipientIdSchema.safeParse(
    payload?.care_recipient_id,
  );
  if (!circleId.success || !careRecipientId.success) {
    redirect("/my-kinward?ownership=accepted");
  }
  void account;
  redirect(
    `/circles/${circleId.data}/care-recipients/${careRecipientId.data}?ownership=accepted`,
  );
}

export async function declineOwnershipInvitation(formData: FormData) {
  await requireAuthenticatedAdult();
  const token = ownershipTokenSchema.safeParse(formData.get("token"));
  if (!token.success) redirect("/ownership/unavailable");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/ownership/unavailable");
  const result = await supabase.rpc("decline_ownership_invitation", {
    p_token_digest: hashInvitationToken(token.data),
  });
  if (result.error) redirect("/ownership/unavailable");
  const payload = result.data as Record<string, unknown> | null;
  if (String(payload?.outcome ?? "") !== "declined") {
    redirect("/ownership/unavailable");
  }
  redirect("/my-kinward?ownership=declined");
}

export async function switchCareRecipient(formData: FormData) {
  const account = await requireAuthenticatedAdult();
  const circleId = circleIdSchema.safeParse(formData.get("circleId"));
  const destination = String(formData.get("destination") ?? "");
  if (!circleId.success) redirect("/my-kinward?notice=unavailable");
  const circle = await getAuthorizedCircle(account.userId, circleId.data);
  if (!circle) redirect("/my-kinward?notice=unavailable");

  if (destination === "circle-wide") {
    redirect(`/circles/${circle.id}`);
  }

  const careRecipientId = careRecipientIdSchema.safeParse(destination);
  if (!careRecipientId.success) {
    redirect(`/circles/${circle.id}/switch-recipient?notice=unavailable`);
  }

  const { getOwnedCareRecipient } =
    await import("@/lib/care-recipients/access");
  const recipient = await getOwnedCareRecipient(
    account.userId,
    circle.id,
    careRecipientId.data,
  );
  if (!recipient) {
    redirect(`/circles/${circle.id}/switch-recipient?notice=unavailable`);
  }
  redirect(`/circles/${circle.id}/care-recipients/${recipient.id}`);
}
