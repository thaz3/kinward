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

export default async function RevokeDelegationPage({
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
  if (grant.status !== "active" && grant.status !== "suspended")
    return <UnavailableState />;
  const recentAuth = await hasRecentTrustedAuthentication();
  const base = `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`;

  return (
    <AppShell
      currentPath={`${base}/${grantId}/revoke`}
      pageTitle={`Revoke ${grant.displayName}'s access`}
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipientLabel,
        destinations: [
          { href: `${base}/${grantId}`, label: "Delegation detail" },
          { href: base, label: "Delegated Management" },
        ],
      }}
    >
      <DelegationSummary grant={grant} headingId="revoke-summary" />
      {recentAuth ? (
        <DelegationLifecycleForm
          key={`${grantId}:${grant.version}:revoke`}
          circleId={circleId}
          careRecipientId={careRecipientId}
          grantId={grantId}
          expectedVersion={grant.version}
          operation="revoke"
          representativeName={grant.displayName}
          consequences={[
            "This cannot be undone. A revoked delegation can never become active again.",
            "Every delegated permission stops immediately.",
            `This changes only this delegation for ${grant.careRecipientLabel}.`,
            "No replacement authority is created for anyone.",
            "The audit record of this delegation is preserved.",
          ]}
          cancelHref={`${base}/${grantId}`}
        />
      ) : (
        <RecentAuthenticationRequired
          returnPath={`${base}/${grantId}/revoke`}
          action="revoking delegated access"
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
