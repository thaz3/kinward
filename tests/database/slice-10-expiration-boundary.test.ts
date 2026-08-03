import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

// Slice 10 expiration boundary behavior under a fixed governing zone and
// deterministic clocks. Supports AT-009 and AT-010 (a finite expiration is a
// local calendar date whose UTC boundary is exclusive) and AT-013 (an ended
// grant can never return to Active).

const ZONE = "America/New_York";
const UNTIL_REVOKED_CONSENT = "kinward.delegation_until_revoked_consent.v1";
const ACCEPTANCE_CONSENT = "kinward.delegation_acceptance.v1";
const ACTIVATION_CONSENT = "kinward.delegation_activation_consent.v1";

let owner: SyntheticUser,
  representative: SyntheticUser,
  circleId: string,
  membershipId: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice10-expiry-owner");
  representative = await createSyntheticUser("slice10-expiry-representative");
  circleId = (await createCircle(owner.client, "Slice Ten Expiry Circle"))
    .data as string;
  membershipId = (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${circleId}, ${representative.id}) returning id`
  )[0].id;
  const zone = await owner.client.rpc("set_family_circle_time_zone", {
    p_circle_id: circleId,
    p_time_zone: ZONE,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(zone.error).toBeNull();
});

async function activeGrant(label: string) {
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
  await owner.client.rpc("select_care_management_mode", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_mode_code: "delegated_management",
    p_expected_version: 0,
    p_idempotency_key: crypto.randomUUID(),
  });
  const grantId = (
    (
      await owner.client.rpc("create_pending_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_membership_id: membershipId,
        p_permission_codes: [
          "recipient.manage_roles",
          "recipient.review_permissions",
        ],
        p_selection_mode: "all_current",
        p_idempotency_key: crypto.randomUUID(),
      })
    ).data as { grant_id: string }
  ).grant_id;
  const future = (
    await sql<{ date: string }[]>`
      select (public.kinward_local_date(now(), ${ZONE}) + 60)::text date`
  )[0].date;
  const pending = await state(grantId);
  const duration = await owner.client.rpc("set_delegation_finite_expiration", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_expiration_local_date: future,
    p_expected_version: pending.version,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(duration.error).toBeNull();
  const withDuration = await state(grantId);
  const accepted = await representative.client.rpc(
    "accept_delegation_as_representative",
    {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: withDuration.terms_fingerprint,
      p_consent_version: ACCEPTANCE_CONSENT,
      p_idempotency_key: crypto.randomUUID(),
    },
  );
  expect(accepted.error).toBeNull();
  const ready = await state(grantId);
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
  return { recipientId, grantId };
}

async function state(grantId: string) {
  return (
    await sql<
      {
        status: string;
        version: number;
        terms_fingerprint: string | null;
        expires_at: string | null;
      }[]
    >`select status, version::int, terms_fingerprint, expires_at
        from public.delegated_management_grants where id = ${grantId}`
  )[0];
}

async function allowed(recipientId: string) {
  return (
    await sql<{ manage: boolean }[]>`
      select public.kinward_has_management_scope(
        ${circleId}, ${recipientId}, ${representative.id}, 'recipient.manage_roles'
      ) manage`
  )[0].manage;
}

describe("Slice 10 expiration boundary", () => {
  it("computes deterministic exclusive UTC boundaries across DST changes", async () => {
    const rows = await sql<
      {
        winter: string;
        summer: string;
        before_fall_back: string;
        before_spring_forward: string;
        pacific: string;
        kolkata: string;
      }[]
    >`select
        public.kinward_local_date_exclusive_end_utc('2026-01-15'::date, 'America/New_York')::text winter,
        public.kinward_local_date_exclusive_end_utc('2026-07-15'::date, 'America/New_York')::text summer,
        public.kinward_local_date_exclusive_end_utc('2026-11-01'::date, 'America/New_York')::text before_fall_back,
        public.kinward_local_date_exclusive_end_utc('2026-03-07'::date, 'America/New_York')::text before_spring_forward,
        public.kinward_local_date_exclusive_end_utc('2026-01-15'::date, 'America/Los_Angeles')::text pacific,
        public.kinward_local_date_exclusive_end_utc('2026-01-15'::date, 'Asia/Kolkata')::text kolkata`;
    const boundaries = rows[0];
    expect(new Date(boundaries.winter).toISOString()).toBe(
      "2026-01-16T05:00:00.000Z",
    );
    expect(new Date(boundaries.summer).toISOString()).toBe(
      "2026-07-16T04:00:00.000Z",
    );
    expect(new Date(boundaries.before_fall_back).toISOString()).toBe(
      "2026-11-02T05:00:00.000Z",
    );
    expect(new Date(boundaries.before_spring_forward).toISOString()).toBe(
      "2026-03-08T05:00:00.000Z",
    );
    expect(new Date(boundaries.pacific).toISOString()).toBe(
      "2026-01-16T08:00:00.000Z",
    );
    expect(new Date(boundaries.kolkata).toISOString()).toBe(
      "2026-01-15T18:30:00.000Z",
    );
  });

  it("adds ninety calendar days rather than ninety times twenty-four hours", async () => {
    const rows = await sql<{ calendar: string; naive: string }[]>`select
      public.kinward_add_calendar_days('2026-01-15 18:00:00+00'::timestamptz, 90, ${ZONE})::text calendar,
      ('2026-01-15 18:00:00+00'::timestamptz + interval '90 days')::text naive`;
    // The local clock time is preserved across the March DST change, so the UTC
    // instant differs from a fixed 2160-hour addition by exactly one hour.
    expect(new Date(rows[0].calendar).toISOString()).toBe(
      "2026-04-15T17:00:00.000Z",
    );
    expect(new Date(rows[0].naive).toISOString()).toBe(
      "2026-04-15T18:00:00.000Z",
    );
  });

  it("treats expires_at as an exclusive boundary and materializes expiration once", async () => {
    const { recipientId, grantId } = await activeGrant("Synthetic Boundary");
    expect(await allowed(recipientId)).toBe(true);

    // One microsecond before the boundary the delegation still has authority.
    await sql`update public.delegated_management_grants
      set expires_at = now() + interval '1 hour' where id = ${grantId}`;
    expect(await allowed(recipientId)).toBe(true);

    // At the boundary itself authority ends immediately, before any
    // materialization runs.
    await sql`update public.delegated_management_grants
      set expires_at = now() where id = ${grantId}`;
    expect(await allowed(recipientId)).toBe(false);
    expect((await state(grantId)).status).toBe("active");

    const detail = await owner.client.rpc("get_delegated_grant_detail", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
    });
    expect(detail.error).toBeNull();
    expect((detail.data as { status: string }).status).toBe("expired");
    const expired = await state(grantId);
    expect(expired.status).toBe("expired");
    expect(await allowed(recipientId)).toBe(false);

    // A second read does not append another expiration event.
    await owner.client.rpc("get_delegated_grant_detail", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
    });
    const events = await sql<{ expired: number }[]>`
      select count(*)::int expired from public.audit_events
      where delegated_grant_id = ${grantId} and event_type = 'delegation.expired'`;
    expect(events[0].expired).toBe(1);

    const restore = await owner.client.rpc("restore_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: expired.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(restore.error).not.toBeNull();
    expect((await state(grantId)).status).toBe("expired");
  });

  it("refuses restoration of a suspended grant whose expiration has passed", async () => {
    const { recipientId, grantId } = await activeGrant(
      "Synthetic Late Restore",
    );
    const active = await state(grantId);
    const suspended = await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(suspended.error).toBeNull();

    await sql`update public.delegated_management_grants
      set expires_at = now() - interval '1 minute' where id = ${grantId}`;
    const stale = await state(grantId);
    const restore = await owner.client.rpc("restore_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: stale.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(restore.error).not.toBeNull();
    expect(await allowed(recipientId)).toBe(false);
    // The refusal rolls back atomically, so the stored status still reads
    // suspended until the next successful read materializes the expiration.
    expect((await state(grantId)).status).toBe("suspended");
    const detail = await owner.client.rpc("get_delegated_grant_detail", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
    });
    expect((detail.data as { status: string }).status).toBe("expired");
    expect((await state(grantId)).status).toBe("expired");
    expect(await allowed(recipientId)).toBe(false);
  });

  it("keeps an until-revoked delegation active with no expiration boundary", async () => {
    const recipientId = (
      (
        await owner.client.rpc("self_activate_care_recipient", {
          p_circle_id: circleId,
          p_display_label: "Synthetic Open Ended",
          p_idempotency_key: crypto.randomUUID(),
          p_consent_version: "kinward.ownership.v1",
        })
      ).data as { care_recipient_id: string }
    ).care_recipient_id;
    await owner.client.rpc("select_care_management_mode", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_mode_code: "delegated_management",
      p_expected_version: 0,
      p_idempotency_key: crypto.randomUUID(),
    });
    const grantId = (
      (
        await owner.client.rpc("create_pending_delegated_grant", {
          p_circle_id: circleId,
          p_care_recipient_id: recipientId,
          p_membership_id: membershipId,
          p_permission_codes: ["recipient.manage_roles"],
          p_selection_mode: "selected",
          p_idempotency_key: crypto.randomUUID(),
        })
      ).data as { grant_id: string }
    ).grant_id;
    const pending = await state(grantId);
    await owner.client.rpc("set_delegation_until_revoked", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_consent_version: UNTIL_REVOKED_CONSENT,
      p_expected_version: pending.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    const withDuration = await state(grantId);
    await representative.client.rpc("accept_delegation_as_representative", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: withDuration.terms_fingerprint,
      p_consent_version: ACCEPTANCE_CONSENT,
      p_idempotency_key: crypto.randomUUID(),
    });
    const ready = await state(grantId);
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
    expect((await state(grantId)).expires_at).toBeNull();
    expect(await allowed(recipientId)).toBe(true);

    // Materialization never invents an expiration for an until-revoked grant.
    await owner.client.rpc("get_delegated_grant_detail", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
    });
    expect((await state(grantId)).status).toBe("active");
    const events = await sql<{ expired: number }[]>`
      select count(*)::int expired from public.audit_events
      where delegated_grant_id = ${grantId} and event_type = 'delegation.expired'`;
    expect(events[0].expired).toBe(0);
  });
});
