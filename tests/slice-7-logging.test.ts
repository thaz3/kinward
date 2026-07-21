import { describe, expect, it, vi } from "vitest";
import { writeRecipientRoleOperationalLog } from "@/lib/recipient-role-logging";

describe("Slice 7 log scrubbing", () => {
  it("emits only safe operational fields", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    const correlationId = crypto.randomUUID();
    writeRecipientRoleOperationalLog({
      correlationId,
      event: "assignment",
      result: "unavailable",
    });
    const output = String(info.mock.calls[0][0]);
    for (const secret of [
      "Dad",
      "Mom",
      "owner@example.test",
      "care_lead",
      "request body",
      "database error",
      "supabase-token",
    ])
      expect(output).not.toContain(secret);
    expect(Object.keys(JSON.parse(output)).sort()).toEqual(
      ["channel", "correlationId", "event", "result"].sort(),
    );
    info.mockRestore();
  });
});
