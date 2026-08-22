import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

const {
  auth,
  getDetail,
  loadOwner,
  suggested,
  recentAuth,
  listReviews,
  listGrants,
} = vi.hoisted(() => ({
  auth: vi.fn(),
  getDetail: vi.fn(),
  loadOwner: vi.fn(),
  suggested: vi.fn(),
  recentAuth: vi.fn(),
  listReviews: vi.fn(),
  listGrants: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({ requireAuthenticatedAdult: auth }));
vi.mock("@/lib/delegated-grants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/delegated-grants")>()),
  getDelegatedGrantDetail: getDetail,
  loadOwnerDelegationContext: loadOwner,
  getSuggestedExpirationDate: suggested,
  hasRecentTrustedAuthentication: recentAuth,
  listDelegationReviewsDue: listReviews,
  listDelegatedManagementGrants: listGrants,
}));
vi.mock("@/components/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => (
    <main>{children}</main>
  ),
}));
vi.mock("@/components/delegation-lifecycle-forms", () => ({
  DelegationDurationForm: () => <div>Duration form</div>,
  DelegationUntilRevokedForm: () => <div>Until revoked form</div>,
  DelegationAcceptanceForm: () => <div>Acceptance form</div>,
  DelegationActivationForm: () => <div>Activation form</div>,
  DelegationAccessReviewForm: () => <div>Keep access form</div>,
  DelegationLifecycleForm: () => <div>Lifecycle form</div>,
}));
vi.mock("@/components/delegation-reauthentication", () => ({
  RecentAuthenticationRequired: () => <div>Confirm it is you to continue</div>,
}));

import DetailPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/[grantId]/page";
import DurationPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/[grantId]/duration/page";
import UntilRevokedPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/[grantId]/until-revoked/page";
import ReviewPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/[grantId]/review/page";
import SuspendPage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/[grantId]/suspend/page";
import RestorePage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/[grantId]/restore/page";
import RevokePage from "@/app/circles/[circleId]/care-recipients/[careRecipientId]/management/delegated/[grantId]/revoke/page";

const ids = {
  circleId: "11111111-1111-4111-8111-111111111111",
  careRecipientId: "22222222-2222-4222-8222-222222222222",
  grantId: "33333333-3333-4333-8333-333333333333",
};

const params = Promise.resolve(ids);

const grant = (overrides: Record<string, unknown> = {}) => ({
  grantId: ids.grantId,
  viewerRole: "owner",
  careRecipientLabel: "Synthetic Dad",
  membershipId: "44444444-4444-4444-8444-444444444444",
  displayName: "Synthetic Riley",
  status: "active",
  selectionMode: "selected",
  permissionCodes: ["recipient.manage_roles"],
  durationMode: "finite",
  governingTimeZone: "America/New_York",
  circleTimeZone: "America/New_York",
  expirationLocalDate: "2026-12-01",
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  activatedAt: new Date().toISOString(),
  suspendedAt: null,
  restoredAt: null,
  revokedAt: null,
  expiredAt: null,
  nextReviewAt: null,
  lastReviewedAt: null,
  lastReviewDecision: null,
  reviewDue: false,
  scopeSnapshotKind: "current",
  termsFingerprint: "b".repeat(64),
  representativeAccepted: true,
  ownerActivationConsented: true,
  version: 4,
  ...overrides,
});

const pages: Array<[string, (input: { params: typeof params }) => unknown]> = [
  [
    "duration",
    (input) => DurationPage({ ...input, searchParams: Promise.resolve({}) }),
  ],
  ["until revoked", UntilRevokedPage],
  ["access review", ReviewPage],
  ["suspend", SuspendPage],
  ["restore", RestorePage],
  ["revoke", RevokePage],
];

beforeEach(() => {
  vi.clearAllMocks();
  auth.mockResolvedValue({ userId: "actor" });
  recentAuth.mockResolvedValue(true);
  suggested.mockResolvedValue("2026-11-01");
  listReviews.mockResolvedValue([]);
  listGrants.mockResolvedValue([]);
});
afterEach(cleanup);

describe("Slice 10 route authorization", () => {
  // AT-008: Circle authority alone must reveal nothing about a delegation.
  it.each(pages)(
    "denies the %s screen neutrally when owner authority is missing",
    async (_label, page) => {
      loadOwner.mockResolvedValue(null);
      render((await page({ params })) as React.ReactElement);
      expect(screen.getByRole("heading").textContent).toBe(
        "Information unavailable",
      );
      expect(document.body.textContent).not.toMatch(
        /Synthetic Dad|Synthetic Riley|Manage roles|2026/i,
      );
    },
  );

  it("denies the delegation detail screen neutrally for an unauthorized viewer", async () => {
    getDetail.mockResolvedValue(null);
    render(
      (await DetailPage({
        params,
        searchParams: Promise.resolve({}),
      })) as React.ReactElement,
    );
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
  });

  // AT-012 and AT-013: an ended delegation offers no suspend, restore, or revoke.
  it.each([
    ["suspend", SuspendPage, "revoked"],
    ["suspend", SuspendPage, "expired"],
    ["restore", RestorePage, "revoked"],
    ["restore", RestorePage, "expired"],
    ["revoke", RevokePage, "revoked"],
    ["revoke", RevokePage, "expired"],
  ] as const)(
    "refuses %s for a delegation that is %s",
    async (_label, page, status) => {
      loadOwner.mockResolvedValue({
        recipientLabel: "Synthetic Dad",
        grant: grant({ status }),
      });
      render((await page({ params })) as React.ReactElement);
      expect(screen.getByRole("heading").textContent).toBe(
        "Information unavailable",
      );
    },
  );

  it("refuses a duration change once the delegation is no longer pending", async () => {
    loadOwner.mockResolvedValue({
      recipientLabel: "Synthetic Dad",
      grant: grant({ status: "active" }),
    });
    render(
      (await DurationPage({
        params,
        searchParams: Promise.resolve({}),
      })) as React.ReactElement,
    );
    expect(screen.getByRole("heading").textContent).toBe(
      "Information unavailable",
    );
    expect(suggested).not.toHaveBeenCalled();
  });

  // The review-due state never removes authority and never writes on read.
  it("shows a due review without changing access", async () => {
    loadOwner.mockResolvedValue({
      recipientLabel: "Synthetic Dad",
      grant: grant({
        reviewDue: true,
        nextReviewAt: new Date(Date.now() - 1000).toISOString(),
      }),
    });
    render((await ReviewPage({ params })) as React.ReactElement);
    expect(screen.getByText(/Access review due/)).toBeInTheDocument();
    expect(
      screen.getByText(/Access remains active while you decide/),
    ).toBeInTheDocument();
    expect(screen.getByText("Keep access form")).toBeInTheDocument();
  });

  // Recent trusted authentication gates the write, not the read.
  it.each([
    ["suspend", SuspendPage, "active"],
    ["revoke", RevokePage, "active"],
    ["restore", RestorePage, "suspended"],
  ] as const)(
    "requires a fresh trusted authentication before %s",
    async (_label, page, status) => {
      recentAuth.mockResolvedValue(false);
      loadOwner.mockResolvedValue({
        recipientLabel: "Synthetic Dad",
        grant: grant({ status }),
      });
      render((await page({ params })) as React.ReactElement);
      expect(
        screen.getByText("Confirm it is you to continue"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Lifecycle form")).not.toBeInTheDocument();
    },
  );

  // A pending delegation grants zero authority and offers no activation until
  // the representative has accepted exactly these terms.
  it("lists activation blockers instead of offering activation", async () => {
    getDetail.mockResolvedValue(
      grant({ status: "pending", representativeAccepted: false }),
    );
    render(
      (await DetailPage({
        params,
        searchParams: Promise.resolve({}),
      })) as React.ReactElement,
    );
    expect(screen.queryByText("Activation form")).not.toBeInTheDocument();
    expect(
      screen.getByText(/has not accepted this delegation yet/),
    ).toBeInTheDocument();
  });

  it("offers acceptance to the named representative only", async () => {
    getDetail.mockResolvedValue(
      grant({
        viewerRole: "representative",
        status: "pending",
        representativeAccepted: false,
      }),
    );
    render(
      (await DetailPage({
        params,
        searchParams: Promise.resolve({}),
      })) as React.ReactElement,
    );
    expect(screen.getByText("Acceptance form")).toBeInTheDocument();
    expect(screen.queryByText(/Suspend access/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Revoke access/)).not.toBeInTheDocument();
  });
});
