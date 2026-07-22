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
  owner = await createSyntheticUser("slice9-owner");
  member = await createSyntheticUser("slice9-member");
  outsider = await createSyntheticUser("slice9-outsider");
  circleId = (await createCircle(owner.client, "Slice Nine Circle"))
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

describe("Slice 9 management grant security", () => {
  it("creates Shared grants idempotently and enforces AT-007 scope allow/deny", async () => {
    const key = crypto.randomUUID();
    const payload = {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_membership_id: membershipId,
      p_permission_codes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
      p_selection_mode: "selected",
      p_idempotency_key: key,
    };
    const [first, retry] = await Promise.all([
      owner.client.rpc("create_shared_management_grant", payload),
      owner.client.rpc("create_shared_management_grant", payload),
    ]);
    expect(first.error).toBeNull();
    expect(retry.error).toBeNull();
    expect(retry.data).toEqual(first.data);

    const allowed = await sql<
      { manage: boolean; review: boolean; ownership: boolean }[]
    >`
      select
        public.kinward_has_management_scope(${circleId}, ${dadId}, ${member.id}, 'recipient.manage_roles') manage,
        public.kinward_has_management_scope(${circleId}, ${dadId}, ${member.id}, 'recipient.review_permissions') review,
        public.kinward_has_management_scope(${circleId}, ${dadId}, ${member.id}, 'recipient.change_ownership') ownership`;
    expect(allowed[0]).toEqual({
      manage: true,
      review: true,
      ownership: false,
    });

    const momDenied = await sql<{ manage: boolean }[]>`
      select public.kinward_has_management_scope(${circleId}, ${momId}, ${member.id}, 'recipient.manage_roles') manage`;
    expect(momDenied[0].manage).toBe(false);

    const canManage = await member.client.rpc("can_manage_recipient_roles", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
    });
    expect(canManage.data).toBe(true);
    const canManageMom = await member.client.rpc("can_manage_recipient_roles", {
      p_circle_id: circleId,
      p_care_recipient_id: momId,
    });
    expect(canManageMom.data).toBe(false);

    const audits = await sql<{ created: number; scopes: number }[]>`
      select
        (select count(*)::int from public.audit_events where correlation_id = ${key} and event_type = 'shared_grant.created') created,
        (select count(*)::int from public.audit_events where correlation_id = ${key} and event_type = 'permission_scopes.recorded') scopes`;
    expect(audits[0]).toEqual({ created: 1, scopes: 1 });
  });

  it("persists Pending delegated grants with zero authority", async () => {
    const key = crypto.randomUUID();
    const result = await owner.client.rpc("create_pending_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: momId,
      p_membership_id: membershipId,
      p_permission_codes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
      p_selection_mode: "all_current",
      p_idempotency_key: key,
    });
    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      status: "pending",
      next_step: "duration",
    });
    const state = await sql<
      {
        pending: number;
        scopes: number;
        authority: boolean;
        activated: number;
        consents: number;
      }[]
    >`select
      (select count(*)::int from public.delegated_management_grants where care_recipient_id = ${momId} and status = 'pending') pending,
      (select count(*)::int from public.management_grant_scopes where care_recipient_id = ${momId} and grant_type = 'delegated' and status = 'active') scopes,
      public.kinward_has_management_scope(${circleId}, ${momId}, ${member.id}, 'recipient.manage_roles') authority,
      (select count(*)::int from public.audit_events where correlation_id = ${key} and event_type = 'delegation.activated') activated,
      (select count(*)::int from public.consent_records where care_recipient_id = ${momId} and consent_kind = 'delegated_management_grant') consents`;
    expect(state[0]).toEqual({
      pending: 1,
      scopes: 2,
      authority: false,
      activated: 0,
      consents: 0,
    });
  });

  it("denies non-owner, anonymous, outsider, ownership scope, and direct writes", async () => {
    const attempts = await Promise.all([
      member.client.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      anonymous.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      outsider.client.rpc("create_pending_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: momId,
        p_membership_id: membershipId,
        p_permission_codes: ["recipient.manage_roles"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_permission_codes: ["recipient.change_ownership"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("create_shared_management_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_permission_codes: ["*"],
        p_selection_mode: "selected",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);

    const insert = await owner.client.from("shared_management_grants").insert({
      circle_id: circleId,
      care_recipient_id: dadId,
      grantor_user_id: owner.id,
      grantee_membership_id: membershipId,
      selection_mode: "selected",
    });
    expect(insert.error).not.toBeNull();
  });

  it("stops recognizing Shared authority outside Shared Management mode", async () => {
    const before = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_management_scope(
        ${circleId}, ${dadId}, ${member.id}, 'recipient.manage_roles'
      ) allowed`;
    expect(before[0].allowed).toBe(true);

    const changed = await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_mode_code: "self_managed",
      p_expected_version: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(changed.error).toBeNull();

    const after = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_management_scope(
        ${circleId}, ${dadId}, ${member.id}, 'recipient.manage_roles'
      ) allowed`;
    expect(after[0].allowed).toBe(false);
  });
});
