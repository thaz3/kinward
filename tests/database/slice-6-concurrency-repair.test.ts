import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let head: SyntheticUser;
let member: SyntheticUser;
let otherHead: SyntheticUser;
let circleId: string;
let membershipId: string;
let otherCircleId: string;

beforeAll(async () => {
  head = await createSyntheticUser("role-race-head");
  member = await createSyntheticUser("role-race-member");
  otherHead = await createSyntheticUser("role-race-other-head");
  circleId = (await createCircle(head.client, "Role Race Circle"))
    .data as string;
  otherCircleId = (await createCircle(otherHead.client, "Other Race Circle"))
    .data as string;
  membershipId = (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${circleId}, ${member.id}) returning id`
  )[0].id;
});

describe("Slice 6 real role concurrency", () => {
  it("coalesces concurrent identical assignments into one governed result", async () => {
    const key = crypto.randomUUID();
    const [first, second] = await Promise.all([
      head.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: membershipId,
        p_idempotency_key: key,
      }),
      head.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: membershipId,
        p_idempotency_key: key,
      }),
    ]);
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(second.data).toEqual(first.data);
    const state = await sql<{ roles: number; audits: number; other: number }[]>`
      select
        (select count(*)::int from public.circle_role_assignments
          where circle_id = ${circleId} and membership_id = ${membershipId}
            and role_code = 'family_coordinator' and status = 'active') roles,
        (select count(*)::int from public.audit_events
          where circle_id = ${circleId} and event_type = 'circle_role.assigned'
            and correlation_id = ${key}) audits,
        (select count(*)::int from public.circle_role_assignments
          where circle_id = ${otherCircleId} and role_code = 'family_coordinator') other`;
    expect(state[0]).toEqual({ roles: 1, audits: 1, other: 0 });
  });

  it("governs assignment racing removal with removal as the terminal lifecycle state", async () => {
    const assignment = await sql<{ id: string; version: number }[]>`
      select id, version from public.circle_role_assignments
      where circle_id = ${circleId} and membership_id = ${membershipId}
        and role_code = 'family_coordinator' and status = 'active'`;
    const assignmentKey = crypto.randomUUID();
    const removalKey = crypto.randomUUID();
    let removalPromise: ReturnType<typeof head.client.rpc>;
    let assignmentPromise: ReturnType<typeof head.client.rpc>;
    await sql.begin(async (transaction) => {
      await transaction`select id from public.circle_role_assignments
        where id = ${assignment[0].id} for update`;
      removalPromise = head.client.rpc("transition_circle_role", {
        p_assignment_id: assignment[0].id,
        p_operation: "remove",
        p_expected_version: assignment[0].version,
        p_idempotency_key: removalKey,
      });
      await new Promise((resolve) => setTimeout(resolve, 25));
      assignmentPromise = head.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: membershipId,
        p_idempotency_key: assignmentKey,
      });
      await new Promise((resolve) => setTimeout(resolve, 25));
    });
    const [removal, assignmentRetry] = await Promise.all([
      removalPromise!,
      assignmentPromise!,
    ]);
    expect(removal.error).toBeNull();
    expect(assignmentRetry.error?.code).toBe("55000");
    const retry = await head.client.rpc("transition_circle_role", {
      p_assignment_id: assignment[0].id,
      p_operation: "remove",
      p_expected_version: assignment[0].version,
      p_idempotency_key: removalKey,
    });
    expect(retry.data).toEqual(removal.data);
    const state = await sql<
      {
        status: string;
        rows: number;
        assign_audits: number;
        remove_audits: number;
        authority: boolean;
      }[]
    >`
      select assignment.status,
        (select count(*)::int from public.circle_role_assignments
          where circle_id = ${circleId} and membership_id = ${membershipId}
            and role_code = 'family_coordinator') rows,
        (select count(*)::int from public.audit_events
          where correlation_id = ${assignmentKey}) assign_audits,
        (select count(*)::int from public.audit_events
          where correlation_id = ${removalKey}) remove_audits,
        public.kinward_has_circle_permission(${circleId}, ${member.id}, 'circle.roles.view') authority
      from public.circle_role_assignments assignment where assignment.id = ${assignment[0].id}`;
    expect(state[0]).toEqual({
      status: "removed",
      rows: 1,
      assign_audits: 0,
      remove_audits: 1,
      authority: false,
    });
  });

  it("settles assignment versus membership deactivation without effective orphan authority", async () => {
    const fresh = await createSyntheticUser("role-race-inactive-target");
    const target = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${circleId}, ${fresh.id}) returning id`
    )[0].id;
    const key = crypto.randomUUID();
    await Promise.all([
      head.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: target,
        p_idempotency_key: key,
      }),
      sql`update public.circle_memberships set status = 'suspended' where id = ${target}`,
    ]);
    const state = await sql<
      {
        membership_status: string;
        authority: boolean;
        active_heads: number;
        audits: number;
      }[]
    >`
      select membership.status membership_status,
        public.kinward_has_circle_permission(${circleId}, ${fresh.id}, 'circle.roles.view') authority,
        (select count(*)::int from public.circle_role_assignments role
          join public.circle_memberships member on member.id = role.membership_id
          where role.circle_id = ${circleId} and role.role_code = 'circle_head'
            and role.status = 'active' and member.status = 'active') active_heads,
        (select count(*)::int from public.audit_events where correlation_id = ${key}) audits
      from public.circle_memberships membership where membership.id = ${target}`;
    expect(state[0].membership_status).toBe("suspended");
    expect(state[0].authority).toBe(false);
    expect(state[0].active_heads).toBe(1);
    expect(state[0].audits).toBeLessThanOrEqual(1);
    const retry = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: target,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(retry.error).not.toBeNull();
  });
});
