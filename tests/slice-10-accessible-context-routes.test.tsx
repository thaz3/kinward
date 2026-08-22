import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const {
  auth,
  getCircle,
  getAccessible,
  canReview,
  canManage,
  listMembers,
  listAccessible,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  getCircle: vi.fn(),
  getAccessible: vi.fn(),
  canReview: vi.fn(),
  canManage: vi.fn(),
  listMembers: vi.fn(),
  listAccessible: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireAuthenticatedAdult: auth }));
vi.mock("@/lib/circles", () => ({
  getAuthorizedCircle: getCircle,
}));
vi.mock("@/lib/care-recipients/access", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/care-recipients/access")>()),
  getAccessibleCareRecipient: getAccessible,
  listAccessibleCareRecipientContexts: listAccessible,
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
vi.mock("@/components/recipient-switcher", () => ({
  RecipientSwitcher: ({
    recipients,
  }: {
    recipients: Array<{ displayLabel: string; accessKind: string }>;
  }) => (
    <ul>
      {recipients.map((recipient) => (
        <li key={recipient.displayLabel}>
          {recipient.displayLabel} ({recipient.accessKind})
        </li>
      ))}
    </ul>
  ),
}));
vi.mock("@/components/recipient-context-transition", () => ({
  ProtectedRecipientContent: ({
    children,
  }: {
    children: React.ReactNode;
  }) => <div>{children}</div>,
}));

import CareRecipientPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/page";
import RolesPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/roles/page";
import RoleDetailPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/roles/[membershipId]/page";
import SwitchRecipientPage from "@/app/circles/[circleId]/switch-recipient/page";

const ids = {
  circleId: "11111111-1111-4111-8111-111111111111",
  careRecipientId: "22222222-2222-4222-8222-222222222222",
  membershipId: "33333333-3333-4333-8333-333333333333",
};

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "actor" });
  getCircle.mockResolvedValue({
    id: ids.circleId,
    displayName: "Synthetic Circle",
  });
  listMembers.mockResolvedValue([
    {
      membershipId: "33333333-3333-4333-8333-333333333333",
      displayName: "Synthetic Riley",
      isCurrentActor: false,
      assignments: [],
    },
  ]);
});
afterEach(cleanup);

describe("Slice 10 accessible context routes", () => {
  it("shows owner navigation including management mode", async () => {
    getAccessible.mockResolvedValue({
      id: ids.careRecipientId,
      circleId: ids.circleId,
      displayLabel: "Synthetic Dad",
      status: "active",
      accessKind: "owner",
      permissionCodes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
      delegatedGrantId: null,
    });
    render(
      await CareRecipientPage({
        params: Promise.resolve(ids),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByText("Manage Care Recipient roles")).toBeInTheDocument();
    expect(screen.getByText("Select Care Management Mode")).toBeInTheDocument();
  });

  it("shows manage roles for a delegated representative with Manage roles scope", async () => {
    getAccessible.mockResolvedValue({
      id: ids.careRecipientId,
      circleId: ids.circleId,
      displayLabel: "Synthetic Dad",
      status: "active",
      accessKind: "delegated",
      permissionCodes: ["recipient.manage_roles"],
      delegatedGrantId: "44444444-4444-4444-8444-444444444444",
    });
    render(
      await CareRecipientPage({
        params: Promise.resolve(ids),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByText("Manage Care Recipient roles")).toBeInTheDocument();
    expect(
      screen.queryByText("Select Care Management Mode"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("View Care Recipient role assignments"),
    ).not.toBeInTheDocument();
  });

  it("shows read-only role assignments for Review permissions only", async () => {
    getAccessible.mockResolvedValue({
      id: ids.careRecipientId,
      circleId: ids.circleId,
      displayLabel: "Synthetic Dad",
      status: "active",
      accessKind: "delegated",
      permissionCodes: ["recipient.review_permissions"],
      delegatedGrantId: "44444444-4444-4444-8444-444444444444",
    });
    render(
      await CareRecipientPage({
        params: Promise.resolve(ids),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(
      screen.getByText("View Care Recipient role assignments"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Manage Care Recipient roles"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Select Care Management Mode"),
    ).not.toBeInTheDocument();
  });

  it("renders read-only roles overview without manage links", async () => {
    canReview.mockResolvedValue(true);
    canManage.mockResolvedValue(false);
    getAccessible.mockResolvedValue({
      id: ids.careRecipientId,
      circleId: ids.circleId,
      displayLabel: "Synthetic Dad",
      status: "active",
      accessKind: "delegated",
      permissionCodes: ["recipient.review_permissions"],
      delegatedGrantId: "44444444-4444-4444-8444-444444444444",
    });
    render(
      await RolesPage({
        params: Promise.resolve(ids),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(
      screen.getByText(/You may review these assignments only/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Manage roles for this member"),
    ).not.toBeInTheDocument();
  });

  it("lists owned and delegated contexts in the switcher", async () => {
    listAccessible.mockResolvedValue([
      {
        id: ids.careRecipientId,
        circleId: ids.circleId,
        displayLabel: "Synthetic Dad",
        status: "active",
        accessKind: "owner",
        permissionCodes: [
          "recipient.manage_roles",
          "recipient.review_permissions",
        ],
        delegatedGrantId: null,
      },
      {
        id: "55555555-5555-4555-8555-555555555555",
        circleId: ids.circleId,
        displayLabel: "Synthetic Mom",
        status: "active",
        accessKind: "delegated",
        permissionCodes: ["recipient.review_permissions"],
        delegatedGrantId: "66666666-6666-4666-8666-666666666666",
      },
    ]);
    render(
      await SwitchRecipientPage({
        params: Promise.resolve({ circleId: ids.circleId }),
        searchParams: Promise.resolve({}),
      }),
    );
    expect(screen.getByText("Synthetic Dad (owner)")).toBeInTheDocument();
    expect(screen.getByText("Synthetic Mom (delegated)")).toBeInTheDocument();
  });

  it("opens role detail for a Manage roles delegated representative", async () => {
    canManage.mockResolvedValue(true);
    getAccessible.mockResolvedValue({
      id: ids.careRecipientId,
      circleId: ids.circleId,
      displayLabel: "Synthetic Dad",
      status: "active",
      accessKind: "delegated",
      permissionCodes: ["recipient.manage_roles"],
      delegatedGrantId: "44444444-4444-4444-8444-444444444444",
    });
    listMembers.mockResolvedValue([
      {
        membershipId: ids.membershipId,
        displayName: "Synthetic Riley",
        isCurrentActor: false,
        assignments: [],
      },
    ]);
    render(
      await RoleDetailPage({
        params: Promise.resolve({
          ...ids,
          membershipId: ids.membershipId,
        }),
      }),
    );
    expect(screen.getByText(/Selected member: Synthetic Riley/)).toBeInTheDocument();
    expect(screen.getByText(/Exact Care Recipient: Synthetic Dad/)).toBeInTheDocument();
    expect(
      screen.queryByText("Select Care Management Mode"),
    ).not.toBeInTheDocument();
  });

  it("denies role detail for Review permissions only", async () => {
    canManage.mockResolvedValue(false);
    getAccessible.mockResolvedValue({
      id: ids.careRecipientId,
      circleId: ids.circleId,
      displayLabel: "Synthetic Dad",
      status: "active",
      accessKind: "delegated",
      permissionCodes: ["recipient.review_permissions"],
      delegatedGrantId: "44444444-4444-4444-8444-444444444444",
    });
    render(
      await RoleDetailPage({
        params: Promise.resolve({
          ...ids,
          membershipId: ids.membershipId,
        }),
      }),
    );
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
    expect(listMembers).not.toHaveBeenCalled();
  });

  it("keeps owner role detail available", async () => {
    canManage.mockResolvedValue(true);
    getAccessible.mockResolvedValue({
      id: ids.careRecipientId,
      circleId: ids.circleId,
      displayLabel: "Synthetic Dad",
      status: "active",
      accessKind: "owner",
      permissionCodes: [
        "recipient.manage_roles",
        "recipient.review_permissions",
      ],
      delegatedGrantId: null,
    });
    listMembers.mockResolvedValue([
      {
        membershipId: ids.membershipId,
        displayName: "Synthetic Riley",
        isCurrentActor: false,
        assignments: [
          {
            id: "77777777-7777-4777-8777-777777777777",
            roleCode: "care_lead",
            status: "active",
            version: 1,
          },
        ],
      },
    ]);
    render(
      await RoleDetailPage({
        params: Promise.resolve({
          ...ids,
          membershipId: ids.membershipId,
        }),
      }),
    );
    expect(screen.getByText(/Selected member: Synthetic Riley/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Care Lead" })).toBeInTheDocument();
  });
});
