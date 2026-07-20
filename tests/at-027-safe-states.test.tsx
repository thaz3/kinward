import { cleanup, render, screen } from "@testing-library/react";
import axe from "axe-core";
import { afterEach, describe, expect, it } from "vitest";
import {
  EmptyState,
  LoadingState,
  PermissionDeniedState,
  UnavailableState,
} from "@/components/system-states";
import {
  ContextRequestGuard,
  resolveProtectedCollectionState,
} from "@/lib/protected-state";

afterEach(cleanup);

describe("AT-027 — private empty, loading, error, and denial states", () => {
  it.each([
    ["loading", <LoadingState key="loading" />],
    ["unavailable", <UnavailableState key="unavailable" />],
    ["denied", <PermissionDeniedState key="denied" />],
  ])("renders the %s state without protected content", async (_, state) => {
    const { container } = render(state);
    expect(
      screen.queryByText(/PROTECTED_FIXTURE_VALUE/i),
    ).not.toBeInTheDocument();
    expect(
      (
        await axe.run(container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });

  it("shows empty only after an authorized complete response", () => {
    expect(
      resolveProtectedCollectionState({ authorized: false, complete: true }),
    ).toBe("denied");
    expect(
      resolveProtectedCollectionState({ authorized: true, complete: false }),
    ).toBe("loading");
    expect(
      resolveProtectedCollectionState({
        authorized: true,
        complete: true,
        failed: true,
      }),
    ).toBe("unavailable");
    expect(
      resolveProtectedCollectionState({ authorized: true, complete: true }),
    ).toBe("empty");
    render(
      <EmptyState
        heading="No information to show yet"
        message="This authorized collection is empty."
      />,
    );
    expect(
      screen.getByRole("heading", { name: "No information to show yet" }),
    ).toHaveFocus();
  });

  it("invalidates earlier context requests and rejects late responses", () => {
    const guard = new ContextRequestGuard();
    const previous = guard.beginContextChange();
    const current = guard.beginContextChange();
    expect(previous.signal.aborted).toBe(true);
    expect(previous.isCurrent()).toBe(false);
    expect(current.isCurrent()).toBe(true);
    guard.clear();
    expect(current.signal.aborted).toBe(true);
    expect(current.isCurrent()).toBe(false);
  });
});
