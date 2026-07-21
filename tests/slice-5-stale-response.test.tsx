/** @vitest-environment jsdom */
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useEffect, useRef, useState } from "react";
import { ContextRequestGuard } from "@/lib/protected-state";
import { ProtectedRecipientContent } from "@/components/recipient-context-transition";

function StaleRecipientProbe() {
  const guard = useRef(new ContextRequestGuard());
  const [label, setLabel] = useState("Dad");
  const [content, setContent] = useState("Dad protected content");

  useEffect(() => {
    const request = guard.current.beginContextChange();
    const timer = window.setTimeout(() => {
      if (!request.isCurrent()) return;
      setContent(`${label} protected content`);
    }, 30);
    return () => window.clearTimeout(timer);
  }, [label]);

  return (
    <div>
      <p data-testid="content">{content}</p>
      <button
        type="button"
        onClick={() => {
          guard.current.beginContextChange();
          setLabel("Mom");
          setContent("Clearing…");
        }}
      >
        Switch to Mom
      </button>
    </div>
  );
}

describe("Slice 5 stale recipient responses", () => {
  it("discards a late Dad response after switching to Mom", async () => {
    render(<StaleRecipientProbe />);
    expect(screen.getByTestId("content").textContent).toBe(
      "Dad protected content",
    );
    await act(async () => {
      screen.getByRole("button", { name: /switch to mom/i }).click();
    });
    expect(screen.getByTestId("content").textContent).toBe("Clearing…");
    await waitFor(
      () => {
        expect(screen.getByTestId("content").textContent).not.toBe(
          "Dad protected content",
        );
      },
      { timeout: 200 },
    );
    expect(screen.getByTestId("content").textContent).toBe("Clearing…");
  });

  it("clears recipient UI when circle or recipient clear events fire", async () => {
    render(
      <ProtectedRecipientContent>
        <p>Mom protected content</p>
      </ProtectedRecipientContent>,
    );
    expect(screen.getByText("Mom protected content")).toBeTruthy();
    await act(async () => {
      window.dispatchEvent(new Event("kinward:clear-recipient-context"));
    });
    expect(
      screen.getByText(/clearing the previous care recipient context/i),
    ).toBeTruthy();
  });
});
