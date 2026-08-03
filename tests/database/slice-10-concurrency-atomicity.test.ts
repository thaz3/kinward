import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

// Slice 10 concurrency, idempotency, and rollback behavior for the delegated
// lifecycle. Supports AT-011 through AT-013: a duplicate activation is
// idempotent, a concurrent revocation or expiration wins over a suspension, and
// no partial lifecycle state is ever left behind.

const ZONE = "Europe/Lisbon";
const UNTIL_REVOKED_CONSENT = "kinward.delegation_until_revoked_consent.v1";
const ACCEPTANCE_CONSENT = "kinward.delegation_acceptance.v1";
const ACTIVATION_CONSENT = "kinward.delegation_activation_consent.v1";

let owner: SyntheticUser,
  representative: SyntheticUser,
  circleId: string,
  membershipId: string;

beforeAll(async () => {
  owner = await createSyntheticUser("slice10-race-owner");
  representative = await createSyntheticUser("slice10-race-representative");
  circleId = (await createCircle(owner.client, "Slice Ten Race Circle"))
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

afterAll(async () => {
  await sql`drop schema if exists kinward_slice10_test cascade`;
});

async function state(grantId: string) {
  return (
    await sql<
      {
        status: string;
        version: number;
        terms_fingerprint: string | null;
      }[]
    >`select status, version::int, terms_fingerprint
        from public.delegated_management_grants where id = ${grantId}`
  )[0];
}

async function acceptedPendingGrant(label: string) {
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
  const pending = await state(grantId);
  const duration = await owner.client.rpc("set_delegation_until_revoked", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_consent_version: UNTIL_REVOKED_CONSENT,
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
  return { recipientId, grantId };
}

async function activated(label: string) {
  const { recipientId, grantId } = await acceptedPendingGrant(label);
  const ready = await state(grantId);
  const result = await owner.client.rpc("activate_delegated_grant", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_terms_fingerprint: ready.terms_fingerprint,
    p_consent_version: ACTIVATION_CONSENT,
    p_expected_version: ready.version,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(result.error).toBeNull();
  return { recipientId, grantId };
}

describe("Slice 10 delegation concurrency and atomicity", () => {
  it("makes duplicate activation idempotent under the same key", async () => {
    const { recipientId, grantId } = await acceptedPendingGrant(
      "Synthetic Race Activation",
    );
    const ready = await state(grantId);
    const payload = {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: ready.terms_fingerprint,
      p_consent_version: ACTIVATION_CONSENT,
      p_expected_version: ready.version,
      p_idempotency_key: crypto.randomUUID(),
    };
    const [first, retry] = await Promise.all([
      owner.client.rpc("activate_delegated_grant", payload),
      owner.client.rpc("activate_delegated_grant", payload),
    ]);
    expect(first.error).toBeNull();
    expect(retry.error).toBeNull();
    expect(retry.data).toEqual(first.data);

    const counts = await sql<
      { grants: number; activations: number; consents: number }[]
    >`select
        (select count(*)::int from public.delegated_management_grants
          where care_recipient_id = ${recipientId} and status = 'active') grants,
        (select count(*)::int from public.audit_events
          where delegated_grant_id = ${grantId} and event_type = 'delegation.activated') activations,
        (select count(*)::int from public.consent_records
          where target_id = ${grantId}
            and consent_version = ${ACTIVATION_CONSENT}) consents`;
    expect(counts[0]).toEqual({ grants: 1, activations: 1, consents: 1 });
  });

  it("rejects a replayed idempotency key carrying different inputs", async () => {
    const { recipientId, grantId } = await activated("Synthetic Race Replay");
    const active = await state(grantId);
    const key = crypto.randomUUID();
    const suspended = await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: key,
    });
    expect(suspended.error).toBeNull();
    const conflict = await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version + 5,
      p_idempotency_key: key,
    });
    expect(conflict.error).not.toBeNull();
  });

  it("lets exactly one of a concurrent suspend and revoke win", async () => {
    const { recipientId, grantId } = await activated(
      "Synthetic Race Lifecycle",
    );
    const active = await state(grantId);
    const [suspend, revoke] = await Promise.all([
      owner.client.rpc("suspend_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_expected_version: active.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("revoke_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_expected_version: active.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    const winners = [suspend, revoke].filter((result) => !result.error);
    expect(winners).toHaveLength(1);

    const final = await state(grantId);
    expect(["suspended", "revoked"]).toContain(final.status);
    expect(final.version).toBe(active.version + 1);
    const allowed = await sql<{ manage: boolean }[]>`
      select public.kinward_has_management_scope(
        ${circleId}, ${recipientId}, ${representative.id}, 'recipient.manage_roles'
      ) manage`;
    expect(allowed[0].manage).toBe(false);
  });

  it("lets exactly one of two concurrent restorations win", async () => {
    const { recipientId, grantId } = await activated("Synthetic Race Restore");
    const active = await state(grantId);
    const suspended = await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(suspended.error).toBeNull();
    const paused = await state(grantId);
    const results = await Promise.all([
      owner.client.rpc("restore_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_expected_version: paused.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
      owner.client.rpc("restore_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_expected_version: paused.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(results.filter((result) => !result.error)).toHaveLength(1);
    const final = await state(grantId);
    expect(final.status).toBe("active");
    expect(final.version).toBe(paused.version + 1);
  });

  it.each([
    [
      "consent_insert",
      "public.consent_records",
      "new.consent_version = 'kinward.delegation_activation_consent.v1'",
    ],
    [
      "grant_update",
      "public.delegated_management_grants",
      "new.status = 'active' and old.status = 'pending'",
    ],
    [
      "audit_insert",
      "public.audit_events",
      "new.event_type = 'delegation.activated'",
    ],
  ] as const)(
    "rolls the whole activation back when %s fails",
    async (label, table, condition) => {
      const { recipientId, grantId } = await acceptedPendingGrant(
        `Synthetic Rollback ${label}`,
      );
      const ready = await state(grantId);
      const key = crypto.randomUUID();
      const functionName = `kinward_slice10_test.fail_${label}`;
      const triggerName = `slice10_fail_${label}`;
      await sql`create schema if not exists kinward_slice10_test`;
      await sql.unsafe(`
        create or replace function ${functionName}()
        returns trigger language plpgsql as $fn$
        begin
          if ${condition} then
            raise exception 'forced_boundary_failure';
          end if;
          return new;
        end;
        $fn$;
      `);
      await sql.unsafe(`drop trigger if exists ${triggerName} on ${table}`);
      await sql.unsafe(`
        create trigger ${triggerName}
        before insert or update on ${table}
        for each row execute function ${functionName}()
      `);

      const failed = await owner.client.rpc("activate_delegated_grant", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_terms_fingerprint: ready.terms_fingerprint,
        p_consent_version: ACTIVATION_CONSENT,
        p_expected_version: ready.version,
        p_idempotency_key: key,
      });
      expect(failed.error).not.toBeNull();

      await sql.unsafe(`drop trigger if exists ${triggerName} on ${table}`);
      await sql.unsafe(`drop function if exists ${functionName}()`);

      const after = await sql<
        {
          status: string;
          version: number;
          activated: number;
          consents: number;
          audits: number;
          completed: number;
          allowed: boolean;
        }[]
      >`select
          (select status from public.delegated_management_grants where id = ${grantId}) status,
          (select version::int from public.delegated_management_grants where id = ${grantId}) version,
          (select count(*)::int from public.audit_events
            where delegated_grant_id = ${grantId} and event_type = 'delegation.activated') activated,
          (select count(*)::int from public.consent_records
            where target_id = ${grantId} and consent_version = ${ACTIVATION_CONSENT}) consents,
          (select count(*)::int from public.audit_events where correlation_id = ${key}) audits,
          (select count(*)::int from public.management_grant_mutation_requests
            where idempotency_key = ${key} and result is not null) completed,
          public.kinward_has_management_scope(
            ${circleId}, ${recipientId}, ${representative.id}, 'recipient.manage_roles'
          ) allowed`;
      expect(after[0].status).toBe("pending");
      expect(after[0].version).toBe(ready.version);
      expect(after[0].activated).toBe(0);
      expect(after[0].consents).toBe(0);
      expect(after[0].audits).toBe(0);
      expect(after[0].completed).toBe(0);
      expect(after[0].allowed).toBe(false);
    },
  );

  it("commits activation, review schedule, consent, and audits together", async () => {
    const { recipientId, grantId } = await acceptedPendingGrant(
      "Synthetic Atomic Activation",
    );
    const ready = await state(grantId);
    const key = crypto.randomUUID();
    const result = await owner.client.rpc("activate_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: ready.terms_fingerprint,
      p_consent_version: ACTIVATION_CONSENT,
      p_expected_version: ready.version,
      p_idempotency_key: key,
    });
    expect(result.error).toBeNull();
    const committed = await sql<
      {
        status: string;
        review_scheduled: boolean;
        consents: number;
        audits: number;
        completed: number;
      }[]
    >`select
        (select status from public.delegated_management_grants where id = ${grantId}) status,
        (select next_review_at is not null from public.delegated_management_grants
          where id = ${grantId}) review_scheduled,
        (select count(*)::int from public.consent_records
          where target_id = ${grantId} and consent_version = ${ACTIVATION_CONSENT}) consents,
        (select count(*)::int from public.audit_events where correlation_id = ${key}) audits,
        (select count(*)::int from public.management_grant_mutation_requests
          where idempotency_key = ${key} and result is not null) completed`;
    expect(committed[0]).toEqual({
      status: "active",
      review_scheduled: true,
      consents: 1,
      audits: 4,
      completed: 1,
    });
  });
});
