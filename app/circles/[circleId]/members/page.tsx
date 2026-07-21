import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { getAuthorizedCircle } from "@/lib/circles";
import {
  canViewCircleRoles,
  listCircleRoleMembers,
  roleLabel,
} from "@/lib/circle-roles";

export const dynamic = "force-dynamic";

export default async function CircleMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ circleId: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const account = await requireAuthenticatedAdult();
  const { circleId } = await params;
  const query = await searchParams;
  if (!(await canViewCircleRoles(circleId))) return <UnavailableState />;
  const circle = await getAuthorizedCircle(account.userId, circleId);
  if (!circle) return <UnavailableState />;
  const members = await listCircleRoleMembers(circle.id);
  return (
    <AppShell
      currentPath={`/circles/${circle.id}/members`}
      pageTitle="Circle members and roles"
      context={{
        circleLabel: circle.displayName,
        careRecipientLabel: "Circle-wide",
        destinations: [
          { href: `/circles/${circle.id}`, label: "Overview" },
          { href: `/circles/${circle.id}/members`, label: "Members and roles" },
        ],
      }}
    >
      {query.role === "assigned" ? <p role="status">Role assigned.</p> : null}
      {query.role === "suspended" ? <p role="status">Role suspended.</p> : null}
      {query.role === "removed" ? <p role="status">Role removed.</p> : null}
      {query.role === "final-head-blocked" ? (
        <section
          className="neutral-alert"
          aria-labelledby="head-blocked-heading"
        >
          <h2 id="head-blocked-heading">Circle Head change blocked</h2>
          <p>
            The final active Circle Head cannot be suspended or removed. A
            verified replacement must first complete a separately approved
            acceptance flow.
          </p>
        </section>
      ) : null}
      <section aria-labelledby="member-list-heading">
        <h2 id="member-list-heading">Active Circle members</h2>
        <p>
          Circle-wide roles never grant Care Recipient access, ownership,
          management, delegation, backup authority, or medical access.
        </p>
        {!members ? (
          <UnavailableState />
        ) : members.length === 0 ? (
          <p>No other members yet.</p>
        ) : (
          <ul className="stack-list">
            {members.map((member) => (
              <li key={member.membershipId} className="content-card">
                <h3>{member.displayName}</h3>
                {member.assignments.length ? (
                  <ul>
                    {member.assignments.map((assignment) => (
                      <li key={assignment.id}>
                        {roleLabel(assignment.roleCode)} — {assignment.status}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No Circle-wide roles assigned.</p>
                )}
                {circle.isCircleHead ? (
                  <Link
                    className="button secondary"
                    href={`/circles/${circle.id}/members/${member.membershipId}/roles`}
                  >
                    Manage Circle-wide roles
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
