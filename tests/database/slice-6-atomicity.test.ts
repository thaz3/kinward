import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let head: SyntheticUser;
let member: SyntheticUser;
let circleId: string;
let membershipId: string;

beforeAll(async () => {
  head = await createSyntheticUser("role-atomic-head");
  member = await createSyntheticUser("role-atomic-member");
  const circle = await createCircle(head.client, "Role Atomic Circle");
  circleId = circle.data as string;
  const rows = await sql<{ id: string }[]>`
    insert into public.circle_memberships(circle_id, user_id)
    values (${circleId}, ${member.id}) returning id`;
  membershipId = rows[0].id;
});

afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

describe("Slice 6 atomic rollback", () => {
  it.each([
    [
      "mutation-request insertion",
      "public.circle_role_mutation_requests",
      "insert",
      "true",
    ],
    [
      "assignment insertion and activation",
      "public.circle_role_assignments",
      "insert",
      "new.role_code = 'family_coordinator'",
    ],
    [
      "final mutation completion",
      "public.circle_role_mutation_requests",
      "update",
      "new.result is not null",
    ],
  ])(
    "rolls back %s failure and permits a governed retry",
    async (_stage, table, operation, condition) => {
      const target = await createSyntheticUser(
        `role-atomic-${String(_stage).replaceAll(" ", "-")}`,
      );
      const targetMembership = (
        await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${circleId}, ${target.id}) returning id`
      )[0].id;
      const key = crypto.randomUUID();
      await sql`create schema if not exists kinward_test`;
      await sql.unsafe(
        `create function kinward_test.fail_stage() returns trigger language plpgsql as $$ begin if ${condition} then raise exception 'synthetic_test_failure'; end if; return new; end $$`,
      );
      await sql.unsafe(
        `create trigger kinward_test_fail_stage before ${operation} on ${table} for each row execute function kinward_test.fail_stage()`,
      );
      const failed = await head.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: targetMembership,
        p_idempotency_key: key,
      });
      expect(failed.error).not.toBeNull();
      const rolledBack = await sql<
        {
          roles: number;
          requests: number;
          audits: number;
          authority: boolean;
        }[]
      >`
      select
        (select count(*)::int from public.circle_role_assignments where membership_id = ${targetMembership}) roles,
        (select count(*)::int from public.circle_role_mutation_requests where idempotency_key = ${key}) requests,
        (select count(*)::int from public.audit_events where correlation_id = ${key}) audits,
        public.kinward_has_circle_permission(${circleId}, ${target.id}, 'circle.roles.view') authority`;
      expect(rolledBack[0]).toEqual({
        roles: 0,
        requests: 0,
        audits: 0,
        authority: false,
      });
      await sql`drop schema kinward_test cascade`;
      const retry = await head.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: targetMembership,
        p_idempotency_key: key,
      });
      expect(retry.error).toBeNull();
    },
  );

  it("keeps membership validation failure atomic and retries after the target is active", async () => {
    const target = await createSyntheticUser("role-atomic-membership-boundary");
    const targetMembership = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id, status)
        values (${circleId}, ${target.id}, 'suspended') returning id`
    )[0].id;
    const key = crypto.randomUUID();
    const failed = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: targetMembership,
      p_idempotency_key: key,
    });
    expect(failed.error).not.toBeNull();
    const state = await sql<
      { roles: number; requests: number; audits: number }[]
    >`
      select
        (select count(*)::int from public.circle_role_assignments where membership_id = ${targetMembership}) roles,
        (select count(*)::int from public.circle_role_mutation_requests where idempotency_key = ${key}) requests,
        (select count(*)::int from public.audit_events where correlation_id = ${key}) audits`;
    expect(state[0]).toEqual({ roles: 0, requests: 0, audits: 0 });
    await sql`update public.circle_memberships set status = 'active' where id = ${targetMembership}`;
    const retry = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: targetMembership,
      p_idempotency_key: key,
    });
    expect(retry.error).toBeNull();
  });

  it("rolls back assignment when the required audit append fails, then retries", async () => {
    await sql`create schema if not exists kinward_test`;
    await sql`create function kinward_test.fail_role_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'circle_role.assigned' then raise exception 'synthetic_test_failure'; end if; return new; end $$`;
    await sql`create trigger kinward_test_fail_role_audit before insert on public.audit_events for each row execute function kinward_test.fail_role_audit()`;
    const key = crypto.randomUUID();
    const failed = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: membershipId,
      p_idempotency_key: key,
    });
    expect(failed.error).not.toBeNull();
    const before = await sql<{ roles: number; requests: number }[]>`
      select
        (select count(*)::int from public.circle_role_assignments where membership_id = ${membershipId}) roles,
        (select count(*)::int from public.circle_role_mutation_requests where idempotency_key = ${key}) requests`;
    expect(before[0]).toEqual({ roles: 0, requests: 0 });
    await sql`drop schema kinward_test cascade`;
    const retry = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: membershipId,
      p_idempotency_key: key,
    });
    expect(retry.error).toBeNull();
  });

  it("rolls back lifecycle update when its audit append fails", async () => {
    const assignment = await sql<{ id: string; version: number }[]>`
      select id, version from public.circle_role_assignments
      where membership_id = ${membershipId} and role_code = 'family_coordinator' and status = 'active'`;
    await sql`create schema kinward_test`;
    await sql`create function kinward_test.fail_remove_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'circle_role.removed' then raise exception 'synthetic_test_failure'; end if; return new; end $$`;
    await sql`create trigger kinward_test_fail_remove_audit before insert on public.audit_events for each row execute function kinward_test.fail_remove_audit()`;
    const failed = await head.client.rpc("transition_circle_role", {
      p_assignment_id: assignment[0].id,
      p_operation: "remove",
      p_expected_version: assignment[0].version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(failed.error).not.toBeNull();
    const state = await sql<{ status: string; version: number }[]>`
      select status, version from public.circle_role_assignments where id = ${assignment[0].id}`;
    expect(state[0]).toEqual({
      status: "active",
      version: assignment[0].version,
    });
  });
});
