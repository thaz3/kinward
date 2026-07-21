import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607210002_slice_6_circle_roles.sql",
  "utf8",
).toLowerCase();
const styles = readFileSync("app/globals.css", "utf8");
const listRoute = readFileSync(
  "app/circles/[circleId]/members/page.tsx",
  "utf8",
);
const detailRoute = readFileSync(
  "app/circles/[circleId]/members/[membershipId]/roles/page.tsx",
  "utf8",
);
const roleService = readFileSync("lib/circle-roles.ts", "utf8");

describe("Slice 6 migration boundaries", () => {
  it("contains only the approved Circle-wide catalog and no promotion RPC", () => {
    expect(migration).toContain("'circle_head', 'family_coordinator'");
    expect(migration).toContain("assign_family_coordinator");
    expect(migration).not.toContain("assign_circle_head(");
    expect(migration).not.toContain("care_lead");
    expect(migration).not.toContain("medical_lead");
  });

  it("uses deny-by-default tables, hardened functions, and direct-write revokes", () => {
    expect(migration).toContain(
      "alter table public.circle_role_mutation_requests enable row level security",
    );
    expect(migration).toContain("set search_path = ''");
    expect(migration).toContain(
      "revoke all on public.circle_role_mutation_requests",
    );
    expect(migration).toContain(
      "revoke all on function public.assign_family_coordinator",
    );
  });

  it("installs independent membership and assignment final-Head triggers", () => {
    expect(migration).toContain("circle_memberships_protect_final_head");
    expect(migration).toContain("circle_role_assignments_protect_final_head");
    expect(migration).toContain("final_circle_head_required");
  });

  it("keeps role actions at the 48 by 48 CSS-pixel target", () => {
    expect(styles).toMatch(
      /\.button\s*\{[^}]*min-width:\s*3rem;[^}]*min-height:\s*3rem;/s,
    );
  });

  it("preauthorizes list and detail routes before role data access", () => {
    for (const source of [listRoute, detailRoute]) {
      expect(source.indexOf("canViewCircleRoles(circleId)")).toBeGreaterThan(
        -1,
      );
      expect(source.indexOf("canViewCircleRoles(circleId)")).toBeLessThan(
        source.indexOf("listCircleRoleMembers(circle.id)"),
      );
    }
    expect(roleService.indexOf('rpc("can_view_circle_roles"')).toBeLessThan(
      roleService.indexOf('rpc("list_circle_role_members"'),
    );
  });
});
