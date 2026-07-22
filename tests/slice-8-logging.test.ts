import { afterEach, describe, expect, it, vi } from "vitest";
import { writeManagementModeOperationalLog } from "@/lib/management-mode-logging";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("Slice 8 management mode logging", () => {
  it("emits only scrubbed operational fields", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => undefined);
    writeManagementModeOperationalLog({
      correlationId: "11111111-1111-4111-8111-111111111111",
      event: "select",
      result: "success",
    });
    expect(info).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(info.mock.calls[0][0])) as Record<
      string,
      unknown
    >;
    expect(Object.keys(payload).sort()).toEqual([
      "channel",
      "correlationId",
      "event",
      "result",
    ]);
    expect(payload.channel).toBe("management-mode-operations");
    expect(JSON.stringify(payload)).not.toMatch(
      /email|dad|mom|self_managed|circle|recipient|role|grant/i,
    );
  });
});
