import { beforeAll, describe, expect, it } from "vitest";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

// Slice 10 trusted recent authentication. Every sensitive delegated mutation
// requires a server-controlled authentication moment within fifteen minutes, so
// a client-refreshed access token alone can never extend the window. Supports
// AT-012 and AT-013, which both require recent authentication before the owner
// may suspend or revoke.

const UNTIL_REVOKED_CONSENT = "kinward.delegation_until_revoked_consent.v1";
const ACCEPTANCE_CONSENT = "kinward.delegation_acceptance.v1";
const ACTIVATION_CONSENT = "kinward.delegation_activation_consent.v1";

let owner: SyntheticUser,
  representative: SyntheticUser,
  circleId: string,
  recipientId: string,
  grantId: string;

async function state() {
  return (
    await sql<{ status: string; version: number }[]>`
      select status, version::int from public.delegated_management_grants
      where id = ${grantId}`
  )[0];
}

async function ageStoredAuthentication(userId: string, minutes: number) {
  await sql`
    update auth.sessions set created_at = now() - make_interval(mins => ${minutes})
    where user_id = ${userId}`;
  await sql`
    update auth.mfa_amr_claims claim
    set created_at = now() - make_interval(mins => ${minutes}),
        updated_at = now() - make_interval(mins => ${minutes})
    where claim.session_id in (
      select id from auth.sessions where user_id = ${userId}
    )`;
  await sql`
    update public.account_authentication_state
    set reauthenticated_at = now() - make_interval(mins => ${minutes})
    where user_id = ${userId}`;
}

beforeAll(async () => {
  owner = await createSyntheticUser("slice10-auth-owner");
  representative = await createSyntheticUser("slice10-auth-representative");
  circleId = (await createCircle(owner.client, "Slice Ten Auth Circle"))
    .data as string;
  const membershipId = (
    await sql<{ id: string }[]>`
      insert into public.circle_memberships(circle_id, user_id)
      values (${circleId}, ${representative.id}) returning id`
  )[0].id;
  recipientId = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circleId,
        p_display_label: "Synthetic Auth Dad",
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
  grantId = (
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
  const pending = await state();
  const duration = await owner.client.rpc("set_delegation_until_revoked", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_consent_version: UNTIL_REVOKED_CONSENT,
    p_expected_version: pending.version,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(duration.error).toBeNull();
  const terms = (
    await sql<{ terms_fingerprint: string }[]>`
      select terms_fingerprint from public.delegated_management_grants
      where id = ${grantId}`
  )[0].terms_fingerprint;
  const accepted = await representative.client.rpc(
    "accept_delegation_as_representative",
    {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_terms_fingerprint: terms,
      p_consent_version: ACCEPTANCE_CONSENT,
      p_idempotency_key: crypto.randomUUID(),
    },
  );
  expect(accepted.error).toBeNull();
  const ready = await state();
  const activated = await owner.client.rpc("activate_delegated_grant", {
    p_circle_id: circleId,
    p_care_recipient_id: recipientId,
    p_grant_id: grantId,
    p_terms_fingerprint: terms,
    p_consent_version: ACTIVATION_CONSENT,
    p_expected_version: ready.version,
    p_idempotency_key: crypto.randomUUID(),
  });
  expect(activated.error).toBeNull();
});

describe("Slice 10 trusted recent authentication", () => {
  it("reports the server-controlled authentication moment, never a client value", async () => {
    const fresh = await owner.client.rpc("has_recent_trusted_authentication");
    expect(fresh.error).toBeNull();
    expect(fresh.data).toBe(true);
    const denied = await anonymous.rpc("has_recent_trusted_authentication");
    expect(denied.error !== null || denied.data === false).toBe(true);
  });

  it("denies suspension and revocation once the trusted moment is stale", async () => {
    await ageStoredAuthentication(owner.id, 45);
    const stale = await owner.client.rpc("has_recent_trusted_authentication");
    expect(stale.data).toBe(false);

    const active = await state();
    const attempts = await Promise.all([
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
      owner.client.rpc("complete_delegation_access_review", {
        p_circle_id: circleId,
        p_care_recipient_id: recipientId,
        p_grant_id: grantId,
        p_decision: "keep_access",
        p_expected_version: active.version,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect(attempts.every((attempt) => attempt.error)).toBe(true);
    for (const attempt of attempts)
      expect(attempt.error?.message).toContain(
        "recent_authentication_required",
      );

    // The read-only detail view stays available without recent authentication.
    const detail = await owner.client.rpc("get_delegated_grant_detail", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
    });
    expect(detail.error).toBeNull();
    expect((detail.data as { status: string }).status).toBe("active");
    expect((await state()).status).toBe("active");
  });

  it("restores the window only through a recorded re-verification", async () => {
    const refreshed = await owner.client.rpc("record_trusted_authentication", {
      p_authentication_method: "email_verification",
    });
    expect(refreshed.error).toBeNull();
    const stored = await sql<{ method: string; recent: boolean }[]>`
      select authentication_method method,
        reauthenticated_at >= now() - interval '1 minute' recent
      from public.account_authentication_state where user_id = ${owner.id}`;
    expect(stored[0].method).toBe("email_verification");
    // The stored value comes from the database clock, not the caller.
    expect(stored[0].recent).toBe(true);

    const active = await state();
    const suspended = await owner.client.rpc("suspend_delegated_grant", {
      p_circle_id: circleId,
      p_care_recipient_id: recipientId,
      p_grant_id: grantId,
      p_expected_version: active.version,
      p_idempotency_key: crypto.randomUUID(),
    });
    expect(suspended.error).toBeNull();
    expect((await state()).status).toBe("suspended");
  });

  it("rejects an unknown authentication method and anonymous recording", async () => {
    const invalid = await owner.client.rpc("record_trusted_authentication", {
      p_authentication_method: "forged_provider",
    });
    expect(invalid.error).not.toBeNull();
    const anonymousAttempt = await anonymous.rpc(
      "record_trusted_authentication",
      { p_authentication_method: "email_verification" },
    );
    expect(anonymousAttempt.error).not.toBeNull();
  });
});
