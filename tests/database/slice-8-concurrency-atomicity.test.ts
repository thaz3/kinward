import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let owner: SyntheticUser;
let circleId: string;
let dadId: string;
let momId: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice8-race-owner");
  circleId = (await createCircle(owner.client, "Slice Eight Race Circle"))
    .data as string;
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

describe("Slice 8 concurrency and atomicity", () => {
  it("keeps simultaneous Dad and Mom mode selections independent", async () => {
    const [dad, mom] = await Promise.all([
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: momId,
        p_mode_code: "shared_management",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(dad.error).toBeNull();
    expect(mom.error).toBeNull();
    const rows = await sql<{ dad_mode: string; mom_mode: string }[]>`select
      (select mode_code from public.care_management_modes where care_recipient_id = ${dadId} and status = 'active') dad_mode,
      (select mode_code from public.care_management_modes where care_recipient_id = ${momId} and status = 'active') mom_mode`;
    expect(rows[0]).toEqual({
      dad_mode: "self_managed",
      mom_mode: "shared_management",
    });
  });

  it("settles conflicting mode transitions with one winner and stale_state", async () => {
    const [shared, delegated] = await Promise.all([
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "delegated_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    const successes = [shared, delegated].filter((result) => !result.error);
    const failures = [shared, delegated].filter((result) => result.error);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].error?.message).toBe("stale_state");
    const state = await sql<
      { active: number; superseded: number; mode: string }[]
    >`select
      count(*) filter (where status = 'active')::int active,
      count(*) filter (where status = 'superseded')::int superseded,
      max(mode_code) filter (where status = 'active') mode
      from public.care_management_modes
      where care_recipient_id = ${dadId}`;
    expect(state[0].active).toBe(1);
    expect(state[0].superseded).toBeGreaterThanOrEqual(1);
    expect(["shared_management", "delegated_management"]).toContain(
      state[0].mode,
    );
  });

  it("membership deactivation racing mode selection leaves no usable authority after deactivation", async () => {
    const targetOwner = await createSyntheticUser("slice8-race-target-owner");
    const backupHead = await createSyntheticUser("slice8-race-backup-head");
    const targetCircle = (
      await createCircle(targetOwner.client, "Slice Eight Deactivation Circle")
    ).data as string;
    const backupMembership = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${targetCircle}, ${backupHead.id}) returning id`
    )[0].id;
    await sql`
      insert into public.circle_role_assignments(
        circle_id, membership_id, role_code, assigned_by_user_id
      ) values (${targetCircle}, ${backupMembership}, 'circle_head', ${targetOwner.id})`;
    const targetRecipient = (
      (
        await targetOwner.client.rpc("self_activate_care_recipient", {
          p_circle_id: targetCircle,
          p_display_label: "Deactivation Recipient",
          p_idempotency_key: crypto.randomUUID(),
          p_consent_version: "kinward.ownership.v1",
        })
      ).data as { care_recipient_id: string }
    ).care_recipient_id;
    await Promise.all([
      targetOwner.client.rpc("select_care_management_mode", {
        p_circle_id: targetCircle,
        p_care_recipient_id: targetRecipient,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: crypto.randomUUID(),
      }),
      sql`update public.circle_memberships set status = 'suspended'
          where circle_id = ${targetCircle} and user_id = ${targetOwner.id}`,
    ]);
    const retry = await targetOwner.client.rpc("select_care_management_mode", {
      p_circle_id: targetCircle,
      p_care_recipient_id: targetRecipient,
      p_mode_code: "shared_management",
      p_expected_version: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(retry.error).not.toBeNull();
    const canSelect = await targetOwner.client.rpc(
      "can_select_management_mode",
      {
        p_circle_id: targetCircle,
        p_care_recipient_id: targetRecipient,
      },
    );
    expect(canSelect.data).toBe(false);
  });

  it("rolls back the full mode transition when audit insert fails", async () => {
    await sql`create schema if not exists kinward_test`;
    await sql.unsafe(`
      create or replace function kinward_test.fail_mode_audit()
      returns trigger
      language plpgsql
      as $fn$
      begin
        if new.event_type = 'management_mode.changed'
           and new.next_state ->> 'mode_code' = 'delegated_management'
           and new.care_recipient_id = '${momId}'::uuid then
          raise exception 'forced_audit_failure';
        end if;
        return new;
      end;
      $fn$`);
    await sql`drop trigger if exists fail_mode_audit on public.audit_events`;
    await sql`
      create trigger fail_mode_audit
      before insert on public.audit_events
      for each row execute function kinward_test.fail_mode_audit()`;

    const before = await sql<{ active: string; rows: number }[]>`select
      (select mode_code from public.care_management_modes where care_recipient_id = ${momId} and status = 'active') active,
      (select count(*)::int from public.care_management_modes where care_recipient_id = ${momId}) rows`;

    const failed = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: momId,
      p_mode_code: "delegated_management",
      p_expected_version: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(failed.error).not.toBeNull();

    const after = await sql<
      { active: string; rows: number; audits: number }[]
    >`select
      (select mode_code from public.care_management_modes where care_recipient_id = ${momId} and status = 'active') active,
      (select count(*)::int from public.care_management_modes where care_recipient_id = ${momId}) rows,
      (select count(*)::int from public.audit_events where care_recipient_id = ${momId} and event_type = 'management_mode.changed' and next_state ->> 'mode_code' = 'delegated_management') audits`;
    expect(after[0].active).toBe(before[0].active);
    expect(after[0].rows).toBe(before[0].rows);
    expect(after[0].audits).toBe(0);

    await sql`drop trigger if exists fail_mode_audit on public.audit_events`;
    await sql`drop function if exists kinward_test.fail_mode_audit()`;

    const retry = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: momId,
      p_mode_code: "delegated_management",
      p_expected_version: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(retry.error).toBeNull();
  });
});
