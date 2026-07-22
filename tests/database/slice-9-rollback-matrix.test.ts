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
  circle: string,
  recipient: string,
  membership: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice9-matrix-owner");
  member = await createSyntheticUser("slice9-matrix-member");
  circle = (await createCircle(owner.client, "Slice Nine Rollback Circle"))
    .data as string;
  membership = (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${circle}, ${member.id}) returning id`
  )[0].id;
  recipient = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circle,
        p_display_label: "Rollback Grant Recipient",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  await owner.client.rpc("select_care_management_mode", {
    p_circle_id: circle,
    p_care_recipient_id: recipient,
    p_mode_code: "shared_management",
    p_expected_version: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
});

afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

async function snapshot(key: string) {
  return (
    await sql<
      {
        grants: number;
        scopes: number;
        consents: number;
        requests: number;
        completed: number;
        audits: number;
      }[]
    >`select
    (select count(*)::int from public.shared_management_grants where care_recipient_id = ${recipient}) grants,
    (select count(*)::int from public.management_grant_scopes where care_recipient_id = ${recipient} and grant_type = 'shared') scopes,
    (select count(*)::int from public.consent_records where care_recipient_id = ${recipient} and consent_kind = 'shared_management_grant') consents,
    (select count(*)::int from public.management_grant_mutation_requests where idempotency_key = ${key}) requests,
    (select count(*)::int from public.management_grant_mutation_requests where idempotency_key = ${key} and result is not null) completed,
    (select count(*)::int from public.audit_events where correlation_id = ${key}) audits`
  )[0];
}

describe("Slice 9 rollback matrix", () => {
  it("leaves no state for pre-write denials", async () => {
    const key = crypto.randomUUID();
    const results = await Promise.all([
      anonymous.rpc("create_shared_management_grant", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_permission_codes: ["recipient.change_ownership"],
        p_selection_mode: "selected",
        p_idempotency_key: key,
      }),
    ]);
    expect(results.every((result) => result.error)).toBe(true);
    const state = await snapshot(key);
    expect(state.grants).toBe(0);
    expect(state.scopes).toBe(0);
    expect(state.consents).toBe(0);
    expect(state.completed).toBe(0);
    expect(state.audits).toBe(0);
  });

  it.each([
    [
      "mutation_request",
      "public.management_grant_mutation_requests",
      "before insert",
      "true",
    ],
    [
      "grant_insert",
      "public.shared_management_grants",
      "before insert",
      "new.status = 'active'",
    ],
    [
      "scope_insert",
      "public.management_grant_scopes",
      "before insert",
      "new.grant_type = 'shared'",
    ],
    [
      "consent_insert",
      "public.consent_records",
      "before insert",
      "new.consent_kind = 'shared_management_grant'",
    ],
    [
      "audit_insert",
      "public.audit_events",
      "before insert",
      "new.event_type = 'shared_grant.created'",
    ],
  ] as const)(
    "rolls back completely when failure occurs at %s",
    async (label, table, timing, condition) => {
      const key = crypto.randomUUID();
      const functionName = `kinward_test.fail_${label}`;
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
      const triggerName = `fail_${label}`;
      await sql.unsafe(`drop trigger if exists ${triggerName} on ${table}`);
      await sql.unsafe(`
        create trigger ${triggerName}
        ${timing} on ${table}
        for each row execute function ${functionName}()
      `);

      const failed = await owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circle,
        p_care_recipient_id: recipient,
        p_membership_id: membership,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: key,
      });
      expect(failed.error).not.toBeNull();
      const state = await snapshot(key);
      expect(state.grants).toBe(0);
      expect(state.scopes).toBe(0);
      expect(state.consents).toBe(0);
      expect(state.completed).toBe(0);
      expect(state.audits).toBe(0);

      await sql.unsafe(`drop trigger if exists ${triggerName} on ${table}`);
      await sql.unsafe(`drop function if exists ${functionName}()`);
    },
  );

  it("commits grant, scopes, consent, and audits atomically", async () => {
    const key = crypto.randomUUID();
    const result = await owner.client.rpc("create_shared_management_grant", {
      p_circle_id: circle,
      p_care_recipient_id: recipient,
      p_membership_id: membership,
      p_permission_codes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
      p_selection_mode: "all_current",
      p_idempotency_key: key,
    });
    expect(result.error).toBeNull();
    const state = await snapshot(key);
    expect(state).toEqual({
      grants: 1,
      scopes: 2,
      consents: 1,
      requests: 1,
      completed: 1,
      audits: 2,
    });
  });
});
