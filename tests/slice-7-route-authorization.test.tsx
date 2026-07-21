import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { auth, canManage, getRecipient, listMembers } = vi.hoisted(() => ({
  auth: vi.fn(),
  canManage: vi.fn(),
  getRecipient: vi.fn(),
  listMembers: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireAuthenticatedAdult: auth }));
vi.mock("@/lib/care-recipients/access", () => ({
  getOwnedCareRecipient: getRecipient,
}));
vi.mock("@/lib/recipient-roles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/recipient-roles")>()),
  canManageRecipientRoles: canManage,
  listRecipientRoleMembers: listMembers,
}));
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));

import OverviewPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/roles/page";
import DetailPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/roles/[membershipId]/page";

const ids = {
  circleId: "11111111-1111-4111-8111-111111111111",
  careRecipientId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "actor" });
  getRecipient.mockResolvedValue({ displayLabel: "Synthetic Dad" });
  listMembers.mockResolvedValue([]);
});
afterEach(cleanup);

describe("Slice 7 exact-recipient route authorization", () => {
  it.each([
    "unknown Circle ID",
    "inaccessible Circle ID",
    "unknown recipient ID",
    "recipient from another Circle",
    "valid recipient with unauthorized actor",
  ])(
    "renders the same protected state for %s before protected reads",
    async () => {
      canManage.mockResolvedValue(false);
      const view = await OverviewPage({
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
        /Synthetic Dad|role|member|owner/i,
      );
    },
  );

  it.each([
    "unknown membership",
    "membership from another Circle",
    "assignment from another recipient",
    "assignment from another Circle",
    "actor who lost authority",
  ])("clears protected detail data for %s", async () => {
    canManage.mockResolvedValue(true);
    listMembers.mockResolvedValue([]);
    const view = await DetailPage({ params: Promise.resolve(ids) });
    render(view);
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
    expect(document.body.textContent).not.toMatch(
      /Synthetic Dad|role code|active|email/i,
    );
  });

  it("does not weaken exact-recipient authorization to Circle membership", async () => {
    canManage.mockResolvedValue(false);
    await OverviewPage({
      params: Promise.resolve(ids),
      searchParams: Promise.resolve({}),
    });
    expect(canManage).toHaveBeenCalledWith(ids.circleId, ids.careRecipientId);
    expect(getRecipient).not.toHaveBeenCalled();
  });
});
