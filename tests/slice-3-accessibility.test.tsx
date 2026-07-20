import { render, screen } from "@testing-library/react";
import axe from "axe-core";
import { describe, expect, it } from "vitest";
import { CircleList } from "@/components/circle-list";

describe("Slice 3 Circle list accessibility", () => {
  it("labels each same-named action and has no automated violations", async () => {
    const view = render(
      <main>
        <h1>My Kinward</h1>
        <CircleList
          circles={[
            {
              id: "11111111-1111-4111-8111-111111111111",
              displayName: "Harbor Circle",
              isCircleHead: true,
            },
            {
              id: "22222222-2222-4222-8222-222222222222",
              displayName: "Cedar Circle",
              isCircleHead: false,
            },
          ]}
        />
      </main>,
    );
    expect(
      screen.getByRole("link", { name: "Open Circle Harbor Circle" }),
    ).toBeInTheDocument();
    expect(
      (
        await axe.run(view.container, {
          rules: { "color-contrast": { enabled: false } },
        })
      ).violations,
    ).toEqual([]);
  });
});
