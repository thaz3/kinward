import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let owner: SyntheticUser, member: SyntheticUser, outsider: SyntheticUser;
let circleId: string, dadId: string, momId: string, membershipId: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice7-owner");
  member = await createSyntheticUser("slice7-member");
  outsider = await createSyntheticUser("slice7-outsider");
  circleId = (await createCircle(owner.client, "Slice Seven Circle"))
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
});

describe("Slice 7 exact-recipient role security", () => {
  it("assigns idempotently and grants only the exact role permission", async () => {
    const key = crypto.randomUUID();
    const [first, retry] = await Promise.all([
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_role_code: "care_lead",
        p_idempotency_key: key,
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_role_code: "care_lead",
        p_idempotency_key: key,
      }),
    ]);
    expect(first.error).toBeNull();
    expect(retry.error).toBeNull();
    expect(retry.data).toEqual(first.data);
    const state = await sql<
      {
        dad: boolean;
        mom: boolean;
        unknown: boolean;
        roles: number;
        audits: number;
      }[]
    >`select
      public.kinward_has_recipient_permission(${circleId}, ${dadId}, ${member.id}, 'recipient.coordinate_practical_support') dad,
      public.kinward_has_recipient_permission(${circleId}, ${momId}, ${member.id}, 'recipient.coordinate_practical_support') mom,
      public.kinward_has_recipient_permission(${circleId}, ${dadId}, ${member.id}, 'recipient.unknown') unknown,
      (select count(*)::int from public.care_recipient_role_assignments where care_recipient_id = ${dadId} and membership_id = ${membershipId} and role_code = 'care_lead' and status = 'active') roles,
      (select count(*)::int from public.audit_events where correlation_id = ${key}) audits`;
    expect(state[0]).toEqual({
      dad: true,
      mom: false,
      unknown: false,
      roles: 1,
      audits: 1,
    });
  });

  it("denies non-owner, anonymous, cross-recipient owner, unknown role, and self assignment", async () => {
    const ownerMembership = (
      await sql<
        { id: string }[]
      >`select id from public.circle_memberships where circle_id = ${circleId} and user_id = ${owner.id}`
    )[0].id;
    const attempts = await Promise.all([
      member.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_role_code: "medical_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      anonymous.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_role_code: "medical_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      outsider.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_role_code: "medical_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: membershipId,
        p_role_code: "manager",
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("assign_recipient_role", {
        p_circle_id: circleId,
        p_care_recipient_id: dadId,
        p_membership_id: ownerMembership,
        p_role_code: "medical_lead",
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);
  });

  it("denies every direct application mutation", async () => {
    const insert = await owner.client
      .from("care_recipient_role_assignments")
      .insert({
        circle_id: circleId,
        care_recipient_id: dadId,
        membership_id: membershipId,
        role_code: "medical_lead",
        assigned_by_user_id: owner.id,
        changed_by_user_id: owner.id,
      });
    const update = await owner.client
      .from("care_recipient_role_assignments")
      .update({ status: "removed" })
      .eq("membership_id", membershipId);
    const remove = await owner.client
      .from("care_recipient_role_assignments")
      .delete()
      .eq("membership_id", membershipId);
    expect(insert.error).not.toBeNull();
    expect(update.error).not.toBeNull();
    expect(remove.error).not.toBeNull();
  });

  it("suspends authority without changing ownership, membership, or Circle roles", async () => {
    const assignment = await sql<
      { id: string; version: number }[]
    >`select id, version from public.care_recipient_role_assignments where care_recipient_id = ${dadId} and membership_id = ${membershipId} and role_code = 'care_lead' and status = 'active'`;
    const result = await owner.client.rpc("transition_recipient_role", {
      p_assignment_id: assignment[0].id,
      p_operation: "suspend",
      p_expected_version: assignment[0].version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(result.error).toBeNull();
    const state = await sql<
      { owner_id: string; membership_status: string; allowed: boolean }[]
    >`select recipient.owner_user_id owner_id, membership.status membership_status,
      public.kinward_has_recipient_permission(${circleId}, ${dadId}, ${member.id}, 'recipient.coordinate_practical_support') allowed
      from public.care_recipients recipient join public.circle_memberships membership on membership.id = ${membershipId} where recipient.id = ${dadId}`;
    expect(state[0]).toEqual({
      owner_id: owner.id,
      membership_status: "active",
      allowed: false,
    });
  });
});
