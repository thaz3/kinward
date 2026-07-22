import { afterEach, describe, expect, it, vi } from "vitest";
import { writeManagementGrantOperationalLog } from "@/lib/management-grant-logging";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Slice 9 management grant logging", () => {
  it("scrubs successful and unavailable operational logs", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    writeManagementGrantOperationalLog({
      correlationId: "11111111-1111-4111-8111-111111111111",
      event: "shared_create",
      result: "success",
    });
    writeManagementGrantOperationalLog({
      correlationId: "22222222-2222-4222-8222-222222222222",
      event: "delegated_pending_create",
      result: "unavailable",
    });
    expect(info).toHaveBeenCalledTimes(2);
    for (const call of info.mock.calls) {
      const payload = JSON.parse(String(call[0])) as Record<string, unknown>;
      expect(Object.keys(payload).sort()).toEqual([
        "channel",
        "correlationId",
        "event",
        "result",
      ]);
      expect(payload.channel).toBe("management-grant-operations");
      expect(JSON.stringify(payload)).not.toMatch(
        /email|dad|mom|manage_roles|@|circle_id|care_recipient/i,
      );
    }
  });
});
