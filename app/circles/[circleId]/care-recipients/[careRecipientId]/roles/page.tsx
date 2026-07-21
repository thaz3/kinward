import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getOwnedCareRecipient } from "@/lib/care-recipients/access";
import {
  canManageRecipientRoles,
  listRecipientRoleMembers,
  RECIPIENT_ROLE_COPY,
} from "@/lib/recipient-roles";

export const dynamic = "force-dynamic";
export default async function RecipientRolesPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string; careRecipientId: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId } = await params;
  if (!(await canManageRecipientRoles(circleId, careRecipientId)))
    return <UnavailableState />;
  const recipient = await getOwnedCareRecipient(
    account.userId,
    circleId,
    careRecipientId,
  );
  const members = await listRecipientRoleMembers(circleId, careRecipientId);
  if (!recipient || !members) return <UnavailableState />;
  const query = await searchParams;
  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/roles`}
      pageTitle="Care Recipient roles"
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
      {query.role ? <p role="status">Role {query.role}.</p> : null}
      <p>
        Every role below applies only to {recipient.displayLabel}. It creates no
        ownership, management, delegation, legal, or automatic medical
        authority.
      </p>
      <ul className="stack-list">
        {members.map((member) => (
          <li className="content-card" key={member.membershipId}>
            <h2>{member.displayName}</h2>
            {member.assignments.length ? (
              <ul>
                {member.assignments.map((assignment) => (
                  <li key={assignment.id}>
                    {RECIPIENT_ROLE_COPY[assignment.roleCode].label} —{" "}
                    {assignment.status}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No roles for this Care Recipient.</p>
            )}
            <Link
              className="button secondary"
              href={`/circles/${circleId}/care-recipients/${careRecipientId}/roles/${member.membershipId}`}
            >
              Manage roles for this member
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
