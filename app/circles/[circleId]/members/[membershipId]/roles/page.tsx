import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import {
  AssignFamilyCoordinatorForm,
  ProtectedFinalHeadState,
  RoleLifecycleForm,
} from "@/components/circle-role-management";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import {
  canViewCircleRoles,
  listCircleRoleMembers,
  roleLabel,
} from "@/lib/circle-roles";

export const dynamic = "force-dynamic";

export default async function MemberRolesPage({
  params,
}: {
  params: Promise<{ circleId: string; membershipId: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId, membershipId } = await params;
  if (!(await canViewCircleRoles(circleId))) return <UnavailableState />;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle?.isCircleHead) return <UnavailableState />;
  const members = await listCircleRoleMembers(circle.id);
  const member = members?.find((item) => item.membershipId === membershipId);
  if (!member) return <UnavailableState />;
  const activeHeadCount =
    members?.reduce(
      (count, item) =>
        count +
        item.assignments.filter(
          (assignment) =>
            assignment.roleCode === "circle_head" &&
            assignment.status === "active",
        ).length,
      0,
    ) ?? 0;
  const hasCoordinatorAssignment = member.assignments.some(
    (assignment) => assignment.roleCode === "family_coordinator",
  );
  return (
    <AppShell
      currentPath={`/circles/${circle.id}/members`}
      pageTitle="Manage Circle-wide roles"
      context={{
        circleLabel: circle.displayName,
        careRecipientLabel: "Circle-wide",
        destinations: [
          { href: `/circles/${circle.id}`, label: "Overview" },
          { href: `/circles/${circle.id}/members`, label: "Members and roles" },
        ],
      }}
    >
      <p>Selected member: {member.displayName}</p>
      <section aria-labelledby="current-role-heading">
        <h2 id="current-role-heading">Current Circle-wide roles</h2>
        {member.assignments.length ? (
          <ul className="stack-list">
            {member.assignments.map((assignment) => (
              <li key={assignment.id} className="content-card">
                <h3>{roleLabel(assignment.roleCode)}</h3>
                <p>Status: {assignment.status}</p>
                {assignment.status === "active" &&
                assignment.roleCode === "circle_head" &&
                activeHeadCount <= 1 ? (
                  <ProtectedFinalHeadState assignmentId={assignment.id} />
                ) : assignment.status === "active" ? (
                  <div className="action-row">
                    <RoleLifecycleForm
                      circleId={circle.id}
                      membershipId={member.membershipId}
                      assignmentId={assignment.id}
                      expectedVersion={assignment.version}
                      roleLabel={roleLabel(assignment.roleCode)}
                      operation="suspend"
                    />
                    <RoleLifecycleForm
                      circleId={circle.id}
                      membershipId={member.membershipId}
                      assignmentId={assignment.id}
                      expectedVersion={assignment.version}
                      roleLabel={roleLabel(assignment.roleCode)}
                      operation="remove"
                    />
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p>No Circle-wide roles assigned.</p>
        )}
      </section>
      {!hasCoordinatorAssignment && !member.isCurrentActor ? (
        <AssignFamilyCoordinatorForm
          circleId={circle.id}
          membershipId={member.membershipId}
        />
      ) : member.isCurrentActor ? (
        <section className="neutral-alert" aria-labelledby="self-role-heading">
          <h2 id="self-role-heading">Self-assignment unavailable</h2>
          <p>You cannot use this page to grant yourself another role.</p>
        </section>
      ) : null}
      <p>
        <Link
          className="button secondary"
          href={`/circles/${circle.id}/members`}
        >
          Return to members and roles
        </Link>
      </p>
    </AppShell>
  );
}
