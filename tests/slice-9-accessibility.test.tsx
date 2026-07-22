import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  PendingDelegatedScopeForm,
  SharedManagementGrantForm,
} from "@/components/management-grant-forms";

vi.mock("@/app/actions/management-grants", () => ({
  createSharedManagementGrant: vi.fn(),
  createPendingDelegatedGrant: vi.fn(),
}));

afterEach(cleanup);

describe("Slice 9 accessibility", () => {
  it("labels grantable scopes and excludes ownership", async () => {
    const view = render(
      <SharedManagementGrantForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        members={[
          { membershipId: crypto.randomUUID(), displayName: "Synthetic Sam" },
        ]}
      />,
    );
    expect(screen.getByText(/Manage roles/)).toBeInTheDocument();
    expect(screen.getByText(/Review permissions/)).toBeInTheDocument();
    expect(
      screen.getByText(/never included — change ownership/i),
    ).toBeInTheDocument();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });

  it("traps confirmation focus for pending delegation scopes", async () => {
    const user = userEvent.setup();
    const view = render(
      <PendingDelegatedScopeForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        membershipId={crypto.randomUUID()}
        representativeName="Synthetic Riley"
      />,
    );
    await user.click(screen.getByLabelText(/Manage roles/i));
    const trigger = screen.getByRole("button", {
      name: "Continue to duration",
    });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    const cancel = within(dialog).getByRole("button", { name: "Keep editing" });
    expect(cancel).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });
});
