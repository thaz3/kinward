import { act, cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DelegationDurationForm,
  DelegationLifecycleForm,
  DelegationUntilRevokedForm,
} from "@/components/delegation-lifecycle-forms";

const push = vi.fn();

vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/app/actions/delegated-grants", () => ({
  setDelegationFiniteExpiration: vi.fn(),
  setDelegationUntilRevoked: vi.fn(),
  acceptDelegationAsRepresentative: vi.fn(),
  activateDelegatedGrant: vi.fn(),
  transitionDelegatedGrant: vi.fn(),
  completeDelegationAccessReview: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const ids = {
  circleId: crypto.randomUUID(),
  careRecipientId: crypto.randomUUID(),
  grantId: crypto.randomUUID(),
};

describe("Slice 10 stale context clearing", () => {
  it.each(["kinward:clear-recipient-context", "kinward:clear-circle-context"])(
    "discards the chosen date and confirmation on %s",
    async (event) => {
      const user = userEvent.setup();
      render(
        <DelegationDurationForm
          {...ids}
          expectedVersion={2}
          representativeName="Synthetic Riley"
          suggestedDate="2026-11-01"
          suggestedDateLabel="November 1, 2026"
          earliestDate="2026-08-04"
          governingTimeZoneLabel="America/New_York"
          untilRevokedHref="/until-revoked"
        />,
      );
      await user.click(
        screen.getByRole("radio", { name: /Suggested 90 days/i }),
      );
      await user.click(
        screen.getByRole("button", { name: "Review delegation" }),
      );
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      act(() => window.dispatchEvent(new Event(event)));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      for (const option of screen.getAllByRole("radio"))
        expect(option).not.toBeChecked();
    },
  );

  it("clears an unconfirmed until-revoked acknowledgement", async () => {
    const user = userEvent.setup();
    render(
      <DelegationUntilRevokedForm
        {...ids}
        expectedVersion={2}
        representativeName="Synthetic Riley"
        scopeLabels={["Manage roles"]}
        governingTimeZoneLabel="America/New_York"
      />,
    );
    await user.click(screen.getByLabelText(/no automatic expiration/i));
    expect(
      screen.getByRole("button", { name: "Confirm until revoked" }),
    ).toBeEnabled();
    act(() =>
      window.dispatchEvent(new Event("kinward:clear-recipient-context")),
    );
    expect(
      screen.getByRole("button", { name: "Confirm until revoked" }),
    ).toBeDisabled();
  });

  it("leaves a consequential lifecycle screen when context clears", async () => {
    render(
      <DelegationLifecycleForm
        {...ids}
        expectedVersion={2}
        operation="revoke"
        representativeName="Synthetic Riley"
        consequences={["This cannot be undone."]}
        cancelHref="/back"
      />,
    );
    act(() => window.dispatchEvent(new Event("kinward:clear-circle-context")));
    expect(push).toHaveBeenCalledWith("/back");
  });
});
