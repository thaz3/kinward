import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AssignRecipientRoleForm,
  RecipientRoleLifecycleForm,
} from "@/components/recipient-role-management";

vi.mock("@/app/actions/recipient-roles", () => ({
  assignRecipientRole: vi.fn(),
  transitionRecipientRole: vi.fn(),
}));
afterEach(cleanup);

describe("Slice 7 accessibility", () => {
  it("labels every role with purpose and boundary", async () => {
    const view = render(
      <AssignRecipientRoleForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        membershipId={crypto.randomUUID()}
      />,
    );
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    expect(
      screen.getByText(/no medical, ownership, management/i),
    ).toBeInTheDocument();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });

  it("contains confirmation focus and restores it", async () => {
    const user = userEvent.setup();
    const view = render(
      <RecipientRoleLifecycleForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        membershipId={crypto.randomUUID()}
        assignmentId={crypto.randomUUID()}
        expectedVersion={1}
        roleLabel="Care Lead"
        operation="remove"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Remove role" });
    await user.click(trigger);
    const dialog = screen.getByRole("dialog");
    const cancel = within(dialog).getByRole("button", { name: "Cancel" });
    const confirm = within(dialog).getByRole("button", {
      name: "Confirm remove",
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
