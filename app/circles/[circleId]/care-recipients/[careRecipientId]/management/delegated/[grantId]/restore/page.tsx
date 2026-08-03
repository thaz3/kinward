import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DelegationLifecycleForm } from "@/components/delegation-lifecycle-forms";
import { RecentAuthenticationRequired } from "@/components/delegation-reauthentication";
import { DelegationSummary } from "@/components/delegation-summary";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  hasRecentTrustedAuthentication,
  lifecycleActions,
  loadOwnerDelegationContext,
} from "@/lib/delegated-grants";

export const dynamic = "force-dynamic";

export default async function RestoreDelegationPage({
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
  if (!lifecycleActions(grant).canRestore) return <UnavailableState />;
  const recentAuth = await hasRecentTrustedAuthentication();
  const base = `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`;

  return (
    <AppShell
      currentPath={`${base}/${grantId}/restore`}
      pageTitle={`Restore ${grant.displayName}'s access`}
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipientLabel,
        destinations: [
          { href: `${base}/${grantId}`, label: "Delegation detail" },
          { href: base, label: "Delegated Management" },
        ],
      }}
    >
      <DelegationSummary grant={grant} headingId="restore-summary" />
      {recentAuth ? (
        <DelegationLifecycleForm
          key={`${grantId}:${grant.version}:restore`}
          circleId={circleId}
          careRecipientId={careRecipientId}
          grantId={grantId}
          expectedVersion={grant.version}
          operation="restore"
          representativeName={grant.displayName}
          consequences={[
            "The same scopes recorded on this delegation become active again.",
            "No new scope, ownership, or legal authority is created.",
            "A delegation that has expired or been revoked can never be restored.",
            "The existing expiration date and review schedule still apply.",
          ]}
          cancelHref={`${base}/${grantId}`}
        />
      ) : (
        <RecentAuthenticationRequired
          returnPath={`${base}/${grantId}/restore`}
          action="restoring delegated access"
        />
      )}
      <p>
        <Link className="button secondary" href={`${base}/${grantId}`}>
          Back
        </Link>
      </p>
    </AppShell>
  );
}
