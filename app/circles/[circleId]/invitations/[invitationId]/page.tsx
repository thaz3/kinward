import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/app-shell";
import { PendingInvitationDetail } from "@/components/pending-invitation-detail";
import {
  PermissionDeniedState,
  UnavailableState,
} from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pending invitation" };

export default async function PendingInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string; invitationId: string }>;
  searchParams: Promise<{
    created?: string;
    resent?: string;
    delivery?: string;
    error?: string;
  }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, invitationId } = await params;
  const query = await searchParams;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle?.isCircleHead) {
    return (
      <AppShell
        currentPath=""
        pageTitle="Pending invitation"
        context={{
          circleLabel: "Unavailable",
          careRecipientLabel: "Unavailable",
          destinations: [],
        }}
      >
        <PermissionDeniedState />
      </AppShell>
    );
  }

  const supabase = await createSupabaseServerClient();
  const result = supabase
    ? await supabase.rpc("get_pending_circle_invitation", {
        p_circle_id: circle.id,
        p_invitation_id: invitationId,
      })
    : null;
  const payload =
    result?.data && typeof result.data === "object"
      ? (result.data as Record<string, unknown>)
      : null;
  if (!payload || payload.outcome !== "pending") {
    return (
      <AppShell
        currentPath={`/circles/${circle.id}/invitations`}
        pageTitle="Pending invitation"
        context={{
          circleLabel: circle.displayName,
          careRecipientLabel: "Circle-wide",
          destinations: [
            { href: `/circles/${circle.id}`, label: "Overview" },
            { href: `/circles/${circle.id}/invitations`, label: "Invitations" },
          ],
        }}
      >
        <UnavailableState />
        <p role="status">This invitation is no longer pending.</p>
      </AppShell>
    );
  }

  const notice = query.created
    ? query.delivery === "pending"
      ? "Invitation created. Synthetic delivery capture was unavailable; the invitation remains pending."
      : "Invitation created. Synthetic delivery was captured for the approved test destination."
    : query.resent
      ? "Invitation resent. The previous link no longer works."
      : undefined;

  return (
    <AppShell
      currentPath={`/circles/${circle.id}/invitations/${invitationId}`}
      pageTitle="Pending invitation"
      context={{
        circleLabel: circle.displayName,
        careRecipientLabel: "Circle-wide",
        destinations: [
          { href: `/circles/${circle.id}`, label: "Overview" },
          { href: `/circles/${circle.id}/invitations`, label: "Invitations" },
          { href: `/circles/${circle.id}/invite`, label: "Invite" },
        ],
      }}
    >
      <PendingInvitationDetail
        circleId={circle.id}
        invitationId={String(payload.invitation_id)}
        emailMask={String(payload.invited_email_mask)}
        createdAt={String(payload.created_at)}
        expiresAt={String(payload.expires_at)}
        idempotencyKey={randomUUID()}
        notice={notice}
        error={Boolean(query.error)}
      />
    </AppShell>
  );
}
