import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  countsForName,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let user: SyntheticUser;
beforeAll(async () => {
  user = await createSyntheticUser("atomic-user");
});
afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

async function installFailure(
  stage: string,
  table: string,
  timing: "insert" | "update" = "insert",
) {
  await sql`drop schema if exists kinward_test cascade`;
  await sql`create schema kinward_test`;
  await sql.unsafe(
    `create function kinward_test.fail_${stage}() returns trigger language plpgsql as $$ begin raise exception 'synthetic_test_failure'; end $$`,
  );
  await sql.unsafe(
    `create trigger kinward_test_fail_${stage} after ${timing} on public.${table} for each row execute function kinward_test.fail_${stage}()`,
  );
}

describe("atomic rollback fault injection", () => {
  for (const [stage, table, timing] of [
    ["idempotency_insert", "circle_creation_requests", "insert"],
    ["circle_insert", "family_circles", "insert"],
    ["membership_insert", "circle_memberships", "insert"],
    ["role_insert", "circle_role_assignments", "insert"],
    ["audit_first", "audit_events", "insert"],
    ["idempotency_update", "circle_creation_requests", "update"],
  ] as const) {
    it(`rolls back after ${stage}`, async () => {
      await installFailure(stage, table, timing);
      const name = `Fault ${stage}`;
      expect((await createCircle(user.client, name)).error).not.toBeNull();
      expect(await countsForName(name)).toEqual({
        circles: 0,
        memberships: 0,
        roles: 0,
        audits: 0,
        requests: 0,
      });
      await sql`drop schema kinward_test cascade`;
    });
  }

  it("rolls back a later audit-event failure and permits deterministic retry", async () => {
    await sql`drop schema if exists kinward_test cascade`;
    await sql`create schema kinward_test`;
    await sql`create function kinward_test.fail_later_audit() returns trigger language plpgsql as $$ begin if new.event_type = 'membership.created' then raise exception 'synthetic_test_failure'; end if; return new; end $$`;
    await sql`create trigger kinward_test_fail_later_audit before insert on public.audit_events for each row execute function kinward_test.fail_later_audit()`;
    const name = "Fault later audit",
      key = crypto.randomUUID();
    expect((await createCircle(user.client, name, key)).error).not.toBeNull();
    expect(await countsForName(name)).toEqual({
      circles: 0,
      memberships: 0,
      roles: 0,
      audits: 0,
      requests: 0,
    });
    await sql`drop schema kinward_test cascade`;
    expect((await createCircle(user.client, name, key)).error).toBeNull();
    expect(await countsForName(name)).toEqual({
      circles: 1,
      memberships: 1,
      roles: 1,
      audits: 3,
      requests: 1,
    });
  });
});
