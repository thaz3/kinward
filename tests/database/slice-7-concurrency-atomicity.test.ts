import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let owner: SyntheticUser, member: SyntheticUser;
let circleId: string, dadId: string, momId: string, membershipId: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice7-race-owner");
  member = await createSyntheticUser("slice7-race-member");
  circleId = (await createCircle(owner.client, "Slice Seven Race Circle"))
    .data as string;
  membershipId = (
    await sql<
      { id: string }[]
    >`insert into public.circle_memberships(circle_id, user_id) values (${circleId}, ${member.id}) returning id`
  )[0].id;
  dadId = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circleId,
        p_display_label: "Race Dad",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  momId = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circleId,
        p_display_label: "Race Mom",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
});
afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

describe("Slice 7 concurrency and rollback", () => {
  it("keeps simultaneous Dad and Mom assignments independent", async () => {
    const [dad, mom] = await Promise.all([
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_role_code: "medical_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: momId,
        p_membership_id: membershipId,
        p_role_code: "chemo_care_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(dad.error).toBeNull();
    expect(mom.error).toBeNull();
    const rows = await sql<{ dad_roles: number; mom_roles: number }[]>`select
      (select count(*)::int from public.care_recipient_role_assignments where care_recipient_id = ${dadId} and role_code = 'medical_lead' and status = 'active') dad_roles,
      (select count(*)::int from public.care_recipient_role_assignments where care_recipient_id = ${momId} and role_code = 'chemo_care_lead' and status = 'active') mom_roles`;
    expect(rows[0]).toEqual({ dad_roles: 1, mom_roles: 1 });
  });

  it("membership deactivation racing assignment leaves no effective authority", async () => {
    const target = await createSyntheticUser("slice7-race-target");
    const targetMembership = (
      await sql<
        { id: string }[]
      >`insert into public.circle_memberships(circle_id, user_id) values (${circleId}, ${target.id}) returning id`
    )[0].id;
    await Promise.all([
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: targetMembership,
        p_role_code: "backup_caregiver",
        p_idempotency_key: crypto.randomUUID(),
      }),
      sql`update public.circle_memberships set status = 'suspended' where id = ${targetMembership}`,
    ]);
    const allowed = await sql<
      { allowed: boolean }[]
    >`select public.kinward_has_recipient_permission(${circleId}, ${dadId}, ${target.id}, 'recipient.coordinate_temporary_coverage') allowed`;
    expect(allowed[0].allowed).toBe(false);
    const retry = await owner.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_membership_id: targetMembership,
      p_role_code: "backup_caregiver",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(retry.error).not.toBeNull();
  });

  it.each(["suspend", "remove"] as const)(
    "settles assignment racing %s in one terminal lifecycle",
    async (operation) => {
      const roleCode =
        operation === "suspend" ? "care_lead" : "backup_caregiver";
      const initial = await owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: momId,
        p_membership_id: membershipId,
        p_role_code: roleCode,
        p_idempotency_key: crypto.randomUUID(),
      });
      const assignmentId = (initial.data as { assignment_id: string })
        .assignment_id;
      const [duplicate, terminal] = await Promise.all([
        owner.client.rpc("assign_recipient_role", {
          p_circle_id: circleId,
          p_care_recipient_id: momId,
          p_membership_id: membershipId,
          p_role_code: roleCode,
          p_idempotency_key: crypto.randomUUID(),
        }),
        owner.client.rpc("transition_recipient_role", {
          p_assignment_id: assignmentId,
          p_operation: operation,
          p_expected_version: 1,
          p_idempotency_key: crypto.randomUUID(),
        }),
      ]);
      expect(terminal.error).toBeNull();
      expect(
        duplicate.error === null ||
          duplicate.error.message === "role_lifecycle_closed",
      ).toBe(true);
      const state = await sql<
        { rows: number; active: number; status: string }[]
      >`
        select count(*)::int rows,
          count(*) filter (where status = 'active')::int active,
          max(status) status
        from public.care_recipient_role_assignments
        where care_recipient_id = ${momId} and membership_id = ${membershipId}
          and role_code = ${roleCode}`;
      expect(state[0]).toEqual({
        rows: 1,
        active: 0,
        status: operation === "suspend" ? "suspended" : "removed",
      });
      const permission = await sql<
        { allowed: boolean }[]
      >`select public.kinward_has_recipient_permission(
        ${circleId}, ${momId}, ${member.id},
        ${operation === "suspend" ? "recipient.coordinate_practical_support" : "recipient.coordinate_temporary_coverage"}
      ) allowed`;
      expect(permission[0].allowed).toBe(false);
    },
  );

  it("rolls back assignment, request, and audit when audit append fails, then retries", async () => {
    const target = await createSyntheticUser("slice7-atomic-target");
    const targetMembership = (
      await sql<
        { id: string }[]
      >`insert into public.circle_memberships(circle_id, user_id) values (${circleId}, ${target.id}) returning id`
    )[0].id;
    await sql`create schema kinward_test`;
    await sql`create function kinward_test.fail_recipient_role_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'recipient_role.assigned' then raise exception 'synthetic_test_failure'; end if; return new; end $$`;
    await sql`revoke all on function kinward_test.fail_recipient_role_audit() from public, anon, authenticated`;
    const hookPrivileges = await sql<
      { anon_execute: boolean; authenticated_execute: boolean }[]
    >`select
      has_function_privilege('anon','kinward_test.fail_recipient_role_audit()','EXECUTE') anon_execute,
      has_function_privilege('authenticated','kinward_test.fail_recipient_role_audit()','EXECUTE') authenticated_execute`;
    expect(hookPrivileges[0]).toEqual({
      anon_execute: false,
      authenticated_execute: false,
    });
    await sql`create trigger kinward_test_fail_recipient_role_audit before insert on public.audit_events for each row execute function kinward_test.fail_recipient_role_audit()`;
    const key = crypto.randomUUID();
    const failed = await owner.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_membership_id: targetMembership,
      p_role_code: "care_lead",
      p_idempotency_key: key,
    });
    expect(failed.error).not.toBeNull();
    const state = await sql<
      { roles: number; requests: number; audits: number }[]
    >`select
      (select count(*)::int from public.care_recipient_role_assignments where membership_id = ${targetMembership}) roles,
      (select count(*)::int from public.care_recipient_role_mutation_requests where idempotency_key = ${key}) requests,
      (select count(*)::int from public.audit_events where correlation_id = ${key}) audits`;
    expect(state[0]).toEqual({ roles: 0, requests: 0, audits: 0 });
    await sql`drop schema kinward_test cascade`;
    const retry = await owner.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_membership_id: targetMembership,
      p_role_code: "care_lead",
      p_idempotency_key: key,
    });
    expect(retry.error).toBeNull();
  });
});
