import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import {
  canSelectManagementMode,
  getCareManagementMode,
  MANAGEMENT_MODE_COPY,
} from "@/lib/management-modes";

export const dynamic = "force-dynamic";

export default async function ManagementModeSummaryPage({
  params,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
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
  if (!recipient || !current) return <UnavailableState />;
  const copy = MANAGEMENT_MODE_COPY[current.modeCode];

  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/management-mode/summary`}
      pageTitle={copy.label}
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: recipient.displayLabel,
        destinations: [
          {
            href: `/circles/${circleId}/care-recipients/${careRecipientId}/management-mode`,
            label: "Compare modes",
          },
          {
            href: `/circles/${circleId}/care-recipients/${careRecipientId}`,
            label: "Care Recipient",
          },
        ],
      }}
    >
      <section className="content-card" aria-labelledby="mode-summary-heading">
        <h2 id="mode-summary-heading">{copy.label}</h2>
        <p>Care Recipient — {recipient.displayLabel}</p>
        <ul>
          <li>{copy.summary}</li>
          <li>{copy.consequence}</li>
          <li>{copy.boundary}</li>
        </ul>
        {current.modeCode === "self_managed" ? (
          <p>
            Family Coordinator, Care Lead, Medical Lead, or Chemo Care Lead
            roles may remain, but they grant no management access through this
            mode.
          </p>
        ) : null}
        {current.modeCode === "shared_management" ? (
          <p>No one shares management of this record yet.</p>
        ) : null}
        {current.modeCode === "delegated_management" ? (
          <p>No Designated Care Representative is active.</p>
        ) : null}
      </section>
      <p>
        <Link
          className="button secondary"
          href={`/circles/${circleId}/care-recipients/${careRecipientId}/management-mode`}
        >
          Compare modes
        </Link>
      </p>
    </AppShell>
  );
}
