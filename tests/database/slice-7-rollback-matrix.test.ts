import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let owner: SyntheticUser,
  member: SyntheticUser,
  outsider: SyntheticUser,
  circle: string,
  recipient: string,
  membership: string;
beforeAll(async () => {
  owner = await createSyntheticUser("slice7-matrix-owner");
  member = await createSyntheticUser("slice7-matrix-member");
  outsider = await createSyntheticUser("slice7-matrix-outsider");
  circle = (await createCircle(owner.client, "Rollback Matrix Circle"))
    .data as string;
  membership = (
    await sql<
      { id: string }[]
    >`insert into public.circle_memberships(circle_id,user_id) values(${circle},${member.id}) returning id`
  )[0].id;
  recipient = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circle,
        p_display_label: "Rollback Recipient",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
});

async function snapshot(key: string, recipientId = recipient) {
  return (
    await sql<
      {
        assignments: number;
        requests: number;
        completed: number;
        audits: number;
        owner: string;
        membership: string;
        circleRoles: number;
      }[]
    >`select
    (select count(*)::int from public.care_recipient_role_assignments where care_recipient_id=${recipientId}) assignments,
    (select count(*)::int from public.care_recipient_role_mutation_requests where idempotency_key=${key}) requests,
    (select count(*)::int from public.care_recipient_role_mutation_requests where idempotency_key=${key} and result is not null) completed,
    (select count(*)::int from public.audit_events where correlation_id=${key}) audits,
    (select owner_user_id::text from public.care_recipients where id=${recipientId}) owner,
    (select status from public.circle_memberships where id=${membership}) membership,
    (select count(*)::int from public.circle_role_assignments where circle_id=${circle}) circleRoles`
  )[0];
}
describe("Slice 7 exhaustive transactional rollback matrix", () => {
  it("proves pre-write authentication and exact-scope validations leave no state", async () => {
    const attempts = [
      anonymous.rpc("assign_recipient_role", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_role_code: "care_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      outsider.client.rpc("assign_recipient_role", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_role_code: "care_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: crypto.randomUUID(),
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_role_code: "care_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circle,
        p_care_recipient_id: crypto.randomUUID(),
        p_membership_id: membership,
        p_role_code: "care_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: crypto.randomUUID(),
        p_role_code: "care_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_role_code: "unknown",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ];
    const results = await Promise.all(attempts);
    expect(results.every((r) => r.error)).toBe(true);
    const state = await snapshot(crypto.randomUUID());
    expect(state.assignments).toBe(0);
    expect(state.owner).toBe(owner.id);
    expect(state.membership).toBe("active");
  });

  it.each([
    [
      "mutation-request creation",
      "public.care_recipient_role_mutation_requests",
      "before insert",
      "true",
    ],
    [
      "assignment insertion",
      "public.care_recipient_role_assignments",
      "before insert",
      "true",
    ],
    [
      "assignment audit append",
      "public.audit_events",
      "before insert",
      "new.event_type = 'recipient_role.assigned'",
    ],
    [
      "mutation-request completion",
      "public.care_recipient_role_mutation_requests",
      "before update",
      "new.result is not null",
    ],
    [
      "final transaction completion",
      "public.audit_events",
      "after insert",
      "new.event_type = 'recipient_role.assigned'",
    ],
  ] as const)(
    "rolls back a failure at %s and permits one governed retry",
    async (_stage, table, timing, condition) => {
      const key = crypto.randomUUID();
      const stageRecipient = (
        (
          await owner.client.rpc("self_activate_care_recipient", {
            p_circle_id: circle,
            p_display_label: `Rollback Stage ${key.slice(0, 8)}`,
            p_idempotency_key: crypto.randomUUID(),
            p_consent_version: "kinward.ownership.v1",
          })
        ).data as { care_recipient_id: string }
      ).care_recipient_id;
      const stageRequest = () =>
        owner.client.rpc("assign_recipient_role", {
          p_circle_id: circle,
          p_care_recipient_id: stageRecipient,
          p_membership_id: membership,
          p_role_code: "care_lead",
          p_idempotency_key: key,
        });
      await sql`create schema if not exists kinward_test`;
      await sql.unsafe(
        `create or replace function kinward_test.fail_stage() returns trigger language plpgsql as $$ begin if ${condition} then raise exception 'synthetic_test_failure'; end if; return new; end $$`,
      );
      await sql`revoke all on function kinward_test.fail_stage() from public, anon, authenticated`;
      const hookPrivileges = await sql<
        { anon_execute: boolean; authenticated_execute: boolean }[]
      >`select
        has_function_privilege('anon','kinward_test.fail_stage()','EXECUTE') anon_execute,
        has_function_privilege('authenticated','kinward_test.fail_stage()','EXECUTE') authenticated_execute`;
      expect(hookPrivileges[0]).toEqual({
        anon_execute: false,
        authenticated_execute: false,
      });
      const deferred = timing === "after insert" ? " constraint" : "";
      const deferrable =
        timing === "after insert" ? " deferrable initially deferred" : "";
      await sql.unsafe(
        `create${deferred} trigger kinward_test_fail_stage ${timing} on ${table}${deferrable} for each row execute function kinward_test.fail_stage()`,
      );
      const failed = await stageRequest();
      expect(failed.error).not.toBeNull();
      const rolled = await snapshot(key, stageRecipient);
      expect(rolled).toMatchObject({
        assignments: 0,
        requests: 0,
        completed: 0,
        audits: 0,
        owner: owner.id,
        membership: "active",
      });
      await sql`drop schema kinward_test cascade`;
      const retry = await stageRequest();
      expect(retry.error).toBeNull();
      const final = await snapshot(key, stageRecipient);
      expect(final).toMatchObject({
        assignments: 1,
        requests: 1,
        completed: 1,
        audits: 1,
        owner: owner.id,
        membership: "active",
      });
    },
  );

  it.each(["suspend", "remove"] as const)(
    "rolls back the lifecycle UPDATE for %s and permits one governed retry",
    async (operation) => {
      const key = crypto.randomUUID();
      const role =
        operation === "suspend" ? "medical_lead" : "backup_caregiver";
      const assigned = await owner.client.rpc("assign_recipient_role", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_role_code: role,
        p_idempotency_key: crypto.randomUUID(),
      });
      expect(assigned.error).toBeNull();
      const assignmentId = (assigned.data as { assignment_id: string })
        .assignment_id;

      await sql`create schema kinward_test`;
      await sql`create function kinward_test.fail_lifecycle_update() returns trigger language plpgsql as $$ begin if old.id = new.id and old.status = 'active' and new.status <> 'active' then raise exception 'synthetic_test_failure'; end if; return new; end $$`;
      await sql`revoke all on function kinward_test.fail_lifecycle_update() from public, anon, authenticated`;
      await sql`create trigger kinward_test_fail_lifecycle_update before update on public.care_recipient_role_assignments for each row execute function kinward_test.fail_lifecycle_update()`;

      const request = () =>
        owner.client.rpc("transition_recipient_role", {
          p_assignment_id: assignmentId,
          p_operation: operation,
          p_expected_version: 1,
          p_idempotency_key: key,
        });
      const failed = await request();
      expect(failed.error).not.toBeNull();
      const rolled = await sql<
        { status: string; version: number; requests: number; audits: number }[]
      >`select status, version::int,
        (select count(*)::int from public.care_recipient_role_mutation_requests where idempotency_key=${key}) requests,
        (select count(*)::int from public.audit_events where correlation_id=${key}) audits
        from public.care_recipient_role_assignments where id=${assignmentId}`;
      expect(rolled[0]).toEqual({
        status: "active",
        version: 1,
        requests: 0,
        audits: 0,
      });

      await sql`drop schema kinward_test cascade`;
      const retry = await request();
      expect(retry.error).toBeNull();
      expect(retry.data).toMatchObject({
        assignment_id: assignmentId,
        status: operation === "suspend" ? "suspended" : "removed",
      });
    },
  );

  it("keeps synthetic hooks unreachable and removes them after each test", async () => {
    const grants = await sql<
      { anon_execute: boolean; authenticated_execute: boolean; hooks: number }[]
    >`select
      has_function_privilege('anon','public.assign_recipient_role(uuid,uuid,uuid,text,uuid)','EXECUTE') anon_execute,
      has_function_privilege('authenticated','public.assign_recipient_role(uuid,uuid,uuid,text,uuid)','EXECUTE') authenticated_execute,
      (select count(*)::int from pg_namespace where nspname='kinward_test') hooks`;
    expect(grants[0]).toEqual({
      anon_execute: false,
      authenticated_execute: true,
      hooks: 0,
    });
  });
});
