import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

const ZONE = "America/New_York";
const ACCEPTANCE_CONSENT = "kinward.delegation_acceptance.v1";
const ACTIVATION_CONSENT = "kinward.delegation_activation_consent.v1";

let owner: SyntheticUser,
  representative: SyntheticUser,
  helper: SyntheticUser,
  outsider: SyntheticUser,
  circleId: string,
  otherCircleId: string,
  representativeMembershipId: string,
  helperMembershipId: string;

async function activeMembership(
  userId: string,
  targetCircleId = circleId,
) {
  return (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${targetCircleId}, ${userId}) returning id`
  )[0].id;
}

async function newDelegatedRecipient(label: string, targetCircleId = circleId) {
  const recipientId = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: targetCircleId,
        p_display_label: label,
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  const mode = await owner.client.rpc("select_care_management_mode", {
    p_circle_id: targetCircleId,
    p_care_recipient_id: recipientId,
    p_mode_code: "delegated_management",
    p_expected_version: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(mode.error).toBeNull();
  return recipientId;
}

async function pendingGrant(
  recipientId: string,
  membershipId = representativeMembershipId,
  codes = ["recipient.manage_roles", "recipient.review_permissions"],
) {
  const created = await owner.client.rpc("create_pending_delegated_grant", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_membership_id: membershipId,
    p_permission_codes: codes,
    p_selection_mode: "selected",
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(created.error).toBeNull();
  return (created.data as { grant_id: string }).grant_id;
}

async function grantRow(grantId: string) {
  return (
    await sql<
      {
        status: string;
        version: number;
        expires_at: string | null;
        terms_fingerprint: string | null;
      }[]
    >`select status, version, expires_at, terms_fingerprint
      from public.delegated_management_grants where id = ${grantId}`
  )[0];
}

async function acceptAndActivate(recipientId: string, grantId: string) {
  const beforeAcceptance = await grantRow(grantId);
  const accepted = await representative.client.rpc(
    "accept_delegation_as_representative",
    {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: beforeAcceptance.terms_fingerprint,
      p_consent_version: ACCEPTANCE_CONSENT,
      p_idempotency_key: crypto.randomUUID(),
    },
  );
  expect(accepted.error).toBeNull();
  const beforeActivation = await grantRow(grantId);
  return owner.client.rpc("activate_delegated_grant", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_terms_fingerprint: beforeActivation.terms_fingerprint,
    p_consent_version: ACTIVATION_CONSENT,
    p_expected_version: beforeActivation.version,
    p_idempotency_key: crypto.randomUUID(),
  });
}

async function activateWithFiniteExpiration(
  recipientId: string,
  grantId: string,
) {
  const future = (
    await sql<{ custom: string }[]>`
      select (public.kinward_local_date(now(), ${ZONE}) + 30)::text custom`
  )[0].custom;
  const pending = await grantRow(grantId);
  await owner.client.rpc("set_delegation_finite_expiration", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_expiration_local_date: future,
    p_expected_version: pending.version,
    p_idempotency_key: crypto.randomUUID(),
  });
  return acceptAndActivate(recipientId, grantId);
}

async function listAccessible(client: SyntheticUser["client"]) {
  return client.rpc("list_accessible_care_recipient_contexts", {
    p_circle_id: circleId,
  });
}

async function getAccessible(
  client: SyntheticUser["client"],
  recipientId: string,
) {
  return client.rpc("get_accessible_care_recipient", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
  });
}

beforeAll(async () => {
  owner = await createSyntheticUser("slice10-repair-owner");
  representative = await createSyntheticUser("slice10-repair-rep");
  helper = await createSyntheticUser("slice10-repair-helper");
  outsider = await createSyntheticUser("slice10-repair-outsider");
  circleId = (await createCircle(owner.client, "Repair Circle")).data as string;
  otherCircleId = (await createCircle(owner.client, "Other Circle")).data as string;
  representativeMembershipId = await activeMembership(representative.id);
  helperMembershipId = await activeMembership(helper.id);
  const zone = await owner.client.rpc("set_family_circle_time_zone", {
    p_circle_id: circleId,
    p_time_zone: ZONE,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(zone.error).toBeNull();
});

describe("Slice 10 manual QA repair — accessible contexts", () => {
  it("never lists a pending delegation in the switcher", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Pending Switch");
    const grantId = await pendingGrant(recipientId);
    expect((await grantRow(grantId)).status).toBe("pending");

    const listed = await listAccessible(representative.client);
    expect(listed.error).toBeNull();
    const rows = listed.data as Array<{ care_recipient_id: string }>;
    expect(rows.some((row) => row.care_recipient_id === recipientId)).toBe(
      false,
    );
    expect((await getAccessible(representative.client, recipientId)).data).toMatchObject({
      outcome: "unavailable",
    });
  });

  it("lists an active delegated recipient only to its representative", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Active Switch");
    const grantId = await pendingGrant(recipientId);
    expect((await activateWithFiniteExpiration(recipientId, grantId)).error).toBeNull();

    const repListed = await listAccessible(representative.client);
    expect(repListed.error).toBeNull();
    const repRow = (
      repListed.data as Array<{
        care_recipient_id: string;
        access_kind: string;
        permission_codes: string[];
        delegated_grant_id: string;
      }>
    ).find((row) => row.care_recipient_id === recipientId);
    expect(repRow).toMatchObject({
      access_kind: "delegated",
      permission_codes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
      delegated_grant_id: grantId,
    });

    for (const other of [helper, outsider]) {
      const hidden = await listAccessible(other.client);
      if (other === outsider) {
        expect(hidden.error).not.toBeNull();
      } else {
        expect(hidden.error).toBeNull();
        expect(
          ((hidden.data ?? []) as Array<{ care_recipient_id: string }>).some(
            (row) => row.care_recipient_id === recipientId,
          ),
        ).toBe(false);
      }
      expect((await getAccessible(other.client, recipientId)).data).toMatchObject({
        outcome: "unavailable",
      });
    }
  });

  it("removes suspended, expired, and revoked delegations from the switcher immediately", async () => {
    const suspendedRecipient = await newDelegatedRecipient("Synthetic Suspended");
    const suspendedGrant = await pendingGrant(suspendedRecipient);
    expect(
      (await activateWithFiniteExpiration(suspendedRecipient, suspendedGrant))
        .error,
    ).toBeNull();
    const activeSuspended = await grantRow(suspendedGrant);
    await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: suspendedRecipient,
      p_grant_id: suspendedGrant,
      p_expected_version: activeSuspended.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(
      (
        (await listAccessible(representative.client)).data as Array<{
          care_recipient_id: string;
        }>
      ).some((row) => row.care_recipient_id === suspendedRecipient),
    ).toBe(false);

    const revokedRecipient = await newDelegatedRecipient("Synthetic Revoked Switch");
    const revokedGrant = await pendingGrant(revokedRecipient);
    expect(
      (await activateWithFiniteExpiration(revokedRecipient, revokedGrant)).error,
    ).toBeNull();
    const activeRevoked = await grantRow(revokedGrant);
    await owner.client.rpc("revoke_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: revokedRecipient,
      p_grant_id: revokedGrant,
      p_expected_version: activeRevoked.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(
      (
        (await listAccessible(representative.client)).data as Array<{
          care_recipient_id: string;
        }>
      ).some((row) => row.care_recipient_id === revokedRecipient),
    ).toBe(false);

    const expiredRecipient = await newDelegatedRecipient("Synthetic Expired Switch");
    const expiredGrant = await pendingGrant(expiredRecipient);
    expect(
      (await activateWithFiniteExpiration(expiredRecipient, expiredGrant)).error,
    ).toBeNull();
    await sql`update public.delegated_management_grants
      set expires_at = now() - interval '1 minute'
      where id = ${expiredGrant}`;
    const listed = await listAccessible(representative.client);
    expect(listed.error, JSON.stringify(listed.error)).toBeNull();
    expect(
      (
        (listed.data ?? []) as Array<{
          care_recipient_id: string;
        }>
      ).some((row) => row.care_recipient_id === expiredRecipient),
    ).toBe(false);
    expect((await grantRow(expiredGrant)).status).toBe("expired");
  });

  it("denies unrelated Circles and Care Recipients", async () => {
    const otherRecipient = await newDelegatedRecipient(
      "Synthetic Other Circle",
      otherCircleId,
    );
    const deniedCircle = await representative.client.rpc(
      "list_accessible_care_recipient_contexts",
      { p_circle_id: otherCircleId },
    );
    expect(deniedCircle.error).not.toBeNull();
    expect(
      (await getAccessible(representative.client, otherRecipient)).data,
    ).toMatchObject({ outcome: "unavailable" });
    expect(await anonymous.rpc("list_accessible_care_recipient_contexts", {
      p_circle_id: circleId,
    })).toMatchObject({ error: expect.anything() });
  });

  it("enforces Manage roles and Review permissions independently", async () => {
    const reviewRecipient = await newDelegatedRecipient("Synthetic Review Only");
    const reviewGrant = await pendingGrant(reviewRecipient, representativeMembershipId, [
      "recipient.review_permissions",
    ]);
    expect(
      (await activateWithFiniteExpiration(reviewRecipient, reviewGrant)).error,
    ).toBeNull();

    const reviewContext = await getAccessible(
      representative.client,
      reviewRecipient,
    );
    expect(reviewContext.data).toMatchObject({
      outcome: "ready",
      access_kind: "delegated",
      permission_codes: ["recipient.review_permissions"],
    });

    const canReview = await representative.client.rpc(
      "can_review_recipient_permissions",
      { p_circle_id: circleId, p_care_recipient_id: reviewRecipient },
    );
    const canManage = await representative.client.rpc(
      "can_manage_recipient_roles",
      { p_circle_id: circleId, p_care_recipient_id: reviewRecipient },
    );
    expect(canReview.data).toBe(true);
    expect(canManage.data).toBe(false);

    const listed = await representative.client.rpc("list_recipient_role_members", {
      p_circle_id: circleId,
      p_care_recipient_id: reviewRecipient,
    });
    expect(listed.error).toBeNull();

    const blockedAssign = await representative.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: reviewRecipient,
      p_membership_id: helperMembershipId,
      p_role_code: "care_lead",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(blockedAssign.error).not.toBeNull();

    const manageRecipient = await newDelegatedRecipient("Synthetic Manage Only");
    const manageGrant = await pendingGrant(manageRecipient, representativeMembershipId, [
      "recipient.manage_roles",
    ]);
    expect(
      (await activateWithFiniteExpiration(manageRecipient, manageGrant)).error,
    ).toBeNull();
    expect(
      await representative.client.rpc("can_manage_recipient_roles", {
        p_circle_id: circleId,
        p_care_recipient_id: manageRecipient,
      }),
    ).toMatchObject({ data: true });
  });

  it("shows revoked historical scopes without re-authorizing them", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Historical");
    const grantId = await pendingGrant(recipientId);
    expect(
      (await activateWithFiniteExpiration(recipientId, grantId)).error,
    ).toBeNull();
    const active = await grantRow(grantId);
    await owner.client.rpc("revoke_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: crypto.randomUUID(),
    });

    const detail = await owner.client.rpc("get_delegated_grant_detail", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
    });
    expect(detail.error).toBeNull();
    expect(detail.data).toMatchObject({
      status: "revoked",
      scope_snapshot_kind: "historical",
      permission_codes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
    });

    expect((await getAccessible(representative.client, recipientId)).data).toMatchObject({
      outcome: "unavailable",
    });
    expect(
      (
        await sql<{ manage: boolean; review: boolean }[]>`
          select
            public.kinward_has_management_scope(${circleId}, ${recipientId}, ${representative.id}, 'recipient.manage_roles') manage,
            public.kinward_has_management_scope(${circleId}, ${recipientId}, ${representative.id}, 'recipient.review_permissions') review`
      )[0],
    ).toEqual({ manage: false, review: false });

    const activeScopes = await sql<{ count: number }[]>`
      select count(*)::int count from public.management_grant_scopes
      where grant_type = 'delegated' and grant_id = ${grantId} and status = 'active'`;
    expect(activeScopes[0].count).toBe(0);
  });

  it("leaves owner access unchanged", async () => {
    const ownedId = await newDelegatedRecipient("Synthetic Owner Context");
    const ownedListed = await listAccessible(owner.client);
    expect(ownedListed.error).toBeNull();
    const ownerRow = (
      ownedListed.data as Array<{
        care_recipient_id: string;
        access_kind: string;
        permission_codes: string[];
      }>
    ).find((row) => row.care_recipient_id === ownedId);
    expect(ownerRow).toMatchObject({
      access_kind: "owner",
      permission_codes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
    });

    const ownedDetail = await getAccessible(owner.client, ownedId);
    expect(ownedDetail.data).toMatchObject({
      outcome: "ready",
      access_kind: "owner",
      permission_codes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
    });

    const legacyOwned = await owner.client.rpc("get_owned_care_recipient", {
      p_circle_id: circleId,
      p_care_recipient_id: ownedId,
    });
    expect(legacyOwned.data).toMatchObject({ outcome: "ready" });
  });

  it("handles repeated requests and lifecycle transitions race-safely", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Race");
    const grantId = await pendingGrant(recipientId);
    expect(
      (await activateWithFiniteExpiration(recipientId, grantId)).error,
    ).toBeNull();

    const parallelVisible = await Promise.all(
      Array.from({ length: 5 }, () =>
        getAccessible(representative.client, recipientId),
      ),
    );
    expect(
      parallelVisible.every(
        (result) =>
          !result.error &&
          (result.data as { outcome: string }).outcome === "ready",
      ),
    ).toBe(true);

    const active = await grantRow(grantId);
    await owner.client.rpc("revoke_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: crypto.randomUUID(),
    });

    const parallelDenied = await Promise.all([
      ...Array.from({ length: 5 }, () =>
        getAccessible(representative.client, recipientId),
      ),
      ...Array.from({ length: 5 }, () =>
        listAccessible(representative.client),
      ),
    ]);
    for (const result of parallelDenied.slice(0, 5)) {
      expect(result.data).toMatchObject({ outcome: "unavailable" });
    }
    for (const result of parallelDenied.slice(5)) {
      expect(result.error).toBeNull();
      expect(
        ((result.data ?? []) as Array<{ care_recipient_id: string }>).some(
          (row) => row.care_recipient_id === recipientId,
        ),
      ).toBe(false);
    }

    const repeatRevoke = await owner.client.rpc("revoke_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: (await grantRow(grantId)).version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(repeatRevoke.error).toBeNull();
    expect(repeatRevoke.data).toMatchObject({
      status: "revoked",
      already_ended: true,
    });
  });

  it("lets a Manage roles representative mutate with on-behalf-of provenance", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Manage Mutate");
    const grantId = await pendingGrant(recipientId, representativeMembershipId, [
      "recipient.manage_roles",
    ]);
    expect(
      (await activateWithFiniteExpiration(recipientId, grantId)).error,
    ).toBeNull();

    expect(
      (
        await representative.client.rpc("can_manage_recipient_roles", {
          p_circle_id: circleId,
          p_care_recipient_id: recipientId,
        })
      ).data,
    ).toBe(true);
    expect(
      (await getAccessible(representative.client, recipientId)).data,
    ).toMatchObject({
      outcome: "ready",
      access_kind: "delegated",
      permission_codes: ["recipient.manage_roles"],
    });

    const assigned = await representative.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_membership_id: helperMembershipId,
      p_role_code: "care_lead",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(assigned.error).toBeNull();
    const assignmentId = (assigned.data as { assignment_id: string })
      .assignment_id;

    const assignAudit = await sql<
      {
        actor_user_id: string;
        on_behalf_of_user_id: string | null;
        delegated_grant_id: string | null;
      }[]
    >`select actor_user_id, on_behalf_of_user_id, delegated_grant_id
      from public.audit_events
      where care_recipient_id = ${recipientId}
        and event_type = 'recipient_role.assigned'
        and target_id = ${assignmentId}`;
    expect(assignAudit[0]).toMatchObject({
      actor_user_id: representative.id,
      on_behalf_of_user_id: owner.id,
      delegated_grant_id: grantId,
    });

    const suspended = await representative.client.rpc(
      "transition_recipient_role",
      {
        p_assignment_id: assignmentId,
        p_operation: "suspend",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      },
    );
    expect(suspended.error).toBeNull();
    const suspendAudit = await sql<
      {
        on_behalf_of_user_id: string | null;
        delegated_grant_id: string | null;
      }[]
    >`select on_behalf_of_user_id, delegated_grant_id
      from public.audit_events
      where target_id = ${assignmentId}
        and event_type = 'recipient_role.suspended'`;
    expect(suspendAudit[0]).toMatchObject({
      on_behalf_of_user_id: owner.id,
      delegated_grant_id: grantId,
    });
  });

  it("blocks Review-only representatives from manage mutations", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Review Block");
    const grantId = await pendingGrant(recipientId, representativeMembershipId, [
      "recipient.review_permissions",
    ]);
    expect(
      (await activateWithFiniteExpiration(recipientId, grantId)).error,
    ).toBeNull();

    expect(
      (
        await representative.client.rpc("can_manage_recipient_roles", {
          p_circle_id: circleId,
          p_care_recipient_id: recipientId,
        })
      ).data,
    ).toBe(false);
    expect(
      (
        await representative.client.rpc("can_review_recipient_permissions", {
          p_circle_id: circleId,
          p_care_recipient_id: recipientId,
        })
      ).data,
    ).toBe(true);

    const listed = await representative.client.rpc("list_recipient_role_members", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
    });
    expect(listed.error).toBeNull();

    const denied = await representative.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_membership_id: helperMembershipId,
      p_role_code: "care_lead",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(denied.error).not.toBeNull();
  });

  it("blocks manage mutations immediately after suspend, revoke, or expiration", async () => {
    const suspendedRecipient = await newDelegatedRecipient(
      "Synthetic Mutate Suspend",
    );
    const suspendedGrant = await pendingGrant(suspendedRecipient);
    expect(
      (await activateWithFiniteExpiration(suspendedRecipient, suspendedGrant))
        .error,
    ).toBeNull();
    const activeSuspended = await grantRow(suspendedGrant);
    await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: suspendedRecipient,
      p_grant_id: suspendedGrant,
      p_expected_version: activeSuspended.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(
      (
        await getAccessible(representative.client, suspendedRecipient)
      ).data,
    ).toMatchObject({ outcome: "unavailable" });
    expect(
      (
        await representative.client.rpc("can_manage_recipient_roles", {
          p_circle_id: circleId,
          p_care_recipient_id: suspendedRecipient,
        })
      ).data,
    ).toBe(false);
    expect(
      (
        await representative.client.rpc("assign_recipient_role", {
          p_circle_id: circleId,
          p_care_recipient_id: suspendedRecipient,
          p_membership_id: helperMembershipId,
          p_role_code: "care_lead",
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).not.toBeNull();

    const revokedRecipient = await newDelegatedRecipient(
      "Synthetic Mutate Revoke",
    );
    const revokedGrant = await pendingGrant(revokedRecipient);
    expect(
      (await activateWithFiniteExpiration(revokedRecipient, revokedGrant)).error,
    ).toBeNull();
    const activeRevoked = await grantRow(revokedGrant);
    await owner.client.rpc("revoke_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: revokedRecipient,
      p_grant_id: revokedGrant,
      p_expected_version: activeRevoked.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(
      (await getAccessible(representative.client, revokedRecipient)).data,
    ).toMatchObject({ outcome: "unavailable" });
    expect(
      (
        await representative.client.rpc("assign_recipient_role", {
          p_circle_id: circleId,
          p_care_recipient_id: revokedRecipient,
          p_membership_id: helperMembershipId,
          p_role_code: "care_lead",
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).not.toBeNull();

    const expiredRecipient = await newDelegatedRecipient(
      "Synthetic Mutate Expire",
    );
    const expiredGrant = await pendingGrant(expiredRecipient);
    expect(
      (await activateWithFiniteExpiration(expiredRecipient, expiredGrant)).error,
    ).toBeNull();
    await sql`update public.delegated_management_grants
      set expires_at = now() - interval '1 minute'
      where id = ${expiredGrant}`;
    expect(
      (await getAccessible(representative.client, expiredRecipient)).data,
    ).toMatchObject({ outcome: "unavailable" });
    expect(
      (
        await representative.client.rpc("assign_recipient_role", {
          p_circle_id: circleId,
          p_care_recipient_id: expiredRecipient,
          p_membership_id: helperMembershipId,
          p_role_code: "care_lead",
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).not.toBeNull();
  });

  it("denies pending grants and unrelated recipients from manage mutations", async () => {
    const pendingRecipient = await newDelegatedRecipient(
      "Synthetic Mutate Pending",
    );
    await pendingGrant(pendingRecipient);
    expect(
      (
        await representative.client.rpc("assign_recipient_role", {
          p_circle_id: circleId,
          p_care_recipient_id: pendingRecipient,
          p_membership_id: helperMembershipId,
          p_role_code: "care_lead",
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).not.toBeNull();

    const otherRecipient = await newDelegatedRecipient(
      "Synthetic Mutate Other",
      otherCircleId,
    );
    expect(
      (
        await representative.client.rpc("assign_recipient_role", {
          p_circle_id: otherCircleId,
          p_care_recipient_id: otherRecipient,
          p_membership_id: helperMembershipId,
          p_role_code: "care_lead",
          p_idempotency_key: crypto.randomUUID(),
        })
      ).error,
    ).not.toBeNull();
  });
});
