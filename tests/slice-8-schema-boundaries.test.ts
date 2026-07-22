import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607210004_slice_8_management_modes.sql",
  "utf8",
).toLowerCase();

describe("Slice 8 schema boundaries", () => {
  it("contains only approved management mode codes and history", () => {
    for (const mode of [
      "self_managed",
      "shared_management",
      "delegated_management",
    ])
      expect(migration).toContain(`'${mode}'`);
    expect(migration).toContain("care_management_modes");
    expect(migration).toContain("care_management_modes_one_active");
    expect(migration).toContain("management_mode.changed");
    for (const excluded of [
      "shared_management_grants",
      "delegated_management_grants",
      "grant_scopes",
      "consent_records",
      "managed_minor",
      "backup_circle_administrator",
      "patient_check_in",
      "symptom",
      "medication",
    ])
      expect(migration).not.toContain(excluded);
  });

  it("hardens every security-definer function and direct-write boundary", () => {
    expect(migration.match(/security definer/g)?.length).toBe(3);
    expect(
      migration.match(/set search_path = ''/g)?.length,
    ).toBeGreaterThanOrEqual(3);
    expect(migration).toMatch(
      /revoke all on public\.care_management_modes,[\s\S]*public\.care_management_mode_mutation_requests/,
    );
    expect(migration).not.toContain("p_actor_user_id");
    expect(migration).toContain("recent_authentication_required");
    expect(migration).toMatch(/recipient\.status = 'active'/);
  });
});
