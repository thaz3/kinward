import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let owner: SyntheticUser;
let member: SyntheticUser;
let circleId: string;
let dadId: string;
let momId: string;
let membershipId: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice9-race-owner");
  member = await createSyntheticUser("slice9-race-member");
  circleId = (await createCircle(owner.client, "Slice Nine Race Circle"))
    .data as string;
  membershipId = (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${circleId}, ${member.id}) returning id`
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
  await owner.client.rpc("select_care_management_mode", {
    p_circle_id: circleId,
    p_care_recipient_id: dadId,
    p_mode_code: "shared_management",
    p_expected_version: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
  await owner.client.rpc("select_care_management_mode", {
    p_circle_id: circleId,
    p_care_recipient_id: momId,
    p_mode_code: "delegated_management",
    p_expected_version: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
});

afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

describe("Slice 9 concurrency and atomicity", () => {
  it("keeps Dad Shared and Mom Pending creations independent", async () => {
    const [shared, pending] = await Promise.all([
      owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("create_pending_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: momId,
        p_membership_id: membershipId,
        p_permission_codes: ["recipient.review_permissions"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(shared.error).toBeNull();
    expect(pending.error).toBeNull();
    const state = await sql<{ shared: number; pending: number }[]>`select
      (select count(*)::int from public.shared_management_grants where care_recipient_id = ${dadId} and status = 'active') shared,
      (select count(*)::int from public.delegated_management_grants where care_recipient_id = ${momId} and status = 'pending') pending`;
    expect(state[0]).toEqual({ shared: 1, pending: 1 });
  });

  it("settles duplicate shared-grant races with one active row", async () => {
    const other = await createSyntheticUser("slice9-race-other");
    const otherMembership = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${circleId}, ${other.id}) returning id`
    )[0].id;
    const [a, b] = await Promise.all([
      owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: otherMembership,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: otherMembership,
        p_permission_codes: ["recipient.review_permissions"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    const successes = [a, b].filter((result) => !result.error);
    const failures = [a, b].filter((result) => result.error);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    const rows = await sql<{ active: number }[]>`
      select count(*)::int active from public.shared_management_grants
      where care_recipient_id = ${dadId} and grantee_membership_id = ${otherMembership} and status = 'active'`;
    expect(rows[0].active).toBe(1);
  });

  it("membership deactivation racing grant creation leaves no usable authority", async () => {
    const target = await createSyntheticUser("slice9-race-target");
    const targetMembership = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${circleId}, ${target.id}) returning id`
    )[0].id;
    await Promise.all([
      owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: targetMembership,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      sql`update public.circle_memberships set status = 'suspended' where id = ${targetMembership}`,
    ]);
    const allowed = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_management_scope(
        ${circleId}, ${dadId}, ${target.id}, 'recipient.manage_roles'
      ) allowed`;
    expect(allowed[0].allowed).toBe(false);
  });

  it("rolls back shared grant creation when audit insert fails", async () => {
    const target = await createSyntheticUser("slice9-atomic-target");
    const targetMembership = (
      await sql<{ id: string }[]>`
        insert into public.circle_memberships(circle_id, user_id)
        values (${circleId}, ${target.id}) returning id`
    )[0].id;
    await sql`create schema if not exists kinward_test`;
    await sql.unsafe(`
      create or replace function kinward_test.fail_shared_audit()
      returns trigger language plpgsql as $fn$
      begin
        if new.event_type = 'shared_grant.created'
           and new.care_recipient_id = '${dadId}'::uuid then
          raise exception 'forced_shared_audit_failure';
        end if;
        return new;
      end;
      $fn$`);
    await sql`drop trigger if exists fail_shared_audit on public.audit_events`;
    await sql`
      create trigger fail_shared_audit
      before insert on public.audit_events
      for each row execute function kinward_test.fail_shared_audit()`;

    const key = crypto.randomUUID();
    const failed = await owner.client.rpc("create_shared_management_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_membership_id: targetMembership,
      p_permission_codes: ["recipient.manage_roles"],
      p_selection_mode: "selected",
      p_idempotency_key: key,
    });
    expect(failed.error).not.toBeNull();
    const state = await sql<
      { grants: number; scopes: number; audits: number }[]
    >`select
      (select count(*)::int from public.shared_management_grants where grantee_membership_id = ${targetMembership}) grants,
      (select count(*)::int from public.management_grant_scopes s join public.shared_management_grants g on g.id = s.grant_id where g.grantee_membership_id = ${targetMembership}) scopes,
      (select count(*)::int from public.audit_events where correlation_id = ${key}) audits`;
    expect(state[0]).toEqual({ grants: 0, scopes: 0, audits: 0 });

    await sql`drop trigger if exists fail_shared_audit on public.audit_events`;
    await sql`drop function if exists kinward_test.fail_shared_audit()`;

    const retry = await owner.client.rpc("create_shared_management_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_membership_id: targetMembership,
      p_permission_codes: ["recipient.manage_roles"],
      p_selection_mode: "selected",
      p_idempotency_key: key,
    });
    expect(retry.error).toBeNull();
  });
});
