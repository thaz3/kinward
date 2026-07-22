import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const {
  auth,
  canManage,
  canSelect,
  getRecipient,
  getMode,
  listMembers,
  listGrants,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  canManage: vi.fn(),
  canSelect: vi.fn(),
  getRecipient: vi.fn(),
  getMode: vi.fn(),
  listMembers: vi.fn(),
  listGrants: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireAuthenticatedAdult: auth }));
vi.mock("@/lib/care-recipients/access", () => ({
  getOwnedCareRecipient: getRecipient,
}));
vi.mock("@/lib/management-grants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/management-grants")>()),
  canManageManagementGrants: canManage,
  listManagementGrantMembers: listMembers,
  listSharedManagementGrants: listGrants,
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
vi.mock("@/components/management-grant-forms", () => ({
  SharedManagementGrantForm: () => <div>Shared form</div>,
  DelegatedRepresentativeForm: () => <div>Delegated form</div>,
  PendingDelegatedScopeForm: () => <div>Scope form</div>,
}));

import SharedPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/shared/page";
import DelegatedPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/page";
import ScopePage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/scopes/page";

const ids = {
  circleId: "11111111-1111-4111-8111-111111111111",
  careRecipientId: "22222222-2222-4222-8222-222222222222",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "actor" });
  getRecipient.mockResolvedValue({ displayLabel: "Synthetic Dad" });
  getMode.mockResolvedValue({ modeCode: "shared_management" });
  listMembers.mockResolvedValue([]);
  listGrants.mockResolvedValue([]);
});
afterEach(cleanup);

describe("Slice 9 route authorization", () => {
  it.each(["unknown Circle ID", "unauthorized actor", "wrong Care Recipient"])(
    "denies shared setup for %s before protected reads",
    async () => {
      canManage.mockResolvedValue(false);
      const view = await SharedPage({
        params: Promise.resolve(ids),
        searchParams: Promise.resolve({}),
      });
      render(view);
      expect(screen.getByRole("heading").textContent).toBe(
        "Information unavailable",
      );
      expect(getRecipient).not.toHaveBeenCalled();
      expect(listMembers).not.toHaveBeenCalled();
      expect(document.body.textContent).not.toMatch(
        /Synthetic Dad|Manage roles|Shared/i,
      );
    },
  );

  it("denies delegated setup before protected reads", async () => {
    canManage.mockResolvedValue(false);
    const view = await DelegatedPage({ params: Promise.resolve(ids) });
    render(view);
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
    expect(getRecipient).not.toHaveBeenCalled();
  });

  it("clears scope page when membership is missing", async () => {
    canManage.mockResolvedValue(true);
    canSelect.mockResolvedValue(true);
    getMode.mockResolvedValue({ modeCode: "delegated_management" });
    listMembers.mockResolvedValue([]);
    const view = await ScopePage({
      params: Promise.resolve(ids),
      searchParams: Promise.resolve({ membershipId: crypto.randomUUID() }),
    });
    render(view);
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
  });
});
