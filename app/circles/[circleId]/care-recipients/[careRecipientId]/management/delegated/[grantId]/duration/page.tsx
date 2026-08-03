import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DelegationDurationForm } from "@/components/delegation-lifecycle-forms";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  formatLocalDate,
  getSuggestedExpirationDate,
  loadOwnerDelegationContext,
  localDateInZone,
} from "@/lib/delegated-grants";
import { scopeLabels } from "@/lib/management-grants";

export const dynamic = "force-dynamic";

export default async function DelegationDurationPage({
  params,
  searchParams,
}: {
  params: Promise<{
    circleId: string;
    careRecipientId: string;
    grantId: string;
  }>;
  searchParams: Promise<{ pending?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId, grantId } = await params;
  const query = await searchParams;
  const context = await loadOwnerDelegationContext(
    account.userId,
    circleId,
    careRecipientId,
    grantId,
  );
  if (!context) return <UnavailableState />;
  const { grant, recipientLabel } = context;
  if (grant.status !== "pending") return <UnavailableState />;
  const suggested = await getSuggestedExpirationDate(circleId);
  if (!suggested) return <UnavailableState />;
  const zone = grant.circleTimeZone ?? "UTC";
  const base = `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`;

  return (
    <AppShell
      currentPath={`${base}/${grantId}/duration`}
      pageTitle="Delegation duration"
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipientLabel,
        destinations: [
          { href: `${base}/${grantId}`, label: "Delegation detail" },
          { href: base, label: "Delegated Management" },
        ],
      }}
    >
      {query.pending === "1" ? (
        <p role="status">
          Pending grant saved with exact scopes. It grants no authority yet.
        </p>
      ) : null}
      <section className="content-card" aria-labelledby="duration-intro">
        <h2 id="duration-intro">Choose how long this delegation lasts</h2>
        <p>
          Representative — {grant.displayName}. Care Recipient —{" "}
          {grant.careRecipientLabel}. Included scopes —{" "}
          {scopeLabels(grant.permissionCodes).join(", ")}.
        </p>
        <p>
          Saving a duration does not activate access. {grant.displayName} must
          still accept the delegation, and you must still give the final
          activation consent.
        </p>
      </section>
      <DelegationDurationForm
        key={`${circleId}:${careRecipientId}:${grantId}:duration`}
        circleId={circleId}
        careRecipientId={careRecipientId}
        grantId={grantId}
        expectedVersion={grant.version}
        representativeName={grant.displayName}
        suggestedDate={suggested}
        suggestedDateLabel={formatLocalDate(suggested) ?? suggested}
        earliestDate={localDateInZone(zone, 1)}
        governingTimeZoneLabel={zone}
        untilRevokedHref={`${base}/${grantId}/until-revoked`}
      />
      <p className="action-row">
        <Link
          className="button secondary"
          href={`${base}/scopes?membershipId=${grant.membershipId}`}
        >
          Back
        </Link>
        <Link className="button secondary" href={`${base}/${grantId}`}>
          Cancel
        </Link>
      </p>
    </AppShell>
  );
}
