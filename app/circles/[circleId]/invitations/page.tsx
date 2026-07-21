import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  EmptyState,
  PermissionDeniedState,
  UnavailableState,
} from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pending invitations" };

type PendingRow = {
  invitation_id: string;
  invited_email_mask: string;
  status: string;
  created_at: string;
  expires_at: string;
  proposed_role: string;
};

export default async function PendingInvitationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string }>;
  searchParams: Promise<{ cancelled?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId } = await params;
  const query = await searchParams;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle?.isCircleHead) {
    return (
      <AppShell
        currentPath=""
        pageTitle="Pending invitations"
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
    ? await supabase.rpc("list_pending_circle_invitations", {
        p_circle_id: circle.id,
      })
    : null;
  if (!result || result.error) {
    return (
      <AppShell
        currentPath={`/circles/${circle.id}/invitations`}
        pageTitle="Pending invitations"
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
      </AppShell>
    );
  }

  const rows = (result.data ?? []) as PendingRow[];

  return (
    <AppShell
      currentPath={`/circles/${circle.id}/invitations`}
      pageTitle="Pending invitations"
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
      {query.cancelled && (
        <p role="status" aria-live="polite">
          Invitation cancelled. No membership was created.
        </p>
      )}
      <p>
        <Link className="button primary" href={`/circles/${circle.id}/invite`}>
          Invite an adult member
        </Link>
      </p>
      {rows.length === 0 ? (
        <EmptyState
          heading="No pending invitations"
          message="Pending invitations for this Circle will appear here."
          action={{
            href: `/circles/${circle.id}/invite`,
            label: "Invite an adult member",
          }}
        />
      ) : (
        <ul className="stack-list">
          {rows.map((row) => (
            <li key={row.invitation_id}>
              <Link
                className="content-card link-card"
                href={`/circles/${circle.id}/invitations/${row.invitation_id}`}
              >
                <span className="visually-hidden">Open invitation for </span>
                {row.invited_email_mask}
                <span className="status-copy">
                  {" "}
                  Pending · Family Coordinator
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
