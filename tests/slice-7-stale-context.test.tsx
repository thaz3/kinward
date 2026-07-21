/** @vitest-environment jsdom */
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RecipientRoleLifecycleForm } from "@/components/recipient-role-management";

vi.mock("@/app/actions/recipient-roles", () => ({
  assignRecipientRole: vi.fn(),
  transitionRecipientRole: vi.fn(),
}));
afterEach(cleanup);

describe("Slice 7 recipient-role context clearing", () => {
  it.each(["kinward:clear-recipient-context", "kinward:clear-circle-context"])(
    "closes an open Dad lifecycle dialog on %s",
    async (eventName) => {
      render(
        <RecipientRoleLifecycleForm
          circleId="11111111-1111-4111-8111-111111111111"
          careRecipientId="22222222-2222-4222-8222-222222222222"
          membershipId="33333333-3333-4333-8333-333333333333"
          assignmentId="44444444-4444-4444-8444-444444444444"
          expectedVersion={1}
          roleLabel="Care Lead"
          operation="suspend"
        />,
      );
      const dialog = screen.getByRole("dialog", {
        hidden: true,
      }) as HTMLDialogElement;
      dialog.showModal = vi.fn(() => dialog.setAttribute("open", ""));
      dialog.close = vi.fn(() => dialog.removeAttribute("open"));
      await act(async () =>
        screen.getByRole("button", { name: "Suspend role" }).click(),
      );
      expect(dialog.hasAttribute("open")).toBe(true);
      await act(async () => window.dispatchEvent(new Event(eventName)));
      expect(dialog.hasAttribute("open")).toBe(false);
    },
  );
});
