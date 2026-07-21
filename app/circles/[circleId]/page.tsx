import { AppShell } from "@/components/app-shell";
import { PermissionDeniedState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";

export const dynamic = "force-dynamic";
export default async function CircleOverviewPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId } = await params;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle)
    return (
      <AppShell
        currentPath=""
        pageTitle="Circle overview"
        context={{
          circleLabel: "Unavailable",
          careRecipientLabel: "Unavailable",
          destinations: [],
        }}
      >
        <PermissionDeniedState />
      </AppShell>
    );
  return (
    <AppShell
      currentPath={`/circles/${circle.id}`}
      pageTitle="Circle overview"
      context={{
        circleLabel: circle.displayName,
        careRecipientLabel: "Circle-wide",
        destinations: [{ href: `/circles/${circle.id}`, label: "Overview" }],
      }}
    >
      <section className="content-card" aria-labelledby="membership-heading">
        <h2 id="membership-heading">Your Circle membership</h2>
        <p>
          {circle.isCircleHead
            ? "You are an active Circle Head."
            : "You are an active Circle member."}
        </p>
        <p>
          Circle membership and Circle Head status grant no Care Recipient
          access.
        </p>
      </section>
      {circle.isCircleHead ? (
        <section className="content-card" aria-labelledby="invite-heading">
          <h2 id="invite-heading">Invitations</h2>
          <p>
            Invite an adult with a verified email. No access begins before
            acceptance.
          </p>
          <p>
            <a className="button primary" href={`/circles/${circle.id}/invite`}>
              Invite an adult member
            </a>
          </p>
          <p>
            <a
              className="button secondary"
              href={`/circles/${circle.id}/invitations`}
            >
              Review pending invitations
            </a>
          </p>
        </section>
      ) : null}
      <section className="content-card" aria-labelledby="slice-boundary">
        <h2 id="slice-boundary">Circle foundation</h2>
        <p>
          Care Recipients and later Circle features are not available in this
          implementation slice.
        </p>
      </section>
    </AppShell>
  );
}
