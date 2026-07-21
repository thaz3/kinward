import { describe, expect, it } from "vitest";
import {
  circleWideRoleSchema,
  roleMutationSchema,
  roleOperationSchema,
} from "@/lib/circle-roles";

describe("Slice 6 Circle-wide role domain", () => {
  it("accepts only the two canonical Circle-wide roles", () => {
    expect(circleWideRoleSchema.parse("circle_head")).toBe("circle_head");
    expect(circleWideRoleSchema.parse("family_coordinator")).toBe(
      "family_coordinator",
    );
    for (const role of ["administrator", "care_lead", "medical_lead", "*"])
      expect(circleWideRoleSchema.safeParse(role).success).toBe(false);
  });

  it("permits only governed lifecycle operations", () => {
    expect(roleOperationSchema.parse("suspend")).toBe("suspend");
    expect(roleOperationSchema.parse("remove")).toBe("remove");
    expect(roleOperationSchema.safeParse("restore").success).toBe(false);
    expect(roleOperationSchema.safeParse("promote").success).toBe(false);
  });

  it("requires exact UUID-scoped mutation identifiers", () => {
    expect(
      roleMutationSchema.safeParse({
        circleId: crypto.randomUUID(),
        membershipId: crypto.randomUUID(),
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(true);
    expect(
      roleMutationSchema.safeParse({
        circleId: "*",
        membershipId: "other-circle-member",
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(false);
  });
});
