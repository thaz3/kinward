import { describe, expect, it } from "vitest";
import { RECIPIENT_ROLE_COPY } from "@/lib/recipient-role-catalog";
import {
  recipientRoleMutationSchema,
  recipientRoleSchema,
} from "@/lib/recipient-roles";

describe("Slice 7 recipient-role domain", () => {
  it("uses only the approved exact-recipient catalog", () => {
    expect(recipientRoleSchema.options).toEqual([
      "care_lead",
      "medical_lead",
      "chemo_care_lead",
      "backup_caregiver",
    ]);
    for (const invalid of [
      "circle_head",
      "family_coordinator",
      "manager",
      "delegate",
      "*",
    ])
      expect(recipientRoleSchema.safeParse(invalid).success).toBe(false);
    expect(
      Object.values(RECIPIENT_ROLE_COPY).every((role) =>
        /no |cannot |creates no /i.test(role.boundary),
      ),
    ).toBe(true);
  });

  it("requires exact UUID context", () => {
    expect(
      recipientRoleMutationSchema.safeParse({
        circleId: crypto.randomUUID(),
        careRecipientId: crypto.randomUUID(),
        membershipId: crypto.randomUUID(),
        roleCode: "care_lead",
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(true);
    expect(
      recipientRoleMutationSchema.safeParse({
        circleId: "*",
        careRecipientId: "Dad",
        membershipId: crypto.randomUUID(),
        roleCode: "care_lead",
        idempotencyKey: crypto.randomUUID(),
      }).success,
    ).toBe(false);
  });
});
