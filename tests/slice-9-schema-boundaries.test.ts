import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607210005_slice_9_management_grants.sql",
  "utf8",
).toLowerCase();

describe("Slice 9 schema boundaries", () => {
  it("contains only approved grant tables and scopes", () => {
    for (const table of [
      "shared_management_grants",
      "delegated_management_grants",
      "management_grant_scopes",
    ])
      expect(migration).toContain(table);
    expect(migration).toContain("consent_records");
    expect(migration).toContain("shared_management_grant");
    expect(migration).toContain("'recipient.manage_roles'");
    expect(migration).toContain("'recipient.review_permissions'");
    expect(migration).toContain("manage roles");
    expect(migration).toContain("review permissions");
    for (const excluded of [
      "patient_check_in",
      "symptom",
      "medication",
      "managed_minor",
      "backup_circle_administrator",
      "delegation.activated",
      "until_revoked",
      "next_review_at timestamptz not null",
    ])
      expect(migration).not.toContain(excluded);
  });

  it("hardens security-definer boundaries and forbids actor forgery", () => {
    expect(migration.match(/security definer/g)?.length).toBeGreaterThanOrEqual(
      7,
    );
    expect(migration).toMatch(
      /revoke all on public\.management_permission_definitions,[\s\S]*public\.management_grant_mutation_requests/,
    );
    expect(migration).not.toContain("p_actor_user_id");
    expect(migration).toContain("recent_authentication_required");
    expect(migration).toContain("status = 'pending'");
    expect(migration).toContain("create_pending_delegated_grant");
  });
});
