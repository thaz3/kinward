import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AssignFamilyCoordinatorForm,
  ProtectedFinalHeadState,
  RoleLifecycleForm,
} from "@/components/circle-role-management";

vi.mock("@/app/actions/circle-roles", () => ({
  assignFamilyCoordinator: vi.fn(),
  transitionCircleRole: vi.fn(),
}));

afterEach(cleanup);

describe("Slice 6 role assignment accessibility", () => {
  it("provides role purpose, boundary, and an unavailable Head state in text", () => {
    render(
      <AssignFamilyCoordinatorForm
        circleId="00000000-0000-4000-8000-000000000001"
        membershipId="00000000-0000-4000-8000-000000000002"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Family Coordinator" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/grants no Care Recipient/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Circle Head" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/assignment is unavailable/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Assign Family Coordinator" }),
    ).toBeEnabled();
  });

  it.each(["suspend", "remove"] as const)(
    "provides keyboard-contained %s confirmation and restores focus",
    async (operation) => {
      const user = userEvent.setup();
      const view = render(
        <RoleLifecycleForm
          circleId="00000000-0000-4000-8000-000000000001"
          membershipId="00000000-0000-4000-8000-000000000002"
          assignmentId={`00000000-0000-4000-8000-00000000000${operation === "suspend" ? "3" : "4"}`}
          expectedVersion={1}
          roleLabel="Family Coordinator"
          operation={operation}
        />,
      );
      const trigger = screen.getByRole("button", {
        name: operation === "remove" ? "Remove role" : "Suspend role",
      });
      trigger.focus();
      await user.keyboard("{Enter}");
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("open");
      const cancel = within(dialog).getByRole("button", { name: "Cancel" });
      const confirm = within(dialog).getByRole("button", {
        name: `Confirm ${operation}`,
      });
      await waitFor(() => expect(cancel).toHaveFocus());
      await user.tab({ shift: true });
      expect(confirm).toHaveFocus();
      await user.tab();
      expect(cancel).toHaveFocus();
      expect(
        screen.getByText(/ends its future Circle-wide authority/i),
      ).toBeInTheDocument();
      expect(confirm).toHaveAccessibleName(`Confirm ${operation}`);
      await user.keyboard("{Escape}");
      expect(dialog).not.toHaveAttribute("open");
      expect(trigger).toHaveFocus();

      await user.click(trigger);
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      expect(trigger).toHaveFocus();
      expect((await axe.run(view.container)).violations).toEqual([]);
    },
  );

  it("explains final-Head protection without destructive controls", async () => {
    const view = render(
      <ProtectedFinalHeadState assignmentId="00000000-0000-4000-8000-000000000005" />,
    );
    expect(
      screen.getByRole("heading", { name: "Protected Circle Head" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/retain at least one active Circle Head/i),
    ).toBeInTheDocument();
    expect(
      within(view.container).getByText(/proposal-and-acceptance flow/i),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /suspend|remove/i }),
    ).not.toBeInTheDocument();
    expect((await axe.run(view.container)).violations).toEqual([]);
  });
});
