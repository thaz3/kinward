import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DelegationUntilRevokedForm } from "@/components/delegation-lifecycle-forms";
import { RecentAuthenticationRequired } from "@/components/delegation-reauthentication";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  hasRecentTrustedAuthentication,
  loadOwnerDelegationContext,
} from "@/lib/delegated-grants";
import { scopeLabels } from "@/lib/management-grants";

export const dynamic = "force-dynamic";

export default async function DelegationUntilRevokedPage({
  params,
}: {
  params: Promise<{
    circleId: string;
    careRecipientId: string;
    grantId: string;
  }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId, grantId } = await params;
  const context = await loadOwnerDelegationContext(
    account.userId,
    circleId,
    careRecipientId,
    grantId,
  );
  if (!context) return <UnavailableState />;
  const { grant, recipientLabel } = context;
  if (grant.status !== "pending") return <UnavailableState />;
  const recentAuth = await hasRecentTrustedAuthentication();
  const base = `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`;

  return (
    <AppShell
      currentPath={`${base}/${grantId}/until-revoked`}
      pageTitle="Until revoked"
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipientLabel,
        destinations: [
          { href: `${base}/${grantId}/duration`, label: "Delegation duration" },
          { href: `${base}/${grantId}`, label: "Delegation detail" },
        ],
      }}
    >
      {recentAuth ? (
        <DelegationUntilRevokedForm
          key={`${circleId}:${careRecipientId}:${grantId}:until-revoked`}
          circleId={circleId}
          careRecipientId={careRecipientId}
          grantId={grantId}
          expectedVersion={grant.version}
          representativeName={grant.displayName}
          scopeLabels={scopeLabels(grant.permissionCodes)}
          governingTimeZoneLabel={grant.circleTimeZone ?? "UTC"}
        />
      ) : (
        <RecentAuthenticationRequired
          returnPath={`${base}/${grantId}/until-revoked`}
          action="confirming access until revoked"
        />
      )}
      <p className="action-row">
        <Link className="button secondary" href={`${base}/${grantId}/duration`}>
          Choose a date
        </Link>
        <Link className="button secondary" href={`${base}/${grantId}`}>
          Cancel
        </Link>
      </p>
    </AppShell>
  );
}
