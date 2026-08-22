import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAccessibleCareRecipient } from "@/lib/care-recipients/access";
import {
  canManageRecipientRoles,
  canReviewRecipientPermissions,
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
  if (!(await canReviewRecipientPermissions(circleId, careRecipientId)))
    return <UnavailableState />;
  const context = await getAccessibleCareRecipient(
    account.userId,
    circleId,
    careRecipientId,
  );
  const canManage = await canManageRecipientRoles(circleId, careRecipientId);
  const members = await listRecipientRoleMembers(circleId, careRecipientId);
  if (!context || !members) return <UnavailableState />;
  const query = await searchParams;
  const readOnly = context.accessKind === "delegated" && !canManage;
  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/roles`}
      pageTitle={
        readOnly ? "Care Recipient role assignments" : "Care Recipient roles"
      }
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: context.displayLabel,
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
        Every role below applies only to {context.displayLabel}. It creates no
        ownership, management, delegation, legal, or automatic medical
        authority.
      </p>
      {readOnly ? (
        <p className="status-copy" role="status">
          You may review these assignments only. Changes require Manage roles
          authority.
        </p>
      ) : null}
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
            {canManage ? (
              <Link
                className="button secondary"
                href={`/circles/${circleId}/care-recipients/${careRecipientId}/roles/${member.membershipId}`}
              >
                Manage roles for this member
              </Link>
            ) : null}
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
