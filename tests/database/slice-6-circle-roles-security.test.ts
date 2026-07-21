import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let head: SyntheticUser;
let coordinator: SyntheticUser;
let ordinary: SyntheticUser;
let outsiderHead: SyntheticUser;
let inactiveProfile: SyntheticUser;
let inactiveMember: SyntheticUser;
let lifecycleMember: SyntheticUser;
let circleId: string;
let otherCircleId: string;
let coordinatorMembership: string;
let ordinaryMembership: string;
let inactiveMembership: string;
let lifecycleMembership: string;

beforeAll(async () => {
  head = await createSyntheticUser("roles-head");
  coordinator = await createSyntheticUser("roles-coordinator");
  ordinary = await createSyntheticUser("roles-ordinary");
  outsiderHead = await createSyntheticUser("roles-other-head");
  inactiveProfile = await createSyntheticUser("roles-inactive-profile");
  inactiveMember = await createSyntheticUser("roles-inactive-member");
  lifecycleMember = await createSyntheticUser("roles-lifecycle-member");
  const circle = await createCircle(head.client, "Role Security Circle");
  const other = await createCircle(outsiderHead.client, "Other Role Circle");
  circleId = circle.data as string;
  otherCircleId = other.data as string;
  const memberships = await sql<{ id: string; user_id: string }[]>`
    insert into public.circle_memberships(circle_id, user_id)
    values (${circleId}, ${coordinator.id}), (${circleId}, ${ordinary.id}),
      (${circleId}, ${inactiveProfile.id}), (${circleId}, ${inactiveMember.id}),
      (${circleId}, ${lifecycleMember.id})
    returning id, user_id`;
  coordinatorMembership = memberships.find(
    (m) => m.user_id === coordinator.id,
  )!.id;
  ordinaryMembership = memberships.find((m) => m.user_id === ordinary.id)!.id;
  inactiveMembership = memberships.find(
    (m) => m.user_id === inactiveMember.id,
  )!.id;
  lifecycleMembership = memberships.find(
    (m) => m.user_id === lifecycleMember.id,
  )!.id;
  await sql`update public.user_profiles set account_status = 'disabled' where user_id = ${inactiveProfile.id}`;
  await sql`update public.circle_memberships set status = 'suspended' where id = ${inactiveMembership}`;
});

describe("Slice 6 governed Family Coordinator assignment", () => {
  it("allows only the exact-Circle Head and is idempotent", async () => {
    const key = crypto.randomUUID();
    const first = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: coordinatorMembership,
      p_idempotency_key: key,
    });
    const retry = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: coordinatorMembership,
      p_idempotency_key: key,
    });
    expect(first.error).toBeNull();
    expect(retry.data).toEqual(first.data);
    const rows = await sql<{ roles: number; audits: number }[]>`
      select
        (select count(*)::int from public.circle_role_assignments
          where circle_id = ${circleId} and membership_id = ${coordinatorMembership}
            and role_code = 'family_coordinator' and status = 'active') roles,
        (select count(*)::int from public.audit_events
          where circle_id = ${circleId} and event_type = 'circle_role.assigned'
            and target_id = ${(first.data as { assignment_id: string }).assignment_id}) audits`;
    expect(rows[0]).toEqual({ roles: 1, audits: 1 });
  });

  it("denies ordinary, Family Coordinator, anonymous, cross-Circle, and self-escalation", async () => {
    const attempts = await Promise.all([
      ordinary.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: ordinaryMembership,
        p_idempotency_key: crypto.randomUUID(),
      }),
      coordinator.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: ordinaryMembership,
        p_idempotency_key: crypto.randomUUID(),
      }),
      anonymous.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: ordinaryMembership,
        p_idempotency_key: crypto.randomUUID(),
      }),
      outsiderHead.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: ordinaryMembership,
        p_idempotency_key: crypto.randomUUID(),
      }),
      head.client.rpc("assign_family_coordinator", {
        p_circle_id: circleId,
        p_membership_id: (
          await sql<
            { id: string }[]
          >`select id from public.circle_memberships where circle_id = ${circleId} and user_id = ${head.id}`
        )[0].id,
        p_idempotency_key: crypto.randomUUID(),
      }),
      head.client.rpc("assign_family_coordinator", {
        p_circle_id: otherCircleId,
        p_membership_id: ordinaryMembership,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);
  });

  it("exposes no RPC that directly creates or promotes a Circle Head", async () => {
    const result = await head.client.rpc("assign_circle_head", {
      p_circle_id: circleId,
      p_membership_id: ordinaryMembership,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(result.error).not.toBeNull();
  });

  it("denies direct insert, update, and delete", async () => {
    const insert = await head.client.from("circle_role_assignments").insert({
      circle_id: circleId,
      membership_id: ordinaryMembership,
      role_code: "family_coordinator",
      assigned_by_user_id: head.id,
    });
    const update = await head.client
      .from("circle_role_assignments")
      .update({ status: "removed" })
      .eq("membership_id", coordinatorMembership);
    const remove = await head.client
      .from("circle_role_assignments")
      .delete()
      .eq("membership_id", coordinatorMembership);
    expect(insert.error).not.toBeNull();
    expect(update.error).not.toBeNull();
    expect(remove.error).not.toBeNull();
  });

  it("denies inactive profiles, inactive actors, and inactive targets", async () => {
    const inactiveProfileAttempt = await inactiveProfile.client.rpc(
      "list_circle_role_members",
      { p_circle_id: circleId },
    );
    const inactiveActorAttempt = await inactiveMember.client.rpc(
      "list_circle_role_members",
      { p_circle_id: circleId },
    );
    const inactiveTargetAttempt = await head.client.rpc(
      "assign_family_coordinator",
      {
        p_circle_id: circleId,
        p_membership_id: inactiveMembership,
        p_idempotency_key: crypto.randomUUID(),
      },
    );
    expect(inactiveProfileAttempt.error).not.toBeNull();
    expect(inactiveActorAttempt.error).not.toBeNull();
    expect(inactiveTargetAttempt.error).not.toBeNull();
  });

  it("suspends and removes Family Coordinator authority without changing membership", async () => {
    const assigned = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: lifecycleMembership,
      p_idempotency_key: crypto.randomUUID(),
    });
    const assignmentId = (assigned.data as { assignment_id: string })
      .assignment_id;
    const suspended = await head.client.rpc("transition_circle_role", {
      p_assignment_id: assignmentId,
      p_operation: "suspend",
      p_expected_version: 1,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect((suspended.data as { status: string }).status).toBe("suspended");
    const replacement = await head.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: lifecycleMembership,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(replacement.error).not.toBeNull();
    const rows = await sql<
      {
        membership_status: string;
        active_roles: number;
        historical_roles: number;
      }[]
    >`
      select membership.status membership_status,
        (select count(*)::int from public.circle_role_assignments
          where membership_id = membership.id and status = 'active') active_roles,
        (select count(*)::int from public.circle_role_assignments
          where membership_id = membership.id) historical_roles
      from public.circle_memberships membership where membership.id = ${lifecycleMembership}`;
    expect(rows[0]).toEqual({
      membership_status: "active",
      active_roles: 0,
      historical_roles: 1,
    });
  });
});

describe("Slice 6 role evaluation and privacy", () => {
  it("denies unknown permissions, inactive lifecycle, and cross-Circle union", async () => {
    const allowed = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_circle_permission(${circleId}, ${head.id}, 'circle.roles.manage_family_coordinator') allowed`;
    const unknown = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_circle_permission(${circleId}, ${head.id}, 'circle.roles.delete_circle') allowed`;
    const cross = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_circle_permission(${otherCircleId}, ${head.id}, 'circle.roles.manage_family_coordinator') allowed`;
    expect(allowed[0].allowed).toBe(true);
    expect(unknown[0].allowed).toBe(false);
    expect(cross[0].allowed).toBe(false);
  });

  it("applies an explicit exact-Circle restriction after the role union", async () => {
    const membership = await sql<{ id: string }[]>`
      select id from public.circle_memberships where circle_id = ${circleId} and user_id = ${head.id}`;
    const restriction = await sql<{ id: string }[]>`
      insert into public.circle_role_restrictions(circle_id, membership_id, permission_code)
      values (${circleId}, ${membership[0].id}, 'circle.roles.manage_family_coordinator')
      returning id`;
    const denied = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_circle_permission(${circleId}, ${head.id}, 'circle.roles.manage_family_coordinator') allowed`;
    const otherCircle = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_circle_permission(${otherCircleId}, ${outsiderHead.id}, 'circle.roles.manage_family_coordinator') allowed`;
    expect(denied[0].allowed).toBe(false);
    expect(otherCircle[0].allowed).toBe(true);
    await sql`update public.circle_role_restrictions set status = 'removed', removed_at = now() where id = ${restriction[0].id}`;
  });

  it("requires circle.roles.view and denies ordinary, cross-Circle, and inactive lifecycle visibility", async () => {
    const coordinatorList = await coordinator.client.rpc(
      "list_circle_role_members",
      { p_circle_id: circleId },
    );
    const ordinaryList = await ordinary.client.rpc("list_circle_role_members", {
      p_circle_id: circleId,
    });
    const outsiderList = await outsiderHead.client.rpc(
      "list_circle_role_members",
      {
        p_circle_id: circleId,
      },
    );
    expect(coordinatorList.error).toBeNull();
    expect((coordinatorList.data as unknown[]).length).toBeGreaterThan(0);
    expect(ordinaryList.error).not.toBeNull();
    expect(ordinaryList.data).toBeNull();
    expect(outsiderList.error).not.toBeNull();
    expect(outsiderList.data).toBeNull();

    await sql`update public.circle_role_assignments
      set status = 'suspended', ends_at = now()
      where circle_id = ${circleId} and membership_id = ${coordinatorMembership}
        and role_code = 'family_coordinator' and status = 'active'`;
    const suspended = await coordinator.client.rpc("list_circle_role_members", {
      p_circle_id: circleId,
    });
    expect(suspended.error).not.toBeNull();
    await sql`update public.circle_role_assignments
      set status = 'expired'
      where circle_id = ${circleId} and membership_id = ${coordinatorMembership}
        and role_code = 'family_coordinator' and status = 'suspended'`;
    const expired = await coordinator.client.rpc("list_circle_role_members", {
      p_circle_id: circleId,
    });
    expect(expired.error).not.toBeNull();
  });

  it("returns only a data-free boolean at the preauthorization boundary", async () => {
    const allowed = await head.client.rpc("can_view_circle_roles", {
      p_circle_id: circleId,
    });
    const denied = await ordinary.client.rpc("can_view_circle_roles", {
      p_circle_id: circleId,
    });
    expect(allowed).toMatchObject({ data: true, error: null });
    expect(denied).toMatchObject({ data: false, error: null });
  });
});
