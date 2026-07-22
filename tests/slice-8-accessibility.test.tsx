import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectManagementModeForm } from "@/components/management-mode-selection";

vi.mock("@/app/actions/management-modes", () => ({
  selectCareManagementMode: vi.fn(),
}));

afterEach(cleanup);

describe("Slice 8 accessibility", () => {
  it("labels every mode with summary, consequence, and boundary", async () => {
    const view = render(
      <SelectManagementModeForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        expectedVersion={0}
        currentModeCode={null}
      />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(3);
    expect(
      screen.getAllByText(/does not transfer ownership/i).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(/does not create legal healthcare authority/i),
    ).toBeInTheDocument();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });

  it("contains confirmation focus and restores it", async () => {
    const user = userEvent.setup();
    const view = render(
      <SelectManagementModeForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        expectedVersion={0}
        currentModeCode={null}
      />,
    );
    await user.click(screen.getByLabelText(/Self-Managed/i));
    const trigger = screen.getByRole("button", {
      name: "Review selected mode",
    });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    const confirm = within(dialog).getByRole("button", {
      name: "Use Self-Managed",
    });
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.keyboard("{Escape}");
    expect(trigger).toHaveFocus();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });
});
