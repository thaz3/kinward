import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { DelegationAccessReviewForm } from "@/components/delegation-lifecycle-forms";
import { DelegationSummary } from "@/components/delegation-summary";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  formatInGoverningZone,
  loadOwnerDelegationContext,
} from "@/lib/delegated-grants";

export const dynamic = "force-dynamic";

export default async function DelegationAccessReviewPage({
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
  const base = `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`;
  const due = formatInGoverningZone(
    grant.nextReviewAt,
    grant.governingTimeZone,
  );

  return (
    <AppShell
      currentPath={`${base}/${grantId}/review`}
      pageTitle={`Review ${grant.displayName}'s access`}
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipientLabel,
        destinations: [
          { href: `${base}/${grantId}`, label: "Delegation detail" },
          { href: base, label: "Delegated Management" },
        ],
      }}
    >
      <section className="content-card" role="status" aria-live="polite">
        <h2>{grant.reviewDue ? "Access review due" : "Access review"}</h2>
        <p>
          {due
            ? `${grant.reviewDue ? "Review due" : "Next review"} — ${due}.`
            : "No review is scheduled."}
        </p>
        <p>
          Access remains active while you decide. Viewing this page changes
          nothing, and Kinward sends no message outside the app.
        </p>
      </section>
      <DelegationSummary grant={grant} headingId="review-summary" />
      <DelegationAccessReviewForm
        key={`${grantId}:${grant.version}:review`}
        circleId={circleId}
        careRecipientId={careRecipientId}
        grantId={grantId}
        expectedVersion={grant.version}
        representativeName={grant.displayName}
      />
      <section className="content-card" aria-labelledby="other-decisions">
        <h2 id="other-decisions">Other access decisions</h2>
        <p>
          <Link className="button secondary" href={`${base}/${grantId}`}>
            Modify access
          </Link>
        </p>
        <p>
          <Link
            className="button secondary"
            href={`${base}/${grantId}/suspend`}
          >
            Suspend access
          </Link>
        </p>
        <p>
          <Link
            className="button destructive"
            href={`${base}/${grantId}/revoke`}
          >
            Revoke access
          </Link>
        </p>
      </section>
      <p>
        <Link className="button secondary" href={`${base}/${grantId}`}>
          Back
        </Link>
      </p>
    </AppShell>
  );
}
