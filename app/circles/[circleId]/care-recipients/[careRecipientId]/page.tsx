import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ProtectedRecipientContent } from "@/components/recipient-context-transition";
import { PermissionDeniedState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import { getAccessibleCareRecipient } from "@/lib/care-recipients/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Care Recipient" };

export default async function CareRecipientPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
  searchParams: Promise<{ ownership?: string; activated?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId } = await params;
  const query = await searchParams;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  const context = circle
    ? await getAccessibleCareRecipient(
        account.userId,
        circle.id,
        careRecipientId,
      )
    : null;

  if (!circle || !context) {
    return (
      <AppShell
        currentPath=""
        pageTitle="Care Recipient"
        context={{
          circleLabel: "Unavailable",
          careRecipientLabel: "Unavailable",
          destinations: [],
        }}
      >
        <PermissionDeniedState />
      </AppShell>
    );
  }

  const justAccepted =
    context.accessKind === "owner" &&
    (query.ownership === "accepted" || query.activated === "1");
  const canManageRoles = context.permissionCodes.includes(
    "recipient.manage_roles",
  );
  const canReviewPermissions = context.permissionCodes.includes(
    "recipient.review_permissions",
  );

  return (
    <AppShell
      currentPath={`/circles/${circle.id}/care-recipients/${context.id}`}
      pageTitle={context.displayLabel}
      context={{
        circleLabel: circle.displayName,
        careRecipientLabel: context.displayLabel,
        destinations: [
          { href: `/circles/${circle.id}`, label: "Overview" },
          {
            href: `/circles/${circle.id}/switch-recipient`,
            label: "Switch Care Recipient",
          },
        ],
      }}
    >
      <ProtectedRecipientContent>
        {justAccepted ? (
          <section
            className="content-card"
            role="status"
            aria-live="polite"
            aria-labelledby="ownership-success"
          >
            <h2 id="ownership-success">You are the sole owner</h2>
            <p>
              Sole ownership of {context.displayLabel} is active. You control
              who receives access under Kinward’s approved permission model.
            </p>
          </section>
        ) : null}
        <section
          className="content-card"
          aria-labelledby="care-recipient-heading"
        >
          <h2 id="care-recipient-heading">{context.displayLabel}</h2>
          {context.accessKind === "owner" ? (
            <>
              <p>
                You are the sole owner of this Care Recipient profile. No one
                else has access, and family relationship or Circle-wide roles
                grant none.
              </p>
              <p>
                This is a structural placeholder. Care Recipient information is
                not available in this implementation slice.
              </p>
            </>
          ) : (
            <>
              <p>
                You are viewing {context.displayLabel} under an active delegated
                grant. Your access is limited to the exact scopes recorded for
                this grant.
              </p>
              <p>
                This is a structural placeholder. Care Recipient information is
                not available in this implementation slice.
              </p>
            </>
          )}
        </section>
        <section className="content-card" aria-labelledby="care-recipient-nav">
          <h2 id="care-recipient-nav">Navigate</h2>
          {context.accessKind === "owner" ? (
            <>
              <p>
                <Link
                  className="button secondary"
                  href={`/circles/${circle.id}/care-recipients/${context.id}/roles`}
                >
                  Manage Care Recipient roles
                </Link>
              </p>
              <p>
                <Link
                  className="button secondary"
                  href={`/circles/${circle.id}/care-recipients/${context.id}/management-mode`}
                >
                  Select Care Management Mode
                </Link>
              </p>
            </>
          ) : (
            <>
              {canManageRoles ? (
                <p>
                  <Link
                    className="button secondary"
                    href={`/circles/${circle.id}/care-recipients/${context.id}/roles`}
                  >
                    Manage Care Recipient roles
                  </Link>
                </p>
              ) : null}
              {canReviewPermissions && !canManageRoles ? (
                <p>
                  <Link
                    className="button secondary"
                    href={`/circles/${circle.id}/care-recipients/${context.id}/roles`}
                  >
                    View Care Recipient role assignments
                  </Link>
                </p>
              ) : null}
            </>
          )}
          <p>
            <Link
              className="button secondary"
              href={`/circles/${circle.id}/switch-recipient`}
            >
              Switch Care Recipient context
            </Link>
          </p>
          <p>
            <Link className="button secondary" href={`/circles/${circle.id}`}>
              Back to Circle
            </Link>
          </p>
        </section>
      </ProtectedRecipientContent>
    </AppShell>
  );
}
