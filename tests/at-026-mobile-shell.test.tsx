import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/app-shell";
import { SYNTHETIC_SHELL } from "@/lib/shell-context";

vi.mock("next/navigation", () => ({ usePathname: () => "/" }));

afterEach(cleanup);

describe("AT-026 — WCAG 2.2 AA mobile shell", () => {
  it("provides landmarks, one page heading, skip navigation, and current-page text", async () => {
    const { container } = render(
      <AppShell context={SYNTHETIC_SHELL} currentPath="/">
        <p>Safe page content</p>
      </AppShell>,
    );
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 1, name: "Overview" }),
    ).toHaveFocus();
    expect(
      screen.getByRole("link", { name: "Skip to main content" }),
    ).toHaveAttribute("href", "#main-content");
    expect(screen.getAllByText("Current page")).not.toHaveLength(0);
    const results = await axe.run(container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(results.violations).toEqual([]);
  });

  it("opens and closes the enlarged-text navigation with keyboard-operable controls", async () => {
    const user = userEvent.setup();
    render(
      <AppShell context={SYNTHETIC_SHELL} currentPath="/">
        <p>Safe page content</p>
      </AppShell>,
    );
    const open = screen.getByRole("button", { name: "Open navigation" });
    await user.click(open);
    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    await user.click(screen.getByRole("button", { name: "Close navigation" }));
    await waitFor(() => expect(open).toHaveFocus());
  });
});
