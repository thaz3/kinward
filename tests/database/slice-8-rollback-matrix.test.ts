import { afterAll, beforeAll, describe, expect, it } from "vitest";
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
  recipient: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice8-matrix-owner");
  member = await createSyntheticUser("slice8-matrix-member");
  outsider = await createSyntheticUser("slice8-matrix-outsider");
  circle = (await createCircle(owner.client, "Slice Eight Rollback Circle"))
    .data as string;
  await sql`insert into public.circle_memberships(circle_id, user_id) values (${circle}, ${member.id})`;
  recipient = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circle,
        p_display_label: "Rollback Mode Recipient",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
});

async function snapshot(key: string) {
  return (
    await sql<
      {
        modes: number;
        active: number;
        requests: number;
        completed: number;
        audits: number;
        owner: string;
      }[]
    >`select
    (select count(*)::int from public.care_management_modes where care_recipient_id = ${recipient}) modes,
    (select count(*)::int from public.care_management_modes where care_recipient_id = ${recipient} and status = 'active') active,
    (select count(*)::int from public.care_management_mode_mutation_requests where idempotency_key = ${key}) requests,
    (select count(*)::int from public.care_management_mode_mutation_requests where idempotency_key = ${key} and result is not null) completed,
    (select count(*)::int from public.audit_events where correlation_id = ${key}) audits,
    (select owner_user_id::text from public.care_recipients where id = ${recipient}) owner`
  )[0];
}

afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

describe("Slice 8 exhaustive transactional rollback matrix", () => {
  it("proves pre-write authentication and exact-scope validations leave no state", async () => {
    const key = crypto.randomUUID();
    const results = await Promise.all([
      anonymous.rpc("select_care_management_mode", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      outsider.client.rpc("select_care_management_mode", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      member.client.rpc("select_care_management_mode", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: crypto.randomUUID(),
        p_care_recipient_id: recipient,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circle,
        p_care_recipient_id: crypto.randomUUID(),
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_mode_code: "unknown_mode",
        p_expected_version: 0,
        p_idempotency_key: key,
      }),
    ]);
    expect(results.every((result) => result.error)).toBe(true);
    const state = await snapshot(key);
    expect(state.modes).toBe(0);
    expect(state.active).toBe(0);
    expect(state.completed).toBe(0);
    expect(state.audits).toBe(0);
    expect(state.owner).toBe(owner.id);
  });

  it.each([
    [
      "mutation-request creation",
      "public.care_management_mode_mutation_requests",
      "before insert",
      "true",
    ],
    [
      "mode insert",
      "public.care_management_modes",
      "before insert",
      "new.status = 'active'",
    ],
    [
      "audit insert",
      "public.audit_events",
      "before insert",
      "new.event_type = 'management_mode.changed'",
    ],
  ] as const)(
    "rolls back completely when failure occurs at %s",
    async (_label, table, timing, condition) => {
      const key = crypto.randomUUID();
      const functionName = `kinward_test.fail_${_label.replace(/\W+/g, "_")}`;
      await sql`create schema if not exists kinward_test`;
      await sql.unsafe(`
        create or replace function ${functionName}()
        returns trigger language plpgsql as $fn$
        begin
          if ${condition} then
            raise exception 'forced_boundary_failure';
          end if;
          return new;
        end;
        $fn$;
      `);
      const triggerName = `fail_mode_${_label.replace(/\W+/g, "_")}`;
      await sql.unsafe(`drop trigger if exists ${triggerName} on ${table}`);
      await sql.unsafe(`
        create trigger ${triggerName}
        ${timing} on ${table}
        for each row execute function ${functionName}()
      `);

      const failed = await owner.client.rpc("select_care_management_mode", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: key,
      });
      expect(failed.error).not.toBeNull();
      const state = await snapshot(key);
      expect(state.modes).toBe(0);
      expect(state.active).toBe(0);
      expect(state.completed).toBe(0);
      expect(state.audits).toBe(0);

      await sql.unsafe(`drop trigger if exists ${triggerName} on ${table}`);
      await sql.unsafe(`drop function if exists ${functionName}()`);
    },
  );

  it("commits mode, audit, and request atomically on success and grants execute only to authenticated", async () => {
    const key = crypto.randomUUID();
    const result = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circle,
      p_care_recipient_id: recipient,
      p_mode_code: "self_managed",
      p_expected_version: 0,
      p_idempotency_key: key,
    });
    expect(result.error).toBeNull();
    const state = await snapshot(key);
    expect(state).toEqual({
      modes: 1,
      active: 1,
      requests: 1,
      completed: 1,
      audits: 1,
      owner: owner.id,
    });
    const grants = await sql<
      { grantee: string; privilege: string }[]
    >`select grantee, privilege_type privilege
      from information_schema.role_table_grants
      where table_schema = 'public'
        and table_name in ('care_management_modes', 'care_management_mode_mutation_requests')
        and grantee in ('anon', 'authenticated', 'public')`;
    expect(grants).toEqual([]);
    const execute = await sql<{ grantee: string }[]>`
      select grantee::text from information_schema.routine_privileges
      where routine_schema = 'public'
        and routine_name = 'select_care_management_mode'
        and privilege_type = 'EXECUTE'
        and grantee::text in ('anon', 'public', 'authenticated')`;
    expect(execute.map((row) => row.grantee).sort()).toEqual(["authenticated"]);
  });

  it("rolls back supersede transitions when mid-write audit fails", async () => {
    const key = crypto.randomUUID();
    await sql`create schema if not exists kinward_test`;
    await sql.unsafe(`
      create or replace function kinward_test.fail_supersede_audit()
      returns trigger language plpgsql as $fn$
      begin
        if new.event_type = 'management_mode.changed'
           and new.prior_state ->> 'mode_code' = 'self_managed'
           and new.next_state ->> 'mode_code' = 'shared_management'
           and new.care_recipient_id = '${recipient}'::uuid then
          raise exception 'forced_supersede_failure';
        end if;
        return new;
      end;
      $fn$`);
    await sql`drop trigger if exists fail_supersede_audit on public.audit_events`;
    await sql`
      create trigger fail_supersede_audit
      before insert on public.audit_events
      for each row execute function kinward_test.fail_supersede_audit()`;

    const failed = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circle,
      p_care_recipient_id: recipient,
      p_mode_code: "shared_management",
      p_expected_version: 1,
      p_idempotency_key: key,
    });
    expect(failed.error).not.toBeNull();
    const state = await snapshot(key);
    expect(state.modes).toBe(1);
    expect(state.active).toBe(1);
    expect(state.completed).toBe(0);
    expect(state.audits).toBe(0);
    const mode = await sql<
      { mode_code: string; status: string }[]
    >`select mode_code, status from public.care_management_modes
      where care_recipient_id = ${recipient} and status = 'active'`;
    expect(mode[0]).toEqual({ mode_code: "self_managed", status: "active" });

    await sql`drop trigger if exists fail_supersede_audit on public.audit_events`;
    await sql`drop function if exists kinward_test.fail_supersede_audit()`;
  });
});
