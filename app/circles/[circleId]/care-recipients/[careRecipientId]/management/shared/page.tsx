import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SharedManagementGrantForm } from "@/components/management-grant-forms";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import {
  canManageManagementGrants,
  listManagementGrantMembers,
  listSharedManagementGrants,
  MANAGEMENT_SCOPE_COPY,
} from "@/lib/management-grants";
import {
  canSelectManagementMode,
  getCareManagementMode,
} from "@/lib/management-modes";

export const dynamic = "force-dynamic";

export default async function SharedManagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
  searchParams: Promise<{ grant?: string }>;
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
  const grants = await listSharedManagementGrants(circleId, careRecipientId);
  if (!recipient || mode === undefined || !members || !grants)
    return <UnavailableState />;
  if (mode?.modeCode !== "shared_management") return <UnavailableState />;
  const query = await searchParams;

  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/management/shared`}
      pageTitle="Shared Management"
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
      {query.grant === "created" ? (
        <p role="status">Shared access recorded.</p>
      ) : null}
      <section className="content-card" aria-labelledby="shared-intro">
        <h2 id="shared-intro">Shared Management setup</h2>
        <p>
          You remain the sole owner of {recipient.displayLabel}. Shared managers
          receive only explicit scopes and cannot change ownership.
        </p>
      </section>
      {grants.length ? (
        <section className="content-card" aria-labelledby="shared-existing">
          <h2 id="shared-existing">Current shared managers</h2>
          <ul className="stack-list">
            {grants.map((grant) => (
              <li key={grant.grantId}>
                <h3>{grant.displayName}</h3>
                <p>
                  {grant.permissionCodes
                    .map((code) => MANAGEMENT_SCOPE_COPY[code].label)
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <p>No shared managers yet.</p>
      )}
      {members.length ? (
        <SharedManagementGrantForm
          key={`${circleId}:${careRecipientId}:shared:${grants.length}`}
          circleId={circleId}
          careRecipientId={careRecipientId}
          members={members}
        />
      ) : (
        <p>No eligible adult is available for shared management.</p>
      )}
      <p>
        <Link
          className="button secondary"
          href={`/circles/${circleId}/care-recipients/${careRecipientId}/management-mode`}
        >
          Back to management mode
        </Link>
      </p>
    </AppShell>
  );
}
