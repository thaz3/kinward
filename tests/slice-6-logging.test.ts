import { describe, expect, it, vi } from "vitest";
import { writeCircleRoleOperationalLog } from "@/lib/circle-role-logging";

describe("Slice 6 operational log scrubbing", () => {
  it("emits only an approved correlation envelope", () => {
    const protectedValues = [
      "Synthetic Member Name",
      "member@example.test",
      "Synthetic Circle Name",
      "00000000-0000-4000-8000-000000000011",
      "00000000-0000-4000-8000-000000000012",
      "request-body-value",
      "family_coordinator",
      "session-token-secret",
      "supabase-token-secret",
      "database error: private detail",
    ];
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const correlationId = crypto.randomUUID();
    writeCircleRoleOperationalLog({
      channel: "circle-role-operations",
      correlationId,
      event: "lifecycle",
      result: "denied",
    });
    expect(info).toHaveBeenCalledTimes(1);
    const output = String(info.mock.calls[0][0]);
    expect(output).toContain(correlationId);
    for (const value of protectedValues) expect(output).not.toContain(value);
    expect(Object.keys(JSON.parse(output)).sort()).toEqual(
      ["channel", "correlationId", "event", "result"].sort(),
    );
    info.mockRestore();
  });
});
