import { afterEach, describe, expect, it, vi } from "vitest";
import {
  writeManagementGrantOperationalLog,
  type ManagementGrantOperationalEvent,
} from "@/lib/management-grant-logging";

afterEach(() => {
  vi.restoreAllMocks();
});

const lifecycleEvents: ManagementGrantOperationalEvent[] = [
  "delegated_duration_finite",
  "delegated_duration_until_revoked",
  "delegated_acceptance",
  "delegated_activation",
  "delegated_suspend",
  "delegated_restore",
  "delegated_revoke",
  "delegated_access_review",
];

describe("Slice 10 delegation lifecycle logging", () => {
  it("records each lifecycle step without protected detail", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    for (const event of lifecycleEvents) {
      writeManagementGrantOperationalLog({
        correlationId: "11111111-1111-4111-8111-111111111111",
        event,
        result: "success",
      });
      writeManagementGrantOperationalLog({
        correlationId: "22222222-2222-4222-8222-222222222222",
        event,
        result: "unavailable",
      });
    }
    expect(info).toHaveBeenCalledTimes(lifecycleEvents.length * 2);
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
        /email|@|dad|riley|manage_roles|time_zone|expires|consent|circle_id|care_recipient/i,
      );
    }
  });
});
