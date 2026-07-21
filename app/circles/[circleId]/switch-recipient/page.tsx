import { AppShell } from "@/components/app-shell";
import { RecipientSwitcher } from "@/components/recipient-switcher";
import {
  PermissionDeniedState,
  UnavailableState,
} from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import { listOwnedCareRecipients } from "@/lib/care-recipients/access";

export const dynamic = "force-dynamic";
export const metadata = { title: "Switch Care Recipient" };

export default async function SwitchRecipientPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId } = await params;
  const query = await searchParams;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle) {
    return (
      <AppShell
        currentPath=""
        pageTitle="Switch Care Recipient"
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

  const owned = await listOwnedCareRecipients(account.userId, circle.id);

  return (
    <AppShell
      currentPath={`/circles/${circle.id}/switch-recipient`}
      pageTitle="Switch Care Recipient"
      context={{
        circleLabel: circle.displayName,
        careRecipientLabel: "Circle-wide",
        destinations: [
          { href: `/circles/${circle.id}`, label: "Overview" },
          {
            href: `/circles/${circle.id}/switch-recipient`,
            label: "Switch Care Recipient",
          },
        ],
      }}
    >
      {owned === null ? (
        <UnavailableState />
      ) : (
        <>
          {query.notice === "unavailable" ? (
            <p className="status-copy" role="status" aria-live="polite">
              That Care Recipient context is unavailable. Nothing changed.
            </p>
          ) : null}
          <RecipientSwitcher
            circleId={circle.id}
            circleName={circle.displayName}
            recipients={owned}
          />
        </>
      )}
    </AppShell>
  );
}
