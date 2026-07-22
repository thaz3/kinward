import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharedManagementGrantForm } from "@/components/management-grant-forms";

vi.mock("@/app/actions/management-grants", () => ({
  createSharedManagementGrant: vi.fn(),
  createPendingDelegatedGrant: vi.fn(),
}));

afterEach(cleanup);

describe("Slice 9 stale context clearing", () => {
  it("closes shared confirmation when recipient or Circle context clears", async () => {
    const user = userEvent.setup();
    render(
      <SharedManagementGrantForm
        circleId={crypto.randomUUID()}
        careRecipientId={crypto.randomUUID()}
        members={[
          { membershipId: crypto.randomUUID(), displayName: "Synthetic Sam" },
        ]}
      />,
    );
    await user.click(screen.getByLabelText(/Synthetic Sam/i));
    await user.click(screen.getByLabelText(/Manage roles/i));
    await user.click(
      screen.getByRole("button", { name: "Review shared access" }),
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    window.dispatchEvent(new Event("kinward:clear-recipient-context"));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
