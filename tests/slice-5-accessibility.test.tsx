/** @vitest-environment jsdom */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OwnershipDecision } from "@/components/ownership-decision";
import { ProposeCareRecipientForm } from "@/components/propose-care-recipient-form";
import { RecipientSwitcher } from "@/components/recipient-switcher";

vi.mock("@/app/actions/care-recipients", () => ({
  proposeCareRecipient: vi.fn(async () => ({ status: "idle" })),
  acceptOwnershipInvitation: vi.fn(),
  declineOwnershipInvitation: vi.fn(),
  switchCareRecipient: vi.fn(),
  cancelOwnershipProposal: vi.fn(),
  resendOwnershipInvitation: vi.fn(),
}));

describe("Slice 5 accessibility foundations", () => {
  it("propose form exposes a radio group legend and persistent labels", () => {
    render(
      <ProposeCareRecipientForm
        circleId="11111111-1111-4111-8111-111111111111"
        circleName="Harbor Circle"
        idempotencyKey="22222222-2222-4222-8222-222222222222"
        proposerEmail="avery@example.test"
      />,
    );
    expect(
      screen.getByRole("group", { name: /who is this care recipient/i }),
    ).toBeTruthy();
    expect(screen.getByLabelText(/display label/i)).toBeTruthy();
    expect(
      screen.getByText(/no private care recipient information/i),
    ).toBeTruthy();
  });

  it("ownership decision associates consent with an explicit control", async () => {
    const user = userEvent.setup();
    render(
      <OwnershipDecision
        token="abcdefghijklmnopqrstuvwxyz0123456789_-"
        circleName="Harbor Circle"
        proposerLabel="Avery"
        displayLabel="Dad"
        expiresAt={new Date(Date.now() + 86400000).toISOString()}
      />,
    );
    await user.click(
      screen.getByRole("button", { name: /review and accept/i }),
    );
    expect(
      screen.getByRole("checkbox", {
        name: /i consent to becoming the sole owner/i,
      }),
    ).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /accept ownership/i }),
    ).toBeTruthy();
  });

  it("recipient switcher does not rely on color alone for selection", () => {
    const { container } = render(
      <RecipientSwitcher
        circleId="11111111-1111-4111-8111-111111111111"
        circleName="Harbor Circle"
        recipients={[
          { id: "33333333-3333-4333-8333-333333333333", displayLabel: "Dad" },
          { id: "44444444-4444-4444-8444-444444444444", displayLabel: "Mom" },
        ]}
        current="circle-wide"
      />,
    );
    const radios = container.querySelectorAll('input[type="radio"]');
    expect(radios.length).toBe(3);
    expect(screen.getByRole("radio", { name: /circle-wide/i })).toBeChecked();
    expect(screen.getByRole("radio", { name: /^Dad$/i })).not.toBeChecked();
    expect(
      screen.getByText(/only contexts you can access are listed/i),
    ).toBeTruthy();
  });
});
