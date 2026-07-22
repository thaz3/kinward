import { describe, expect, it } from "vitest";
import {
  EXCLUDED_OWNERSHIP_SCOPE,
  MANAGEMENT_SCOPE_CODES,
  MANAGEMENT_SCOPE_COPY,
} from "@/lib/management-grant-catalog";
import {
  managementGrantMutationSchema,
  resolveScopeSelection,
} from "@/lib/management-grants";

describe("Slice 9 management grant domain", () => {
  it("exposes only the approved grantable catalog", () => {
    expect(MANAGEMENT_SCOPE_CODES).toEqual([
      "recipient.manage_roles",
      "recipient.review_permissions",
    ]);
    expect(MANAGEMENT_SCOPE_COPY["recipient.manage_roles"].label).toBe(
      "Manage roles",
    );
    expect(MANAGEMENT_SCOPE_COPY["recipient.review_permissions"].label).toBe(
      "Review permissions",
    );
    expect(EXCLUDED_OWNERSHIP_SCOPE.label).toBe("Change ownership");
  });

  it("snapshots all-current as both explicit current scopes", () => {
    expect(resolveScopeSelection("all_current", [])).toEqual([
      "recipient.manage_roles",
      "recipient.review_permissions",
    ]);
    expect(
      resolveScopeSelection("selected", ["recipient.manage_roles"]),
    ).toEqual(["recipient.manage_roles"]);
  });

  it("rejects ownership change and wildcards in mutation payloads", () => {
    const base = {
      circleId: crypto.randomUUID(),
      careRecipientId: crypto.randomUUID(),
      membershipId: crypto.randomUUID(),
      selectionMode: "selected",
      permissionCodes: ["recipient.manage_roles"],
      idempotencyKey: crypto.randomUUID(),
    };
    expect(managementGrantMutationSchema.safeParse(base).success).toBe(true);
    expect(
      managementGrantMutationSchema.safeParse({
        ...base,
        permissionCodes: ["recipient.change_ownership"],
      }).success,
    ).toBe(false);
    expect(
      managementGrantMutationSchema.safeParse({
        ...base,
        permissionCodes: ["*"],
      }).success,
    ).toBe(false);
  });
});
