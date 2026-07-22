import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { SelectManagementModeForm } from "@/components/management-mode-selection";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import {
  canSelectManagementMode,
  getCareManagementMode,
  MANAGEMENT_MODE_COPY,
} from "@/lib/management-modes";

export const dynamic = "force-dynamic";

export default async function ManagementModePage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId } = await params;
  if (!(await canSelectManagementMode(circleId, careRecipientId)))
    return <UnavailableState />;
  const recipient = await getOwnedCareRecipient(
    account.userId,
    circleId,
    careRecipientId,
  );
  const current = await getCareManagementMode(circleId, careRecipientId);
  if (!recipient || current === undefined) return <UnavailableState />;
  const query = await searchParams;
  const currentCopy = current ? MANAGEMENT_MODE_COPY[current.modeCode] : null;

  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/management-mode`}
      pageTitle="Care Management Mode"
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipient.displayLabel,
        destinations: [
          {
            href: `/circles/${circleId}/care-recipients/${careRecipientId}`,
            label: "Care Recipient",
          },
        ],
      }}
    >
      {query.mode === "selected" && currentCopy ? (
        <p role="status">{currentCopy.label} selected.</p>
      ) : null}
      <section className="content-card" aria-labelledby="mode-intro">
        <h2 id="mode-intro">Select Care Management Mode</h2>
        <p>
          Only you, as the sole owner of {recipient.displayLabel}, may choose a
          mode. Ownership stays with you. Mode selection never creates legal
          authority and never grants another adult access by itself.
        </p>
        {currentCopy ? (
          <p>
            Current mode: {currentCopy.label}. You can compare modes and change
            with recent authentication.
          </p>
        ) : (
          <p>
            No mode is selected yet. Choose one to continue. Family roles may
            remain without becoming management grants.
          </p>
        )}
      </section>
      <SelectManagementModeForm
        key={`${circleId}:${careRecipientId}:${current?.modeId ?? "unset"}:${current?.version ?? 0}`}
        circleId={circleId}
        careRecipientId={careRecipientId}
        expectedVersion={current?.version ?? 0}
        currentModeCode={current?.modeCode ?? null}
      />
      {current ? (
        <p>
          <Link
            className="button secondary"
            href={`/circles/${circleId}/care-recipients/${careRecipientId}/management-mode/summary`}
          >
            View mode summary
          </Link>
        </p>
      ) : null}
    </AppShell>
  );
}
