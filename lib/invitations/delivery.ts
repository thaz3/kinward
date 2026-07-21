import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { destinationDomain, invitationDeliveryMarker } from "@/lib/invitations";

export type SyntheticDeliveryResult =
  | { status: "captured"; captureId: string; correlationId: string }
  | { status: "unavailable"; reason: "not_configured" | "capture_failed" };

/**
 * Milestone One invitation delivery adapter.
 * Local and hosted synthetic preview use capture-only delivery for
 * example.test / example.com destinations. Real outbound email is unavailable.
 */
export async function deliverInvitationSynthetically(input: {
  supabase: SupabaseClient;
  invitationId: string;
  invitedEmail: string;
  token: string;
}): Promise<SyntheticDeliveryResult> {
  const domain = destinationDomain(input.invitedEmail);
  const correlationId = randomUUID();
  const marker = invitationDeliveryMarker(input.token);
  const result = await input.supabase.rpc("capture_invitation_delivery", {
    p_invitation_id: input.invitationId,
    p_destination_domain: domain,
    p_delivery_marker: marker,
    p_correlation_id: correlationId,
  });
  if (result.error || typeof result.data !== "string") {
    return { status: "unavailable", reason: "capture_failed" };
  }
  return {
    status: "captured",
    captureId: result.data,
    correlationId,
  };
}

export function externalInvitationDeliveryAvailable(): false {
  return false;
}
