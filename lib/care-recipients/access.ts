import { randomUUID } from "node:crypto";
import { circleIdSchema, getAuthorizedCircle } from "@/lib/circles";
import {
  careRecipientIdSchema,
  type OwnedCareRecipient,
  type PendingCareRecipient,
} from "@/lib/care-recipients";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function listOwnedCareRecipients(
  userId: string,
  circleId: string,
): Promise<OwnedCareRecipient[] | null> {
  const circle = await getAuthorizedCircle(userId, circleId);
  if (!circle) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("list_owned_care_recipients", {
    p_circle_id: circle.id,
  });
  if (error) return null;
  return ((data as Array<Record<string, unknown>> | null) ?? []).flatMap(
    (row) => {
      const id = careRecipientIdSchema.safeParse(row.care_recipient_id);
      const label =
        typeof row.display_label === "string" ? row.display_label : null;
      if (!id.success || !label) return [];
      return [
        {
          id: id.data,
          circleId: circle.id,
          displayLabel: label,
          status: "active" as const,
        },
      ];
    },
  );
}

export async function getOwnedCareRecipient(
  userId: string,
  circleId: string,
  careRecipientId: string,
): Promise<OwnedCareRecipient | null> {
  const parsedCircle = circleIdSchema.safeParse(circleId);
  const parsedRecipient = careRecipientIdSchema.safeParse(careRecipientId);
  if (!parsedCircle.success || !parsedRecipient.success) {
    await recordCareRecipientAccessDenied();
    return null;
  }

  const circle = await getAuthorizedCircle(userId, parsedCircle.data);
  if (!circle) {
    await recordCareRecipientAccessDenied(parsedRecipient.data);
    return null;
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_owned_care_recipient", {
    p_circle_id: circle.id,
    p_care_recipient_id: parsedRecipient.data,
  });
  if (error) {
    await recordCareRecipientAccessDenied(parsedRecipient.data);
    return null;
  }
  const payload = data as Record<string, unknown> | null;
  if (!payload || payload.outcome !== "ready") {
    await recordCareRecipientAccessDenied(parsedRecipient.data);
    return null;
  }
  const label =
    typeof payload.display_label === "string" ? payload.display_label : null;
  if (!label) {
    await recordCareRecipientAccessDenied(parsedRecipient.data);
    return null;
  }
  return {
    id: parsedRecipient.data,
    circleId: circle.id,
    displayLabel: label,
    status: "active",
  };
}

export async function listPendingCareRecipients(
  userId: string,
  circleId: string,
): Promise<PendingCareRecipient[] | null> {
  const circle = await getAuthorizedCircle(userId, circleId);
  if (!circle?.isCircleHead) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("list_pending_care_recipients", {
    p_circle_id: circle.id,
  });
  if (error) return null;
  return ((data as Array<Record<string, unknown>> | null) ?? []).flatMap(
    (row) => {
      const id = careRecipientIdSchema.safeParse(row.care_recipient_id);
      const invitationId = careRecipientIdSchema.safeParse(row.invitation_id);
      const label =
        typeof row.display_label === "string" ? row.display_label : null;
      const mask =
        typeof row.invited_email_mask === "string"
          ? row.invited_email_mask
          : null;
      const expiresAt =
        typeof row.expires_at === "string" ? row.expires_at : null;
      if (!id.success || !invitationId.success || !label || !mask || !expiresAt)
        return [];
      return [
        {
          id: id.data,
          circleId: circle.id,
          displayLabel: label,
          status: "proposed" as const,
          invitationId: invitationId.data,
          invitedEmailMask: mask,
          expiresAt,
        },
      ];
    },
  );
}

export async function getPendingCareRecipient(
  userId: string,
  circleId: string,
  careRecipientId: string,
): Promise<PendingCareRecipient | null> {
  const circle = await getAuthorizedCircle(userId, circleId);
  if (!circle?.isCircleHead) return null;
  const parsedRecipient = careRecipientIdSchema.safeParse(careRecipientId);
  if (!parsedRecipient.success) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_pending_care_recipient", {
    p_circle_id: circle.id,
    p_care_recipient_id: parsedRecipient.data,
  });
  if (error) return null;
  const payload = data as Record<string, unknown> | null;
  if (
    !payload ||
    (payload.outcome !== "ready" && payload.outcome !== "pending")
  ) {
    return null;
  }
  const invitationId = careRecipientIdSchema.safeParse(payload.invitation_id);
  const label =
    typeof payload.display_label === "string" ? payload.display_label : null;
  const mask =
    typeof payload.invited_email_mask === "string"
      ? payload.invited_email_mask
      : null;
  const expiresAt =
    typeof payload.expires_at === "string" ? payload.expires_at : null;
  if (!invitationId.success || !label || !mask || !expiresAt) return null;
  return {
    id: parsedRecipient.data,
    circleId: circle.id,
    displayLabel: label,
    status: "proposed",
    invitationId: invitationId.data,
    invitedEmailMask: mask,
    expiresAt,
  };
}

async function recordCareRecipientAccessDenied(attemptedContextId?: string) {
  const supabase = await createSupabaseServerClient();
  if (supabase)
    await supabase.rpc("record_care_recipient_access_denied", {
      p_correlation_id: randomUUID(),
      p_attempted_context_id: attemptedContextId ?? null,
    });
}
