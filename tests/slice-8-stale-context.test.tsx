import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SelectManagementModeForm } from "@/components/management-mode-selection";

vi.mock("@/app/actions/management-modes", () => ({
  selectCareManagementMode: vi.fn(),
}));

afterEach(cleanup);

describe("Slice 8 stale context clearing", () => {
  it("closes confirmation when recipient or Circle context clears", async () => {
    const user = userEvent.setup();
    render(
      <SelectManagementModeForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        expectedVersion={0}
        currentModeCode={null}
      />,
    );
    await user.click(screen.getByLabelText(/Self-Managed/i));
    await user.click(
      screen.getByRole("button", { name: "Review selected mode" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    window.dispatchEvent(new Event("kinward:clear-recipient-context"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Review selected mode" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    window.dispatchEvent(new Event("kinward:clear-circle-context"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("remount keys discard prior expected version after scope change", () => {
    const circleA = crypto.randomUUID();
    const circleB = crypto.randomUUID();
    const recipient = crypto.randomUUID();
    const { rerender } = render(
      <SelectManagementModeForm
        key={`${circleA}:${recipient}:unset:0`}
        circleId={circleA}
        careRecipientId={recipient}
        expectedVersion={0}
        currentModeCode={null}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Review selected mode" }),
    ).toBeInTheDocument();
    rerender(
      <SelectManagementModeForm
        key={`${circleB}:${recipient}:mode:2`}
        circleId={circleB}
        careRecipientId={recipient}
        expectedVersion={2}
        currentModeCode="shared_management"
      />,
    );
    expect(screen.getByLabelText(/Shared Management/i)).toBeChecked();
  });
});
