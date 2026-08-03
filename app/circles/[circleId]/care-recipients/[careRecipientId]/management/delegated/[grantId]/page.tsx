import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  DelegationAcceptanceForm,
  DelegationActivationForm,
} from "@/components/delegation-lifecycle-forms";
import { RecentAuthenticationRequired } from "@/components/delegation-reauthentication";
import {
  DelegationSummary,
  durationSummary,
} from "@/components/delegation-summary";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import {
  activationReadiness,
  getDelegatedGrantDetail,
  hasRecentTrustedAuthentication,
  lifecycleActions,
} from "@/lib/delegated-grants";
import { scopeLabels } from "@/lib/management-grants";

export const dynamic = "force-dynamic";

const OUTCOMES: Record<string, string> = {
  accepted: "Delegation accepted.",
  activated: "Access activated.",
  suspended: "Access suspended.",
  restored: "Access restored.",
  revoked: "Access revoked.",
  reviewed: "Access kept. The next review is scheduled.",
};

const DURATION_OUTCOMES: Record<string, string> = {
  finite: "Expiration date saved. Access is not active yet.",
  until_revoked: "Until revoked recorded. Access is not active yet.",
};

export default async function DelegationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{
    circleId: string;
    careRecipientId: string;
    grantId: string;
  }>;
  searchParams: Promise<{ delegation?: string; duration?: string }>;
}) {
  await requireAuthenticatedAdult();
  const { circleId, careRecipientId, grantId } = await params;
  const query = await searchParams;
  const grant = await getDelegatedGrantDetail(
    circleId,
    careRecipientId,
    grantId,
  );
  if (!grant) return <UnavailableState />;
  const base = `/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated`;
  const actions = lifecycleActions(grant);
  const readiness = activationReadiness(grant);
  const recentAuth =
    grant.viewerRole === "owner" && grant.status === "pending"
      ? await hasRecentTrustedAuthentication()
      : false;
  const outcome =
    (query.delegation ? OUTCOMES[query.delegation] : undefined) ??
    (query.duration ? DURATION_OUTCOMES[query.duration] : undefined);

  return (
    <AppShell
      currentPath={`${base}/${grantId}`}
      pageTitle={`${grant.displayName}'s delegated access`}
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: grant.careRecipientLabel,
        destinations:
          grant.viewerRole === "owner"
            ? [
                { href: base, label: "Delegated Management" },
                {
                  href: `/circles/${circleId}/care-recipients/${careRecipientId}`,
                  label: "Care Recipient",
                },
              ]
            : [{ href: "/my-kinward", label: "My Kinward" }],
      }}
    >
      {outcome ? (
        <p role="status" aria-live="polite">
          {outcome}
        </p>
      ) : null}
      {grant.reviewDue ? (
        <section className="content-card" role="status" aria-live="polite">
          <h2>Access review due</h2>
          <p>
            Access remains active while you decide. A review becoming due does
            not change, renew, suspend, or revoke access on its own.
          </p>
        </section>
      ) : null}
      <DelegationSummary grant={grant} />
      {grant.viewerRole === "representative" ? (
        grant.status === "pending" && !grant.representativeAccepted ? (
          grant.termsFingerprint ? (
            <DelegationAcceptanceForm
              key={`${grantId}:${grant.termsFingerprint}:accept`}
              circleId={circleId}
              careRecipientId={careRecipientId}
              grantId={grantId}
              termsFingerprint={grant.termsFingerprint}
              scopeLabels={scopeLabels(grant.permissionCodes)}
              durationSummary={durationSummary(grant)}
            />
          ) : (
            <p>
              This delegation is not ready to accept yet. The owner is still
              choosing its duration.
            </p>
          )
        ) : (
          <p>
            No decision is needed from you right now. The owner may change,
            suspend, or revoke this delegation at any time.
          </p>
        )
      ) : null}
      {grant.viewerRole === "owner" ? (
        <section className="content-card" aria-labelledby="delegation-actions">
          <h2 id="delegation-actions">Access decisions</h2>
          {actions.canChooseDuration ? (
            <>
              <p>
                <Link
                  className="button secondary"
                  href={`${base}/${grantId}/duration`}
                >
                  {grant.durationMode ? "Change duration" : "Choose duration"}
                </Link>
              </p>
              {readiness.ready && grant.termsFingerprint ? (
                recentAuth ? (
                  <DelegationActivationForm
                    key={`${grantId}:${grant.termsFingerprint}:activate`}
                    circleId={circleId}
                    careRecipientId={careRecipientId}
                    grantId={grantId}
                    expectedVersion={grant.version}
                    termsFingerprint={grant.termsFingerprint}
                    representativeName={grant.displayName}
                    careRecipientLabel={grant.careRecipientLabel}
                    scopeLabels={scopeLabels(grant.permissionCodes)}
                    durationSummary={durationSummary(grant)}
                  />
                ) : (
                  <RecentAuthenticationRequired
                    returnPath={`${base}/${grantId}`}
                    action="activating this delegation"
                  />
                )
              ) : (
                <>
                  <h3>Before this delegation can be activated</h3>
                  <ul className="stack-list">
                    {readiness.blockers.map((blocker) => (
                      <li key={blocker}>{blocker}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          ) : null}
          {actions.canReview ? (
            <p>
              <Link
                className="button primary"
                href={`${base}/${grantId}/review`}
              >
                Review access
              </Link>
            </p>
          ) : null}
          {actions.canSuspend ? (
            <p>
              <Link
                className="button secondary"
                href={`${base}/${grantId}/suspend`}
              >
                Suspend access
              </Link>
            </p>
          ) : null}
          {actions.canRestore ? (
            <p>
              <Link
                className="button secondary"
                href={`${base}/${grantId}/restore`}
              >
                Restore access
              </Link>
            </p>
          ) : null}
          {actions.canRevoke ? (
            <p>
              <Link
                className="button destructive"
                href={`${base}/${grantId}/revoke`}
              >
                Revoke access
              </Link>
            </p>
          ) : null}
          {grant.status === "expired" || grant.status === "revoked" ? (
            <p>
              This delegation has ended and cannot become active again. Your own
              access as owner is unchanged.
            </p>
          ) : null}
        </section>
      ) : null}
      <p>
        <Link
          className="button secondary"
          href={grant.viewerRole === "owner" ? base : "/my-kinward"}
        >
          Back
        </Link>
      </p>
    </AppShell>
  );
}
