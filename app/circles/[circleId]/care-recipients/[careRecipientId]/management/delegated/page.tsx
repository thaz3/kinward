import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DelegatedRepresentativeForm } from "@/components/management-grant-forms";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import {
  DELEGATION_STATUS_COPY,
  listDelegatedManagementGrants,
} from "@/lib/delegated-grants";
import {
  canManageManagementGrants,
  listManagementGrantMembers,
  MANAGEMENT_SCOPE_COPY,
} from "@/lib/management-grants";
import {
  canSelectManagementMode,
  getCareManagementMode,
} from "@/lib/management-modes";

export const dynamic = "force-dynamic";

export default async function DelegatedManagementSetupPage({
  params,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId } = await params;
  if (!(await canManageManagementGrants(circleId, careRecipientId)))
    return <UnavailableState />;
  if (!(await canSelectManagementMode(circleId, careRecipientId)))
    return <UnavailableState />;
  const recipient = await getOwnedCareRecipient(
    account.userId,
    circleId,
    careRecipientId,
  );
  const mode = await getCareManagementMode(circleId, careRecipientId);
  const members = await listManagementGrantMembers(circleId, careRecipientId);
  const grants = await listDelegatedManagementGrants(circleId, careRecipientId);
  if (!recipient || mode === undefined || !members || !grants)
    return <UnavailableState />;
  if (mode?.modeCode !== "delegated_management") return <UnavailableState />;

  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`}
      pageTitle="Delegated Management"
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipient.displayLabel,
        destinations: [
          {
            href: `/circles/${circleId}/care-recipients/${careRecipientId}/management-mode`,
            label: "Management mode",
          },
          {
            href: `/circles/${circleId}/care-recipients/${careRecipientId}`,
            label: "Care Recipient",
          },
        ],
      }}
    >
      <section className="content-card" aria-labelledby="delegated-intro">
        <h2 id="delegated-intro">Delegated Management setup</h2>
        <ol>
          <li>Choose representative</li>
          <li>Choose exact scope</li>
          <li>Choose duration</li>
          <li>Representative accepts</li>
          <li>Give final activation consent</li>
        </ol>
        <p>
          Owner remains {recipient.displayLabel}. This is a Kinward grant, not
          legal authority. No access exists until activation succeeds.
        </p>
      </section>
      {grants.length ? (
        <section className="content-card" aria-labelledby="delegated-existing">
          <h2 id="delegated-existing">
            Delegations for {recipient.displayLabel}
          </h2>
          <ul className="stack-list">
            {grants.map((grant) => (
              <li key={grant.grantId}>
                <h3>{grant.displayName}</h3>
                <p>
                  <span aria-hidden="true">
                    {DELEGATION_STATUS_COPY[grant.status].marker}{" "}
                  </span>
                  <strong>
                    Status — {DELEGATION_STATUS_COPY[grant.status].label}.
                  </strong>{" "}
                  {DELEGATION_STATUS_COPY[grant.status].meaning}
                </p>
                <p>
                  {grant.permissionCodes
                    .map((code) => MANAGEMENT_SCOPE_COPY[code].label)
                    .join(", ")}
                </p>
                {grant.reviewDue ? (
                  <p>Access review due. Access has not changed.</p>
                ) : null}
                <Link
                  className="button secondary"
                  href={`/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated/${grant.grantId}`}
                >
                  Open {grant.displayName}&apos;s delegation
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p>No delegation exists for {recipient.displayLabel} yet.</p>
      )}
      {members.length ? (
        <DelegatedRepresentativeForm
          key={`${circleId}:${careRecipientId}:delegated`}
          circleId={circleId}
          careRecipientId={careRecipientId}
          members={members}
        />
      ) : (
        <p>No eligible representative is available.</p>
      )}
      <p>
        <Link
          className="button secondary"
          href={`/circles/${circleId}/care-recipients/${careRecipientId}/management-mode`}
        >
          Cancel
        </Link>
      </p>
    </AppShell>
  );
}
