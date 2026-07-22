import { describe, expect, it } from "vitest";
import {
  MANAGEMENT_MODE_CODES,
  MANAGEMENT_MODE_COPY,
} from "@/lib/management-mode-catalog";
import { managementModeMutationSchema } from "@/lib/management-modes";

describe("Slice 8 management mode domain", () => {
  it("exposes only the approved mode catalog", () => {
    expect(MANAGEMENT_MODE_CODES).toEqual([
      "self_managed",
      "shared_management",
      "delegated_management",
    ]);
    for (const code of MANAGEMENT_MODE_CODES) {
      expect(MANAGEMENT_MODE_COPY[code].label.length).toBeGreaterThan(0);
      expect(MANAGEMENT_MODE_COPY[code].boundary).toMatch(
        /ownership|legal|grant/i,
      );
    }
  });

  it("rejects invalid mutation payloads and wildcards", () => {
    const base = {
      circleId: crypto.randomUUID(),
      careRecipientId: crypto.randomUUID(),
      modeCode: "self_managed",
      expectedVersion: 0,
      idempotencyKey: crypto.randomUUID(),
    };
    expect(managementModeMutationSchema.safeParse(base).success).toBe(true);
    expect(
      managementModeMutationSchema.safeParse({
        ...base,
        modeCode: "joint_ownership",
      }).success,
    ).toBe(false);
    expect(
      managementModeMutationSchema.safeParse({
        ...base,
        modeCode: "*",
      }).success,
    ).toBe(false);
    expect(
      managementModeMutationSchema.safeParse({
        ...base,
        expectedVersion: -1,
      }).success,
    ).toBe(false);
  });
});
