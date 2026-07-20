import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import {
  CircleSwitchLink,
  ProtectedCircleContent,
} from "@/components/circle-context-transition";

describe("Circle context clearing", () => {
  it("removes the previous protected Circle content before navigation completes", async () => {
    const user = userEvent.setup();
    render(
      <>
        <CircleSwitchLink />
        <ProtectedCircleContent>
          <p>Synthetic previous Circle content</p>
        </ProtectedCircleContent>
      </>,
    );
    const link = screen.getByRole("link", { name: "Switch Circle" });
    link.addEventListener("click", (event) => event.preventDefault());
    await user.click(link);
    expect(
      screen.queryByText("Synthetic previous Circle content"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Clearing the previous Circle context",
    );
  });
});
