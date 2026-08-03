import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607210006_slice_10_delegation_lifecycle.sql",
  "utf8",
).toLowerCase();

describe("Slice 10 schema boundaries", () => {
  it("adds only the approved delegation lifecycle columns and time zone", () => {
    for (const column of [
      "time_zone",
      "governing_time_zone",
      "duration_mode",
      "expiration_local_date",
      "activated_at",
      "suspended_at",
      "restored_at",
      "revoked_at",
      "last_reviewed_at",
      "last_reviewed_by_user_id",
      "last_review_decision",
      "until_revoked_consent_id",
      "representative_acceptance_id",
      "activation_consent_id",
      "terms_fingerprint",
    ])
      expect(migration).toContain(column);
    expect(migration).toContain("on_behalf_of_user_id");
    expect(migration).toContain("delegated_grant_id");
  });

  it("keeps grantable scopes to Manage roles and Review permissions", () => {
    expect(migration).toContain(
      "code not in ('recipient.manage_roles', 'recipient.review_permissions')",
    );
    for (const forbidden of [
      "recipient.change_ownership",
      "patient_check_in",
      "caregiver_check_in",
      "symptom",
      "medication",
      "treatment",
      "diagnosis",
      "managed_minor",
      "backup_circle_administrator",
      "document_upload",
      "'*'::text[]",
    ])
      expect(migration).not.toContain(forbidden);
  });

  it("hardens every new function and forbids actor forgery", () => {
    const definers = migration.match(/security definer/g)?.length ?? 0;
    expect(definers).toBeGreaterThanOrEqual(20);
    expect(
      migration.match(/set search_path = ''/g)?.length ?? 0,
    ).toBeGreaterThanOrEqual(definers);
    expect(migration).not.toContain("p_actor_user_id uuid default");
    expect(migration).toContain("kinward_require_recent_authentication");
    expect(migration).toContain("from public, anon;");
    expect(migration).toContain("to authenticated;");
  });

  it("expires with an exclusive upper bound and never with fixed hours", () => {
    expect(migration).toContain("now() < grant_row.expires_at");
    expect(migration).toContain("kinward_local_date_exclusive_end_utc");
    expect(migration).toContain("kinward_add_calendar_days");
    expect(migration).not.toContain("interval '90 days'");
    expect(migration).not.toContain("interval '2160 hours'");
  });

  it("declares the approved lifecycle transitions only", () => {
    for (const rpc of [
      "set_delegation_finite_expiration",
      "set_delegation_until_revoked",
      "accept_delegation_as_representative",
      "activate_delegated_grant",
      "complete_delegation_access_review",
      "suspend_delegated_grant",
      "restore_delegated_grant",
      "revoke_delegated_grant",
      "get_delegated_grant_detail",
      "list_delegated_management_grants",
      "list_delegations_as_representative",
    ])
      expect(migration).toContain(rpc);
    // Nothing may move an ended delegation back to active.
    expect(migration).not.toContain("unexpire");
    expect(migration).not.toContain("unrevoke");
  });
});
