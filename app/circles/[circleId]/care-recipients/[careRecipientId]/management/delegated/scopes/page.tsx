import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { PendingDelegatedScopeForm } from "@/components/management-grant-forms";
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

export default async function DelegatedScopePage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
  searchParams: Promise<{ membershipId?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId } = await params;
  const query = await searchParams;
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
  const member = members.find(
    (item) => item.membershipId === query.membershipId,
  );
  if (!query.membershipId || !member) return <UnavailableState />;

  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated/scopes`}
      pageTitle="Delegation scope"
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipient.displayLabel,
        destinations: [
          {
            href: `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`,
            label: "Choose representative",
          },
        ],
      }}
    >
      <PendingDelegatedScopeForm
        key={`${circleId}:${careRecipientId}:${member.membershipId}:scopes`}
        circleId={circleId}
        careRecipientId={careRecipientId}
        membershipId={member.membershipId}
        representativeName={member.displayName}
      />
      <p>
        <Link
          className="button secondary"
          href={`/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`}
        >
          Back
        </Link>
      </p>
    </AppShell>
  );
}
