import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607210003_slice_7_recipient_roles.sql",
  "utf8",
).toLowerCase();

describe("Slice 7 schema boundaries", () => {
  it("contains only the approved recipient role catalog", () => {
    for (const role of [
      "care_lead",
      "medical_lead",
      "chemo_care_lead",
      "backup_caregiver",
    ])
      expect(migration).toContain(`'${role}'`);
    for (const excluded of [
      "shared_management",
      "delegated_management",
      "management_mode",
      "proxy_owner",
      "recipient_administrator",
    ])
      expect(migration).not.toContain(`'${excluded}'`);
  });
  it("hardens every security-definer function and direct-write boundary", () => {
    expect(migration.match(/security definer/g)?.length).toBe(5);
    expect(
      migration.match(/set search_path = ''/g)?.length,
    ).toBeGreaterThanOrEqual(5);
    expect(migration).toMatch(
      /revoke all on public\.care_recipient_role_definitions,[\s\S]*public\.care_recipient_role_assignments/,
    );
    expect(migration).not.toContain("p_actor_user_id");
  });
});
