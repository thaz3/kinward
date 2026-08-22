import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  AssignRecipientRoleForm,
  RecipientRoleLifecycleForm,
} from "@/components/recipient-role-management";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAccessibleCareRecipient } from "@/lib/care-recipients/access";
import {
  canManageRecipientRoles,
  listRecipientRoleMembers,
  RECIPIENT_ROLE_COPY,
} from "@/lib/recipient-roles";

export const dynamic = "force-dynamic";
export default async function RecipientMemberRolesPage({
  params,
}: {
  params: Promise<{
    circleId: string;
    careRecipientId: string;
    membershipId: string;
  }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, careRecipientId, membershipId } = await params;
  if (!(await canManageRecipientRoles(circleId, careRecipientId)))
    return <UnavailableState />;
  const context = await getAccessibleCareRecipient(
    account.userId,
    circleId,
    careRecipientId,
  );
  if (
    !context ||
    (context.accessKind === "delegated" &&
      !context.permissionCodes.includes("recipient.manage_roles"))
  ) {
    return <UnavailableState />;
  }
  const members = await listRecipientRoleMembers(circleId, careRecipientId);
  const member = members?.find((item) => item.membershipId === membershipId);
  if (!member) return <UnavailableState />;
  return (
    <AppShell
      currentPath={`/circles/${circleId}/care-recipients/${careRecipientId}/roles`}
      pageTitle="Manage Care Recipient roles"
      context={{
        circleLabel: "Current Circle",
        careRecipientLabel: context.displayLabel,
        destinations: [
          {
            href: `/circles/${circleId}/care-recipients/${careRecipientId}/roles`,
            label: "Recipient roles",
          },
        ],
      }}
    >
      <p>
        Selected member: {member.displayName}. Exact Care Recipient:{" "}
        {context.displayLabel}.
      </p>
      {member.assignments.map((assignment) => (
        <section className="content-card" key={assignment.id}>
          <h2>{RECIPIENT_ROLE_COPY[assignment.roleCode].label}</h2>
          <p>Status: {assignment.status}</p>
          <p>{RECIPIENT_ROLE_COPY[assignment.roleCode].boundary}</p>
          {assignment.status === "active" ? (
            <div className="action-row">
              <RecipientRoleLifecycleForm
                key={`${circleId}:${careRecipientId}:${membershipId}:${assignment.id}:suspend`}
                circleId={circleId}
                careRecipientId={careRecipientId}
                membershipId={membershipId}
                assignmentId={assignment.id}
                expectedVersion={assignment.version}
                roleLabel={RECIPIENT_ROLE_COPY[assignment.roleCode].label}
                operation="suspend"
              />
              <RecipientRoleLifecycleForm
                key={`${circleId}:${careRecipientId}:${membershipId}:${assignment.id}:remove`}
                circleId={circleId}
                careRecipientId={careRecipientId}
                membershipId={membershipId}
                assignmentId={assignment.id}
                expectedVersion={assignment.version}
                roleLabel={RECIPIENT_ROLE_COPY[assignment.roleCode].label}
                operation="remove"
              />
            </div>
          ) : null}
        </section>
      ))}
      {!member.isCurrentActor ? (
        <AssignRecipientRoleForm
          key={`${circleId}:${careRecipientId}:${membershipId}`}
          circleId={circleId}
          careRecipientId={careRecipientId}
          membershipId={membershipId}
        />
      ) : (
        <p className="neutral-alert">Self-assignment is unavailable.</p>
      )}
      <Link
        className="button secondary"
        href={`/circles/${circleId}/care-recipients/${careRecipientId}/roles`}
      >
        Return to recipient roles
      </Link>
    </AppShell>
  );
}
