import { randomUUID } from "node:crypto";
import { AppShell } from "@/components/app-shell";
import { ProposeCareRecipientForm } from "@/components/propose-care-recipient-form";
import { PermissionDeniedState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";

export const dynamic = "force-dynamic";
export const metadata = { title: "Propose Care Recipient" };

export default async function ProposeCareRecipientPage({
  params,
}: {
  params: Promise<{ circleId: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId } = await params;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle?.isCircleHead) {
    return (
      <AppShell
        currentPath=""
        pageTitle="Propose Care Recipient"
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

  return (
    <AppShell
      currentPath={`/circles/${circle.id}/care-recipients/propose`}
      pageTitle="Propose Care Recipient"
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
      <ProposeCareRecipientForm
        circleId={circle.id}
        circleName={circle.displayName}
        idempotencyKey={randomUUID()}
        proposerEmail={account.email}
      />
    </AppShell>
  );
}
