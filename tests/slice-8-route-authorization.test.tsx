import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { auth, canSelect, getRecipient, getMode } = vi.hoisted(() => ({
  auth: vi.fn(),
  canSelect: vi.fn(),
  getRecipient: vi.fn(),
  getMode: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireAuthenticatedAdult: auth }));
vi.mock("@/lib/care-recipients/access", () => ({
  getOwnedCareRecipient: getRecipient,
}));
vi.mock("@/lib/management-modes", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/management-modes")>()),
  canSelectManagementMode: canSelect,
  getCareManagementMode: getMode,
}));
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("@/components/management-mode-selection", () => ({
  SelectManagementModeForm: () => <div>Mode form</div>,
}));

import SelectPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management-mode/page";
import SummaryPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management-mode/summary/page";

const ids = {
  circleId: "11111111-1111-4111-8111-111111111111",
  careRecipientId: "22222222-2222-4222-8222-222222222222",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "actor" });
  getRecipient.mockResolvedValue({ displayLabel: "Synthetic Dad" });
  getMode.mockResolvedValue(null);
});
afterEach(cleanup);

describe("Slice 8 management mode route authorization", () => {
  it.each([
    "unknown Circle ID",
    "inaccessible Circle ID",
    "unknown recipient ID",
    "recipient from another Circle",
    "valid recipient with unauthorized actor",
  ])(
    "renders the same protected state for %s before protected reads",
    async () => {
      canSelect.mockResolvedValue(false);
      const view = await SelectPage({
        params: Promise.resolve(ids),
        searchParams: Promise.resolve({}),
      });
      render(view);
      expect(screen.getByRole("heading").textContent).toBe(
        "Information unavailable",
      );
      expect(getRecipient).not.toHaveBeenCalled();
      expect(getMode).not.toHaveBeenCalled();
      expect(document.body.textContent).not.toMatch(
        /Synthetic Dad|Self-Managed|Shared|Delegated|mode/i,
      );
    },
  );

  it("does not weaken mode selection to Circle membership alone", async () => {
    canSelect.mockResolvedValue(false);
    await SelectPage({
      params: Promise.resolve(ids),
      searchParams: Promise.resolve({}),
    });
    expect(canSelect).toHaveBeenCalledWith(ids.circleId, ids.careRecipientId);
    expect(getRecipient).not.toHaveBeenCalled();
  });

  it("clears protected summary data when no mode is configured", async () => {
    canSelect.mockResolvedValue(true);
    getMode.mockResolvedValue(null);
    const view = await SummaryPage({ params: Promise.resolve(ids) });
    render(view);
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
    expect(document.body.textContent).not.toMatch(
      /Synthetic Dad|Self-Managed|email/i,
    );
  });
});
