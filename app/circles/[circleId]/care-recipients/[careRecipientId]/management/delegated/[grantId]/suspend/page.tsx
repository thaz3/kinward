import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DelegationLifecycleForm } from "@/components/delegation-lifecycle-forms";
import { RecentAuthenticationRequired } from "@/components/delegation-reauthentication";
import { DelegationSummary } from "@/components/delegation-summary";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  hasRecentTrustedAuthentication,
  loadOwnerDelegationContext,
} from "@/lib/delegated-grants";

export const dynamic = "force-dynamic";

export default async function SuspendDelegationPage({
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
  if (grant.status !== "active") return <UnavailableState />;
  const recentAuth = await hasRecentTrustedAuthentication();
  const base = `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`;

  return (
    <AppShell
      currentPath={`${base}/${grantId}/suspend`}
      pageTitle={`Suspend ${grant.displayName}'s access`}
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipientLabel,
        destinations: [
          { href: `${base}/${grantId}`, label: "Delegation detail" },
          { href: base, label: "Delegated Management" },
        ],
      }}
    >
      <DelegationSummary grant={grant} headingId="suspend-summary" />
      {recentAuth ? (
        <DelegationLifecycleForm
          key={`${grantId}:${grant.version}:suspend`}
          circleId={circleId}
          careRecipientId={careRecipientId}
          grantId={grantId}
          expectedVersion={grant.version}
          operation="suspend"
          representativeName={grant.displayName}
          consequences={[
            "Every delegated permission stops immediately.",
            "The delegation history and audit record are preserved.",
            "Nothing new is granted, and ownership does not change.",
            "You can restore access later while the delegation has not expired or been revoked.",
            `Your own access to ${grant.careRecipientLabel} is unchanged.`,
          ]}
          cancelHref={`${base}/${grantId}`}
        />
      ) : (
        <RecentAuthenticationRequired
          returnPath={`${base}/${grantId}/suspend`}
          action="suspending delegated access"
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
