import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const { auth, canReview, canManage, getAccessible, listMembers } = vi.hoisted(
  () => ({
    auth: vi.fn(),
    canReview: vi.fn(),
    canManage: vi.fn(),
    getAccessible: vi.fn(),
    listMembers: vi.fn(),
  }),
);

vi.mock("@/lib/auth/session", () => ({ requireAuthenticatedAdult: auth }));
vi.mock("@/lib/care-recipients/access", () => ({
  getAccessibleCareRecipient: getAccessible,
}));
vi.mock("@/lib/recipient-roles", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/recipient-roles")>()),
  canReviewRecipientPermissions: canReview,
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

const manageContext = {
  id: ids.careRecipientId,
  circleId: ids.circleId,
  displayLabel: "Synthetic Dad",
  status: "active" as const,
  accessKind: "owner" as const,
  permissionCodes: [
    "recipient.manage_roles" as const,
    "recipient.review_permissions" as const,
  ],
  delegatedGrantId: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "actor" });
  getAccessible.mockResolvedValue(manageContext);
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
      canReview.mockResolvedValue(false);
      const view = await OverviewPage({
        params: Promise.resolve(ids),
        searchParams: Promise.resolve({}),
      });
      render(view);
      expect(screen.getByRole("heading").textContent).toBe(
        "Information unavailable",
      );
      expect(getAccessible).not.toHaveBeenCalled();
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
    canReview.mockResolvedValue(false);
    await OverviewPage({
      params: Promise.resolve(ids),
      searchParams: Promise.resolve({}),
    });
    expect(canReview).toHaveBeenCalledWith(ids.circleId, ids.careRecipientId);
    expect(getAccessible).not.toHaveBeenCalled();
  });

  it("denies role detail when Manage roles authority is missing", async () => {
    canManage.mockResolvedValue(false);
    const view = await DetailPage({ params: Promise.resolve(ids) });
    render(view);
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
    expect(getAccessible).not.toHaveBeenCalled();
    expect(listMembers).not.toHaveBeenCalled();
  });
});
