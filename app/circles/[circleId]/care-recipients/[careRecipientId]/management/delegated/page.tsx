import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DelegatedRepresentativeForm } from "@/components/management-grant-forms";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import {
  canManageManagementGrants,
  listManagementGrantMembers,
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
  if (!recipient || mode === undefined || !members) return <UnavailableState />;
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
          <li>Choose duration later</li>
        </ol>
        <p>
          Owner remains {recipient.displayLabel}. This is a Kinward grant, not
          legal authority. No access exists until a later activation step.
        </p>
      </section>
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
