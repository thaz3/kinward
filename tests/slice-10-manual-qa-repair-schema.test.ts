import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607210007_slice_10_manual_qa_repair.sql",
  "utf8",
).toLowerCase();

describe("Slice 10 manual QA repair schema boundaries", () => {
  it("adds deny-by-default accessible context accessors", () => {
    for (const rpc of [
      "list_accessible_care_recipient_contexts",
      "get_accessible_care_recipient",
      "can_review_recipient_permissions",
      "kinward_materialize_actor_circle_delegations",
    ])
      expect(migration).toContain(rpc);
  });

  it("never grants circle-wide or cross-recipient access", () => {
    expect(migration).toContain("p_care_recipient_id");
    expect(migration).not.toContain("circle-wide");
    expect(migration).not.toContain("'%'::text[]");
  });

  it("preserves historical scope snapshots without reactivating removed scopes", () => {
    expect(migration).toContain("scope_snapshot_kind");
    expect(migration).toContain("status in ('active', 'removed')");
    expect(migration).toContain("status = 'active'");
    expect(migration).not.toContain("status = 'removed'");
    expect(migration).not.toContain("set status = 'active'");
  });

  it("evaluates finite expiration on every request", () => {
    expect(migration).toContain("now() < grant_row.expires_at");
    expect(migration).toContain(
      "kinward_materialize_actor_circle_delegations",
    );
  });

  it("records delegated on-behalf-of provenance for role lifecycle mutations", () => {
    expect(migration).toContain("transition_recipient_role");
    expect(migration).toContain("on_behalf_of_user_id");
    expect(migration).toContain("kinward_active_delegated_grant_id");
    expect(migration).toContain("scope_row.grant_id");
  });
});
