import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PermissionDeniedState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import { canViewCircleRoles } from "@/lib/circle-roles";
import {
  listOwnedCareRecipients,
  listPendingCareRecipients,
} from "@/lib/care-recipients/access";

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

  const owned =
    (await listOwnedCareRecipients(account.userId, circle.id)) ?? [];
  const pending = circle.isCircleHead
    ? ((await listPendingCareRecipients(account.userId, circle.id)) ?? [])
    : [];
  const mayViewCircleRoles = await canViewCircleRoles(circle.id);

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
      {mayViewCircleRoles ? (
        <section className="content-card" aria-labelledby="roles-heading">
          <h2 id="roles-heading">Members and Circle-wide roles</h2>
          <p>
            Review active members and approved Circle-wide role assignments.
          </p>
          <Link
            className="button secondary"
            href={`/circles/${circle.id}/members`}
          >
            Review members and roles
          </Link>
        </section>
      ) : null}
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
      <section
        className="content-card"
        aria-labelledby="care-recipients-heading"
      >
        <h2 id="care-recipients-heading">Care Recipients</h2>
        <p>
          Each Care Recipient has one adult owner. Being Circle Head alone
          grants no access to any Care Recipient.
        </p>
        {owned.length > 0 ? (
          <ul className="circle-list" aria-label="Care Recipients you own">
            {owned.map((recipient) => (
              <li key={recipient.id}>
                <Link
                  className="button secondary"
                  href={`/circles/${circle.id}/care-recipients/${recipient.id}`}
                >
                  {recipient.displayLabel}
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>You do not own any Care Recipient in this Circle.</p>
        )}
        <p>
          <Link
            className="button secondary"
            href={`/circles/${circle.id}/switch-recipient`}
          >
            Switch Care Recipient
          </Link>
        </p>
        {circle.isCircleHead ? (
          <>
            <p>
              <Link
                className="button primary"
                href={`/circles/${circle.id}/care-recipients/propose`}
              >
                Add Care Recipient
              </Link>
            </p>
            {pending.length > 0 ? (
              <>
                <h3>Pending owner acceptance</h3>
                <ul
                  className="circle-list"
                  aria-label="Care Recipients awaiting owner acceptance"
                >
                  {pending.map((recipient) => (
                    <li key={recipient.id}>
                      <Link
                        className="button secondary"
                        href={`/circles/${circle.id}/care-recipients/pending/${recipient.id}`}
                      >
                        {recipient.displayLabel}
                        <span className="visually-hidden"> — pending</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </>
        ) : null}
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
    </AppShell>
  );
}
