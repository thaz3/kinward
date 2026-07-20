import { describe, expect, it } from "vitest";
import { circleIdSchema, circleNameSchema } from "@/lib/circles";

describe("Slice 3 Circle boundaries", () => {
  it("normalizes names consistently and enforces the approved 2–60 range", () => {
    expect(circleNameSchema.parse("  Harbor   Circle ")).toBe("Harbor Circle");
    expect(circleNameSchema.safeParse("H").success).toBe(false);
    expect(circleNameSchema.safeParse("x".repeat(61)).success).toBe(false);
  });
  it("rejects guessed or malformed Circle identifiers before a query", () => {
    expect(circleIdSchema.safeParse("harbor-circle").success).toBe(false);
  });
});
