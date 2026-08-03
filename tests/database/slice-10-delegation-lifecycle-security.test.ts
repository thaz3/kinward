import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

// Slice 10 delegated lifecycle security and behavior.
// Primary acceptance coverage: AT-008 delegated on-behalf-of action,
// AT-009 optional custom expiration, AT-010 suggested 90-calendar-day
// expiration, AT-011 "Until revoked" plus recurring review, AT-012 suspension,
// AT-013 revocation.

const ZONE = "America/New_York";
const UNTIL_REVOKED_CONSENT = "kinward.delegation_until_revoked_consent.v1";
const ACCEPTANCE_CONSENT = "kinward.delegation_acceptance.v1";
const ACTIVATION_CONSENT = "kinward.delegation_activation_consent.v1";

let owner: SyntheticUser,
  representative: SyntheticUser,
  helper: SyntheticUser,
  outsider: SyntheticUser,
  circleId: string,
  dadId: string,
  representativeMembershipId: string,
  helperMembershipId: string;

async function activeMembership(userId: string) {
  return (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${circleId}, ${userId}) returning id`
  )[0].id;
}

async function newDelegatedRecipient(label: string) {
  const recipientId = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circleId,
        p_display_label: label,
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
  const mode = await owner.client.rpc("select_care_management_mode", {
    p_circle_id: circleId,
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
        duration_mode: string | null;
        governing_time_zone: string | null;
        expiration_local_date: string | null;
        expires_at: string | null;
        next_review_at: string | null;
        activated_at: string | null;
        suspended_at: string | null;
        restored_at: string | null;
        revoked_at: string | null;
        expired_at: string | null;
        terms_fingerprint: string | null;
        representative_acceptance_id: string | null;
        activation_consent_id: string | null;
        until_revoked_consent_id: string | null;
        last_review_decision: string | null;
      }[]
    >`select status, version, duration_mode, governing_time_zone,
        expiration_local_date::text, expires_at, next_review_at, activated_at,
        suspended_at, restored_at, revoked_at, expired_at, terms_fingerprint,
        representative_acceptance_id, activation_consent_id,
        until_revoked_consent_id, last_review_decision
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
  const activated = await owner.client.rpc("activate_delegated_grant", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_terms_fingerprint: beforeActivation.terms_fingerprint,
    p_consent_version: ACTIVATION_CONSENT,
    p_expected_version: beforeActivation.version,
    p_idempotency_key: crypto.randomUUID(),
  });
  return activated;
}

async function delegatedAuthority(recipientId: string, userId: string) {
  return (
    await sql<{ manage: boolean; review: boolean }[]>`
      select
        public.kinward_has_management_scope(${circleId}, ${recipientId}, ${userId}, 'recipient.manage_roles') manage,
        public.kinward_has_management_scope(${circleId}, ${recipientId}, ${userId}, 'recipient.review_permissions') review`
  )[0];
}

beforeAll(async () => {
  owner = await createSyntheticUser("slice10-owner");
  representative = await createSyntheticUser("slice10-representative");
  helper = await createSyntheticUser("slice10-helper");
  outsider = await createSyntheticUser("slice10-outsider");
  circleId = (await createCircle(owner.client, "Slice Ten Circle"))
    .data as string;
  representativeMembershipId = await activeMembership(representative.id);
  helperMembershipId = await activeMembership(helper.id);
  const zone = await owner.client.rpc("set_family_circle_time_zone", {
    p_circle_id: circleId,
    p_time_zone: ZONE,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(zone.error).toBeNull();
  dadId = await newDelegatedRecipient("Synthetic Dad");
});

describe("Slice 10 delegation lifecycle security", () => {
  it("AT-010 stores the suggested ninety-calendar-day date only after review", async () => {
    const grantId = await pendingGrant(dadId);
    const suggested = await owner.client.rpc(
      "suggested_delegation_expiration_date",
      { p_circle_id: circleId },
    );
    expect(suggested.error).toBeNull();
    const expected = (
      await sql<{ local: string }[]>`
        select (public.kinward_local_date(now(), ${ZONE}) + 90)::text local`
    )[0].local;
    expect(suggested.data).toBe(expected);

    // Showing the suggestion commits nothing.
    expect((await grantRow(grantId)).duration_mode).toBeNull();

    const before = await grantRow(grantId);
    const stored = await owner.client.rpc("set_delegation_finite_expiration", {
      p_circle_id: circleId,
      p_care_recipient_id: dadId,
      p_grant_id: grantId,
      p_expiration_local_date: expected,
      p_expected_version: before.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(stored.error).toBeNull();

    const row = await grantRow(grantId);
    expect(row.status).toBe("pending");
    expect(row.duration_mode).toBe("finite");
    expect(row.governing_time_zone).toBe(ZONE);
    expect(row.expiration_local_date).toBe(expected);
    expect(row.activated_at).toBeNull();
    expect(row.next_review_at).toBeNull();

    // Ninety calendar days in the governing zone, never ninety times 24 hours.
    const boundary = await sql<{ exclusive: string; naive: string }[]>`
      select public.kinward_local_date_exclusive_end_utc(${expected}::date, ${ZONE})::text exclusive,
        (now() + interval '90 days')::text naive`;
    expect(row.expires_at).not.toBeNull();
    expect(new Date(row.expires_at!).toISOString()).toBe(
      new Date(boundary[0].exclusive).toISOString(),
    );

    const events = await sql<{ selected: number; activated: number }[]>`
      select
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegation.expiration_selected') selected,
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegation.activated') activated`;
    expect(events[0]).toEqual({ selected: 1, activated: 0 });
  });

  it("AT-009 accepts a custom future date and refuses today or the past", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Custom Date");
    const grantId = await pendingGrant(recipientId);
    const dates = (
      await sql<{ today: string; past: string; custom: string }[]>`
        select public.kinward_local_date(now(), ${ZONE})::text today,
          (public.kinward_local_date(now(), ${ZONE}) - 1)::text past,
          (public.kinward_local_date(now(), ${ZONE}) + 30)::text custom`
    )[0];
    const before = await grantRow(grantId);

    for (const invalid of [dates.today, dates.past]) {
      const refused = await owner.client.rpc(
        "set_delegation_finite_expiration",
        {
          p_circle_id: circleId,
          p_care_recipient_id: recipientId,
          p_grant_id: grantId,
          p_expiration_local_date: invalid,
          p_expected_version: before.version,
          p_idempotency_key: crypto.randomUUID(),
        },
      );
      expect(refused.error).not.toBeNull();
    }
    expect((await grantRow(grantId)).duration_mode).toBeNull();

    const custom = await owner.client.rpc("set_delegation_finite_expiration", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expiration_local_date: dates.custom,
      p_expected_version: before.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(custom.error).toBeNull();
    const row = await grantRow(grantId);
    expect(row.expiration_local_date).toBe(dates.custom);
    expect(row.duration_mode).toBe("finite");
  });

  it("AT-008 activates a finite delegation and audits the on-behalf-of action", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic On Behalf");
    const grantId = await pendingGrant(recipientId);
    const future = (
      await sql<{ custom: string }[]>`
        select (public.kinward_local_date(now(), ${ZONE}) + 45)::text custom`
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

    // A pending delegation carries no authority at all.
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: false,
      review: false,
    });

    const activated = await acceptAndActivate(recipientId, grantId);
    expect(activated.error).toBeNull();
    const row = await grantRow(grantId);
    expect(row.status).toBe("active");
    expect(row.next_review_at).not.toBeNull();
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: true,
      review: true,
    });

    const canManage = await representative.client.rpc(
      "can_manage_recipient_roles",
      { p_circle_id: circleId, p_care_recipient_id: recipientId },
    );
    expect(canManage.data).toBe(true);

    const assignmentKey = crypto.randomUUID();
    const assigned = await representative.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_membership_id: helperMembershipId,
      p_role_code: "care_lead",
      p_idempotency_key: assignmentKey,
    });
    expect(assigned.error).toBeNull();

    const provenance = await sql<
      {
        actor_user_id: string;
        on_behalf_of_user_id: string | null;
        delegated_grant_id: string | null;
        result: string;
      }[]
    >`select actor_user_id, on_behalf_of_user_id, delegated_grant_id, result
        from public.audit_events
        where correlation_id = ${assignmentKey}
          and event_type = 'recipient_role.assigned'`;
    expect(provenance).toHaveLength(1);
    expect(provenance[0].actor_user_id).toBe(representative.id);
    expect(provenance[0].on_behalf_of_user_id).toBe(owner.id);
    expect(provenance[0].delegated_grant_id).toBe(grantId);
    expect(provenance[0].result).toBe("succeeded");

    // The delegation creates no authority over an unrelated Care Recipient.
    expect(await delegatedAuthority(dadId, representative.id)).toEqual({
      manage: false,
      review: false,
    });
    // Never for the ownership scope, and never for an unrelated adult.
    const ownership = await sql<{ allowed: boolean }[]>`
      select public.kinward_has_management_scope(
        ${circleId}, ${recipientId}, ${representative.id}, 'recipient.change_ownership'
      ) allowed`;
    expect(ownership[0].allowed).toBe(false);
    expect(await delegatedAuthority(recipientId, helper.id)).toEqual({
      manage: false,
      review: false,
    });
    // The owner keeps their own access throughout.
    const ownerStillManages = await owner.client.rpc(
      "can_manage_recipient_roles",
      { p_circle_id: circleId, p_care_recipient_id: recipientId },
    );
    expect(ownerStillManages.data).toBe(true);
  });

  it("AT-011 records Until revoked consent and recurring ninety-day reviews", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Until Revoked");
    const grantId = await pendingGrant(recipientId);
    const pending = await grantRow(grantId);

    const wrongVersion = await owner.client.rpc(
      "set_delegation_until_revoked",
      {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_consent_version: "kinward.delegation_until_revoked_consent.v0",
        p_expected_version: pending.version,
        p_idempotency_key: crypto.randomUUID(),
      },
    );
    expect(wrongVersion.error).not.toBeNull();

    const chosen = await owner.client.rpc("set_delegation_until_revoked", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_consent_version: UNTIL_REVOKED_CONSENT,
      p_expected_version: pending.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(chosen.error).toBeNull();
    const chosenRow = await grantRow(grantId);
    expect(chosenRow.duration_mode).toBe("until_revoked");
    expect(chosenRow.expires_at).toBeNull();
    expect(chosenRow.until_revoked_consent_id).not.toBeNull();

    const activated = await acceptAndActivate(recipientId, grantId);
    expect(activated.error).toBeNull();
    const active = await grantRow(grantId);
    expect(active.status).toBe("active");
    expect(active.expires_at).toBeNull();

    const scheduled = await sql<{ expected: string }[]>`
      select public.kinward_add_calendar_days(
        (select activated_at from public.delegated_management_grants where id = ${grantId}),
        90, ${ZONE}
      )::text expected`;
    expect(new Date(active.next_review_at!).toISOString()).toBe(
      new Date(scheduled[0].expected).toISOString(),
    );

    // Make the review due, then confirm the due state removes no authority.
    await sql`update public.delegated_management_grants
      set next_review_at = now() - interval '1 day' where id = ${grantId}`;
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: true,
      review: true,
    });
    const due = await owner.client.rpc("get_delegated_grant_detail", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
    });
    expect(
      (due.data as { review_due: boolean; status: string }).review_due,
    ).toBe(true);
    expect((due.data as { status: string }).status).toBe("active");

    const beforeReview = await grantRow(grantId);
    const kept = await owner.client.rpc("complete_delegation_access_review", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_decision: "keep_access",
      p_expected_version: beforeReview.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(kept.error).toBeNull();
    const reviewed = await grantRow(grantId);
    expect(reviewed.status).toBe("active");
    expect(reviewed.last_review_decision).toBe("keep_access");
    expect(new Date(reviewed.next_review_at!).getTime()).toBeGreaterThan(
      Date.now(),
    );
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: true,
      review: true,
    });

    const reviewEvents = await sql<{ completed: number; scheduled: number }[]>`
      select
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegation.review_completed') completed,
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegation.review_scheduled') scheduled`;
    expect(reviewEvents[0]).toEqual({ completed: 1, scheduled: 2 });
  });

  it("AT-012 suspension denies the next delegated request and restoration returns it", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Suspension");
    const grantId = await pendingGrant(recipientId);
    const pending = await grantRow(grantId);
    await owner.client.rpc("set_delegation_until_revoked", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_consent_version: UNTIL_REVOKED_CONSENT,
      p_expected_version: pending.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect((await acceptAndActivate(recipientId, grantId)).error).toBeNull();

    // An unrelated Circle-wide role must stay independent of the delegation.
    const circleRole = await owner.client.rpc("assign_family_coordinator", {
      p_circle_id: circleId,
      p_membership_id: representativeMembershipId,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(circleRole.error).toBeNull();

    const active = await grantRow(grantId);
    const suspended = await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(suspended.error).toBeNull();
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: false,
      review: false,
    });
    const blocked = await representative.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_membership_id: helperMembershipId,
      p_role_code: "care_lead",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(blocked.error).not.toBeNull();

    const stillCoordinator = await sql<{ roles: number }[]>`
      select count(*)::int roles from public.circle_role_assignments
      where circle_id = ${circleId} and membership_id = ${representativeMembershipId}
        and role_code = 'family_coordinator' and status = 'active'`;
    expect(stillCoordinator[0].roles).toBe(1);

    const suspendedRow = await grantRow(grantId);
    expect(suspendedRow.status).toBe("suspended");
    expect(suspendedRow.suspended_at).not.toBeNull();

    const restored = await owner.client.rpc("restore_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: suspendedRow.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(restored.error).toBeNull();
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: true,
      review: true,
    });

    const events = await sql<{ suspended: number; invalidated: number }[]>`
      select
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegation.suspended') suspended,
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegated_sessions.invalidated') invalidated`;
    expect(events[0]).toEqual({ suspended: 1, invalidated: 1 });
  });

  it("AT-013 revocation is immediate, terminal, and idempotent", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Revocation");
    const grantId = await pendingGrant(recipientId);
    const pending = await grantRow(grantId);
    await owner.client.rpc("set_delegation_until_revoked", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_consent_version: UNTIL_REVOKED_CONSENT,
      p_expected_version: pending.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect((await acceptAndActivate(recipientId, grantId)).error).toBeNull();

    const active = await grantRow(grantId);
    const revoked = await owner.client.rpc("revoke_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(revoked.error).toBeNull();
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: false,
      review: false,
    });
    const denied = await representative.client.rpc("assign_recipient_role", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_membership_id: helperMembershipId,
      p_role_code: "care_lead",
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(denied.error).not.toBeNull();

    const revokedRow = await grantRow(grantId);
    expect(revokedRow.status).toBe("revoked");
    const restoreAttempt = await owner.client.rpc("restore_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: revokedRow.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(restoreAttempt.error).not.toBeNull();
    expect((await grantRow(grantId)).status).toBe("revoked");

    // A repeat revocation answers with the current state instead of failing.
    const repeat = await owner.client.rpc("revoke_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: revokedRow.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(repeat.error).toBeNull();
    expect(repeat.data).toMatchObject({
      status: "revoked",
      already_ended: true,
    });

    const history = await sql<
      {
        revoked: number;
        removed: number;
        scopes: number;
        assignments: number;
      }[]
    >`select
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegation.revoked') revoked,
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'permission_scopes.removed') removed,
        (select count(*)::int from public.management_grant_scopes
          where grant_type = 'delegated' and grant_id = ${grantId} and status = 'removed') scopes,
        (select count(*)::int from public.consent_records
          where care_recipient_id = ${recipientId}) assignments`;
    expect(history[0].revoked).toBe(1);
    expect(history[0].removed).toBe(1);
    expect(history[0].scopes).toBe(2);
    expect(history[0].assignments).toBeGreaterThan(0);
  });

  // UF-23: the account-level review-due placement agrees with the delegation
  // detail, is visible to the owner alone, and changes no lifecycle state.
  it("lists a due review for the owner only", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Review List");
    const grantId = await pendingGrant(recipientId);
    const pending = await grantRow(grantId);
    await owner.client.rpc("set_delegation_until_revoked", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_consent_version: UNTIL_REVOKED_CONSENT,
      p_expected_version: pending.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect((await acceptAndActivate(recipientId, grantId)).error).toBeNull();

    const beforeDue = await owner.client.rpc("list_delegation_reviews_due");
    expect(beforeDue.error).toBeNull();
    expect(
      (beforeDue.data as Array<{ grant_id: string }>).some(
        (row) => row.grant_id === grantId,
      ),
    ).toBe(false);

    await sql`update public.delegated_management_grants
      set next_review_at = now() - interval '1 hour' where id = ${grantId}`;

    const due = await owner.client.rpc("list_delegation_reviews_due");
    expect(due.error).toBeNull();
    const listed = (
      due.data as Array<{
        grant_id: string;
        care_recipient_label: string;
        representative_name: string;
        governing_time_zone: string;
      }>
    ).find((row) => row.grant_id === grantId);
    expect(listed?.care_recipient_label).toBe("Synthetic Review List");
    expect(listed?.governing_time_zone).toBe(ZONE);

    for (const other of [representative, helper, outsider]) {
      const hidden = await other.client.rpc("list_delegation_reviews_due");
      expect(
        ((hidden.data ?? []) as Array<{ grant_id: string }>).some(
          (row) => row.grant_id === grantId,
        ),
      ).toBe(false);
    }
    expect(await anonymous.rpc("list_delegation_reviews_due")).toMatchObject({
      error: expect.anything(),
    });

    // Reading the due list changes nothing about the delegation.
    expect((await grantRow(grantId)).status).toBe("active");
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: true,
      review: true,
    });

    // The representative sees only delegations naming them.
    const mine = await representative.client.rpc(
      "list_delegations_as_representative",
      { p_circle_id: circleId },
    );
    expect(mine.error).toBeNull();
    const rows = mine.data as Array<{ grant_id: string }>;
    expect(rows.some((row) => row.grant_id === grantId)).toBe(true);
    const notMine = await helper.client.rpc(
      "list_delegations_as_representative",
      { p_circle_id: circleId },
    );
    expect(
      (notMine.data as Array<{ grant_id: string }>).some(
        (row) => row.grant_id === grantId,
      ),
    ).toBe(false);
  });

  it("denies every unauthorized actor and forbids direct table writes", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Denials");
    const grantId = await pendingGrant(recipientId);
    const pending = await grantRow(grantId);
    const future = (
      await sql<{ custom: string }[]>`
        select (public.kinward_local_date(now(), ${ZONE}) + 10)::text custom`
    )[0].custom;

    const attempts = await Promise.all([
      anonymous.rpc("set_delegation_finite_expiration", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_expiration_local_date: future,
        p_expected_version: pending.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
      representative.client.rpc("set_delegation_finite_expiration", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_expiration_local_date: future,
        p_expected_version: pending.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
      outsider.client.rpc("get_delegated_grant_detail", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
      }),
      helper.client.rpc("accept_delegation_as_representative", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_terms_fingerprint: "0".repeat(64),
        p_consent_version: ACCEPTANCE_CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("suspend_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_expected_version: pending.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("activate_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_terms_fingerprint: "0".repeat(64),
        p_consent_version: ACTIVATION_CONSENT,
        p_expected_version: pending.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);
    expect((await grantRow(grantId)).status).toBe("pending");

    const directUpdate = await owner.client
      .from("delegated_management_grants")
      .update({ status: "active" })
      .eq("id", grantId);
    expect(directUpdate.error).not.toBeNull();
    const directState = await owner.client
      .from("account_authentication_state")
      .select("user_id");
    expect(directState.error).not.toBeNull();
    expect((await grantRow(grantId)).status).toBe("pending");
  });

  it("refuses activation until every closed precondition is satisfied", async () => {
    const recipientId = await newDelegatedRecipient("Synthetic Preconditions");
    const grantId = await pendingGrant(
      recipientId,
      representativeMembershipId,
      ["recipient.manage_roles"],
    );
    const pending = await grantRow(grantId);

    // No duration mode yet, so activation cannot even be attempted.
    const noDuration = await owner.client.rpc("activate_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: pending.terms_fingerprint ?? "0".repeat(64),
      p_consent_version: ACTIVATION_CONSENT,
      p_expected_version: pending.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(noDuration.error).not.toBeNull();

    await owner.client.rpc("set_delegation_until_revoked", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_consent_version: UNTIL_REVOKED_CONSENT,
      p_expected_version: pending.version,
      p_idempotency_key: crypto.randomUUID(),
    });

    // Duration chosen but the representative has not accepted.
    const withoutAcceptance = await grantRow(grantId);
    const noAcceptance = await owner.client.rpc("activate_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: withoutAcceptance.terms_fingerprint,
      p_consent_version: ACTIVATION_CONSENT,
      p_expected_version: withoutAcceptance.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(noAcceptance.error).not.toBeNull();
    expect((await grantRow(grantId)).status).toBe("pending");

    const accepted = await representative.client.rpc(
      "accept_delegation_as_representative",
      {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_terms_fingerprint: withoutAcceptance.terms_fingerprint,
        p_consent_version: ACCEPTANCE_CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      },
    );
    expect(accepted.error).toBeNull();

    // Changing the duration after acceptance invalidates that acceptance.
    const afterAcceptance = await grantRow(grantId);
    const future = (
      await sql<{ custom: string }[]>`
        select (public.kinward_local_date(now(), ${ZONE}) + 15)::text custom`
    )[0].custom;
    const changed = await owner.client.rpc("set_delegation_finite_expiration", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expiration_local_date: future,
      p_expected_version: afterAcceptance.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(changed.error).toBeNull();
    const invalidated = await grantRow(grantId);
    expect(invalidated.representative_acceptance_id).toBeNull();
    expect(invalidated.status).toBe("pending");
    expect(invalidated.terms_fingerprint).not.toBe(
      afterAcceptance.terms_fingerprint,
    );

    const staleActivation = await owner.client.rpc("activate_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: invalidated.terms_fingerprint,
      p_consent_version: ACTIVATION_CONSENT,
      p_expected_version: invalidated.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(staleActivation.error).not.toBeNull();

    const invalidationEvent = await sql<{ events: number }[]>`
      select count(*)::int events from public.audit_events
      where delegated_grant_id = ${grantId}
        and event_type = 'delegation.acceptance_invalidated'`;
    expect(invalidationEvent[0].events).toBe(1);

    // Re-accepting the current version then activates with exactly one scope.
    const reaccepted = await representative.client.rpc(
      "accept_delegation_as_representative",
      {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_terms_fingerprint: invalidated.terms_fingerprint,
        p_consent_version: ACCEPTANCE_CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      },
    );
    expect(reaccepted.error).toBeNull();
    const ready = await grantRow(grantId);
    const activated = await owner.client.rpc("activate_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: ready.terms_fingerprint,
      p_consent_version: ACTIVATION_CONSENT,
      p_expected_version: ready.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(activated.error).toBeNull();
    expect(await delegatedAuthority(recipientId, representative.id)).toEqual({
      manage: true,
      review: false,
    });
  });
});
