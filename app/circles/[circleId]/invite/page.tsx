import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/app-shell";
import { InviteAdultForm } from "@/components/invite-adult-form";
import { PermissionDeniedState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invite an adult member" };

export default async function InviteAdultPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId } = await params;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle?.isCircleHead) {
    return (
      <AppShell
        currentPath=""
        pageTitle="Invite an adult member"
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

  return (
    <AppShell
      currentPath={`/circles/${circle.id}/invite`}
      pageTitle="Invite an adult member"
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
      <InviteAdultForm
        circleId={circle.id}
        circleName={circle.displayName}
        idempotencyKey={randomUUID()}
      />
    </AppShell>
  );
}
