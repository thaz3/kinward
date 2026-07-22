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
  circleId: string,
  dadId: string,
  momId: string,
  membershipId: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice8-owner");
  member = await createSyntheticUser("slice8-member");
  outsider = await createSyntheticUser("slice8-outsider");
  circleId = (await createCircle(owner.client, "Slice Eight Circle"))
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
        p_display_label: "Synthetic Dad",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  momId = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circleId,
        p_display_label: "Synthetic Mom",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  await owner.client.rpc("assign_recipient_role", {
    p_circle_id: circleId,
    p_care_recipient_id: dadId,
    p_membership_id: membershipId,
    p_role_code: "care_lead",
    p_idempotency_key: crypto.randomUUID(),
  });
});

describe("Slice 8 management mode security", () => {
  it("selects Self-Managed idempotently without removing non-management roles", async () => {
    const key = crypto.randomUUID();
    const [first, retry] = await Promise.all([
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: key,
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "self_managed",
        p_expected_version: 0,
        p_idempotency_key: key,
      }),
    ]);
    expect(first.error).toBeNull();
    expect(retry.error).toBeNull();
    expect(retry.data).toEqual(first.data);
    const state = await sql<
      {
        modes: number;
        active: number;
        audits: number;
        roles: number;
        allowed: boolean;
      }[]
    >`select
      (select count(*)::int from public.care_management_modes where care_recipient_id = ${dadId}) modes,
      (select count(*)::int from public.care_management_modes where care_recipient_id = ${dadId} and status = 'active' and mode_code = 'self_managed') active,
      (select count(*)::int from public.audit_events where correlation_id = ${key}) audits,
      (select count(*)::int from public.care_recipient_role_assignments where care_recipient_id = ${dadId} and membership_id = ${membershipId} and role_code = 'care_lead' and status = 'active') roles,
      public.kinward_has_recipient_permission(${circleId}, ${dadId}, ${member.id}, 'recipient.coordinate_practical_support') allowed`;
    expect(state[0]).toEqual({
      modes: 1,
      active: 1,
      audits: 1,
      roles: 1,
      allowed: true,
    });
  });

  it("denies non-owner, anonymous, outsider, unknown mode, and mismatched identifiers", async () => {
    const attempts = await Promise.all([
      member.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      anonymous.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      outsider.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "joint_owner",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: crypto.randomUUID(),
        p_care_recipient_id: dadId,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("select_care_management_mode", {
        p_circle_id: circleId,
        p_care_recipient_id: crypto.randomUUID(),
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);
  });

  it("denies every direct application mutation", async () => {
    const insert = await owner.client.from("care_management_modes").insert({
      circle_id: circleId,
      care_recipient_id: momId,
      mode_code: "self_managed",
      selected_by_user_id: owner.id,
    });
    const update = await owner.client
      .from("care_management_modes")
      .update({ mode_code: "delegated_management" })
      .eq("care_recipient_id", dadId);
    const remove = await owner.client
      .from("care_management_modes")
      .delete()
      .eq("care_recipient_id", dadId);
    expect(insert.error).not.toBeNull();
    expect(update.error).not.toBeNull();
    expect(remove.error).not.toBeNull();
  });

  it("keeps Dad and Mom modes isolated and never invents grants", async () => {
    const dadTransition = await owner.client.rpc(
      "select_care_management_mode",
      {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_mode_code: "shared_management",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      },
    );
    const momSelect = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: momId,
      p_mode_code: "delegated_management",
      p_expected_version: 0,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(dadTransition.error).toBeNull();
    expect(momSelect.error).toBeNull();
    const state = await sql<
      {
        dad_mode: string;
        mom_mode: string;
        dad_active: number;
        mom_active: number;
        grant_tables: number;
      }[]
    >`select
      (select mode_code from public.care_management_modes where care_recipient_id = ${dadId} and status = 'active') dad_mode,
      (select mode_code from public.care_management_modes where care_recipient_id = ${momId} and status = 'active') mom_mode,
      (select count(*)::int from public.care_management_modes where care_recipient_id = ${dadId} and status = 'active') dad_active,
      (select count(*)::int from public.care_management_modes where care_recipient_id = ${momId} and status = 'active') mom_active,
      (select count(*)::int from information_schema.tables where table_schema = 'public' and table_name in ('shared_management_grants', 'delegated_management_grants')) grant_tables`;
    expect(state[0]).toEqual({
      dad_mode: "shared_management",
      mom_mode: "delegated_management",
      dad_active: 1,
      mom_active: 1,
      grant_tables: 0,
    });
    const history = await sql<
      { superseded: number }[]
    >`select count(*)::int superseded from public.care_management_modes where care_recipient_id = ${dadId} and status = 'superseded'`;
    expect(history[0].superseded).toBe(1);
  });

  it("blocks mode changes during disputed hold and inactive membership", async () => {
    await sql`
      update public.care_recipients
      set status = 'disputed_hold',
          owner_user_id = null,
          ownership_acceptance_id = null,
          activated_at = null
      where id = ${momId}`;
    const disputed = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: momId,
      p_mode_code: "self_managed",
      p_expected_version: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(disputed.error).not.toBeNull();
    const acceptance = (
      await sql<{ id: string }[]>`
        select id from public.ownership_acceptance_records
        where care_recipient_id = ${momId}
        order by accepted_at desc limit 1`
    )[0];
    await sql`
      update public.care_recipients
      set status = 'active',
          owner_user_id = ${owner.id},
          ownership_acceptance_id = ${acceptance.id},
          activated_at = now()
      where id = ${momId}`;

    const backupHead = await createSyntheticUser("slice8-backup-head");
    const backupMembership = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${circleId}, ${backupHead.id}) returning id`
    )[0].id;
    await sql`
      insert into public.circle_role_assignments(
        circle_id, membership_id, role_code, assigned_by_user_id
      ) values (${circleId}, ${backupMembership}, 'circle_head', ${owner.id})`;
    await sql`
      update public.circle_memberships
      set status = 'suspended'
      where circle_id = ${circleId} and user_id = ${owner.id}`;
    const inactive = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_mode_code: "self_managed",
      p_expected_version: 2,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(inactive.error).not.toBeNull();
    await sql`
      update public.circle_memberships
      set status = 'active'
      where circle_id = ${circleId} and user_id = ${owner.id}`;
  });

  it("rejects stale expected versions", async () => {
    const stale = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_mode_code: "self_managed",
      p_expected_version: 0,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(stale.error?.message).toBe("stale_state");
  });
});
