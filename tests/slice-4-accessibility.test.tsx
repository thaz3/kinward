import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { InviteAdultForm } from "@/components/invite-adult-form";
import {
  InvitationDecision,
  InvitationUnavailableState,
} from "@/components/invitation-decision";
import { PendingInvitationDetail } from "@/components/pending-invitation-detail";
import { MyInvitationDecision } from "@/components/my-invitation-decision";

vi.mock("@/app/actions/invitations", () => ({
  createInvitation: vi.fn(async () => ({ status: "idle" })),
  cancelInvitation: vi.fn(),
  resendInvitation: vi.fn(),
  acceptInvitation: vi.fn(),
  declineInvitation: vi.fn(),
  declineMyInvitation: vi.fn(),
}));

afterEach(() => {
  cleanup();
});

describe("Slice 4 invitation accessibility", () => {
  it("labels invite fields and keeps review focusable", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <InviteAdultForm
        circleId="11111111-1111-1111-1111-111111111111"
        circleName="Harbor Circle"
        idempotencyKey="22222222-2222-2222-2222-222222222222"
      />,
    );
    expect(
      screen.getByLabelText(/Invitation recipient — verified email address/i),
    ).toBeInTheDocument();
    await user.type(
      screen.getByLabelText(/Invitation recipient — verified email address/i),
      "jordan@example.test",
    );
    await user.click(
      screen.getByRole("button", { name: /Review invitation/i }),
    );
    expect(
      screen.getByRole("heading", { name: /Review invitation/i }),
    ).toHaveFocus();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("announces unavailable invitation states without Circle leakage", async () => {
    const { container } = render(
      <InvitationUnavailableState state="mismatch" />,
    );
    expect(
      screen.getByRole("heading", { name: /This invitation is unavailable/i }),
    ).toBeInTheDocument();
    expect(container.textContent).not.toMatch(/Harbor/i);
    expect(container.textContent).not.toMatch(/Family Coordinator/i);
  });

  it("traps cancel confirmation focus on Keep invitation", async () => {
    const user = userEvent.setup();
    render(
      <PendingInvitationDetail
        circleId="11111111-1111-1111-1111-111111111111"
        invitationId="33333333-3333-3333-3333-333333333333"
        emailMask="j•••@example.test"
        createdAt="2026-07-16T12:00:00.000Z"
        expiresAt="2026-07-23T12:00:00.000Z"
        idempotencyKey="44444444-4444-4444-4444-444444444444"
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /^Cancel invitation$/i }),
    );
    expect(
      screen.getByRole("button", { name: /Keep invitation/i }),
    ).toHaveFocus();
  });

  it("keeps accept and decline actions keyboard operable", async () => {
    const { container } = render(
      <InvitationDecision
        token="abcdefghijklmnopqrstuvwxyz0123456789_-ab"
        circleName="Harbor Circle"
        expiresAt="2026-07-23T12:00:00.000Z"
      />,
    );
    expect(
      screen.getByRole("button", { name: /Accept invitation/i }),
    ).toBeEnabled();
    expect(
      screen.getByRole("button", { name: /Decline invitation/i }),
    ).toBeEnabled();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("confirms My Kinward decline with contained focus and restoration", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <MyInvitationDecision
        invitationId="33333333-3333-3333-3333-333333333333"
        circleName="Harbor Circle"
        expiresAt="2026-07-23T12:00:00.000Z"
      />,
    );
    const trigger = screen.getByRole("button", { name: "Decline invitation" });
    await user.click(trigger);
    const keep = screen.getByRole("button", { name: "Keep invitation" });
    const confirm = screen.getAllByRole("button", {
      name: "Decline invitation",
    })[1];
    expect(keep).toHaveFocus();
    await user.tab({ shift: true });
    expect(confirm).toHaveFocus();
    await user.tab();
    expect(keep).toHaveFocus();
    await user.click(keep);
    expect(trigger).toHaveFocus();
    await user.click(trigger);
    fireEvent(
      screen.getByRole("dialog"),
      new Event("cancel", { cancelable: true }),
    );
    expect(trigger).toHaveFocus();
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });
});
