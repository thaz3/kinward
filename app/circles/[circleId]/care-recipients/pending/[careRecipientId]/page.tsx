import { AppShell } from "@/components/app-shell";
import { PendingOwnershipDetail } from "@/components/pending-ownership-detail";
import {
  PermissionDeniedState,
  UnavailableState,
} from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import { getPendingCareRecipient } from "@/lib/care-recipients/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pending Care Recipient" };

export default async function PendingCareRecipientPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
  searchParams: Promise<{
    created?: string;
    delivery?: string;
    resent?: string;
    resend?: string;
  }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId } = await params;
  const query = await searchParams;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle?.isCircleHead) {
    return (
      <AppShell
        currentPath=""
        pageTitle="Pending Care Recipient"
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

  const pending = await getPendingCareRecipient(
    account.userId,
    circle.id,
    careRecipientId,
  );
  if (!pending) {
    return (
      <AppShell
        currentPath={`/circles/${circle.id}`}
        pageTitle="Pending Care Recipient"
        context={{
          circleLabel: circle.displayName,
          careRecipientLabel: "Circle-wide",
          destinations: [{ href: `/circles/${circle.id}`, label: "Overview" }],
        }}
      >
        <UnavailableState />
        <p role="status">This ownership proposal is no longer pending.</p>
      </AppShell>
    );
  }

  const notice = query.created
    ? query.delivery === "pending"
      ? "Proposal created. Synthetic delivery capture was unavailable; the ownership invitation remains pending."
      : "Proposal created. Synthetic delivery was captured for the approved test destination."
    : query.resent
      ? query.delivery === "pending"
        ? "Ownership invitation resent. Synthetic delivery capture was unavailable; the previous link no longer works."
        : "Ownership invitation resent. The previous link no longer works."
      : query.resend === "failed"
        ? "We could not resend the ownership invitation. Try again."
        : undefined;

  return (
    <AppShell
      currentPath={`/circles/${circle.id}/care-recipients/pending/${pending.id}`}
      pageTitle="Pending Care Recipient"
      context={{
        circleLabel: circle.displayName,
        careRecipientLabel: "Circle-wide",
        destinations: [
          { href: `/circles/${circle.id}`, label: "Overview" },
          {
            href: `/circles/${circle.id}/care-recipients/propose`,
            label: "Propose Care Recipient",
          },
        ],
      }}
    >
      <PendingOwnershipDetail
        circleId={circle.id}
        careRecipientId={pending.id}
        invitationId={pending.invitationId}
        displayLabel={pending.displayLabel}
        invitedEmailMask={pending.invitedEmailMask}
        expiresAt={pending.expiresAt}
        notice={notice}
      />
    </AppShell>
  );
}
