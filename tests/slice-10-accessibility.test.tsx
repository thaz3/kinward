import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DelegationAccessReviewForm,
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

function renderDuration() {
  return render(
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
}

describe("Slice 10 accessibility", () => {
  // AT-009 and AT-010: no duration is preselected, the suggested date is shown
  // in full, and Until revoked continues to its own consent screen.
  it("exposes the duration choices without preselecting one", async () => {
    const view = renderDuration();
    const options = screen.getAllByRole("radio");
    expect(options).toHaveLength(3);
    for (const option of options) expect(option).not.toBeChecked();
    expect(screen.getByText(/November 1, 2026/)).toBeInTheDocument();
    expect(screen.getByText(/Until revoked/)).toBeInTheDocument();
    expect(
      screen.getByText(/Choose one duration\. Nothing is selected for you/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Custom expiration date/)).toBeInTheDocument();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });

  it("announces an invalid or past custom date and saves nothing", async () => {
    const user = userEvent.setup();
    renderDuration();
    await user.click(screen.getByRole("radio", { name: /different date/i }));
    await user.type(
      screen.getByLabelText(/Custom expiration date/),
      "2020-01-01",
    );
    await user.click(screen.getByRole("button", { name: "Review delegation" }));
    const error = await screen.findByRole("alert");
    expect(error.textContent).toMatch(/on or after 2026-08-04/);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("confirms the exact expiration date with a focused safe action", async () => {
    const user = userEvent.setup();
    renderDuration();
    await user.click(screen.getByRole("radio", { name: /Suggested 90 days/i }));
    const trigger = screen.getByRole("button", { name: "Review delegation" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    expect(
      within(dialog).getByRole("button", { name: "Keep editing" }),
    ).toHaveFocus();
    expect(within(dialog).getByText(/through 2026-11-01/)).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
  });

  it("continues to the Until revoked screen instead of writing a date", async () => {
    const user = userEvent.setup();
    renderDuration();
    await user.click(screen.getByRole("radio", { name: /Until revoked/i }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(push).toHaveBeenCalledWith("/until-revoked");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  // AT-011: until-revoked consent is explicit and states the recurring review.
  it("requires explicit consent for no fixed expiration", async () => {
    const user = userEvent.setup();
    const view = render(
      <DelegationUntilRevokedForm
        {...ids}
        expectedVersion={2}
        representativeName="Synthetic Riley"
        scopeLabels={["Manage roles"]}
        governingTimeZoneLabel="America/New_York"
      />,
    );
    const confirm = screen.getByRole("button", {
      name: "Confirm until revoked",
    });
    expect(confirm).toBeDisabled();
    expect(
      screen.getByText(/Warning: there is no fixed end date/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/review is scheduled every 90 days/),
    ).toBeInTheDocument();
    await user.click(screen.getByLabelText(/no automatic expiration/i));
    expect(confirm).toBeEnabled();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });

  it("states that a due review changes nothing on its own", async () => {
    const view = render(
      <DelegationAccessReviewForm
        {...ids}
        expectedVersion={2}
        representativeName="Synthetic Riley"
      />,
    );
    expect(
      screen.getByText(/Access remains active while you decide/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep access" })).toBeEnabled();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });

  // AT-012 and AT-013: the safe action is first and focused, and the
  // consequential action names its outcome in full text.
  it.each([
    ["suspend", "Keep access", "Suspend access"],
    ["restore", "Leave suspended", "Restore access"],
    ["revoke", "Keep access", "Revoke access"],
  ] as const)(
    "focuses the safe action first on the %s screen",
    async (operation, safe, commit) => {
      const view = render(
        <DelegationLifecycleForm
          {...ids}
          expectedVersion={2}
          operation={operation}
          representativeName="Synthetic Riley"
          consequences={["Every delegated permission stops immediately."]}
          cancelHref="/back"
        />,
      );
      expect(screen.getByRole("button", { name: safe })).toHaveFocus();
      expect(screen.getByRole("button", { name: commit })).toBeInTheDocument();
      expect((await axe.run(view.container)).violations).toEqual([]);
    },
  );

  it("returns to the delegation instead of writing when the safe action is used", async () => {
    const user = userEvent.setup();
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
    await user.click(screen.getByRole("button", { name: "Keep access" }));
    expect(push).toHaveBeenCalledWith("/back");
  });
});
