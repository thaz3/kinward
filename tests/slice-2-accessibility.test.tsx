import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignInForm } from "@/components/auth/sign-in-form";
import { VerificationForm } from "@/components/auth/verification-form";

vi.mock("@/app/actions/auth", async () => {
  const actual =
    await vi.importActual<typeof import("@/app/actions/auth")>(
      "@/app/actions/auth",
    );
  return {
    ...actual,
    requestEmailCode: async () => ({
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: { email: "Enter a valid email address." },
    }),
    verifyEmailCode: async () => ({
      status: "error",
      message: "That code is invalid or has expired.",
    }),
    resendEmailCode: async () => ({
      status: "success",
      message:
        "If the address can receive a code, a new message is on its way.",
    }),
  };
});

afterEach(cleanup);
const axeOptions = { rules: { "color-contrast": { enabled: false } } };

describe("Slice 2 authentication accessibility", () => {
  it("uses a persistent email label, native email semantics, and focused error summary", async () => {
    const user = userEvent.setup();
    const { container } = render(<SignInForm />);
    expect(screen.getByLabelText("Verified email address")).toHaveAttribute(
      "type",
      "email",
    );
    await user.click(
      screen.getByRole("button", { name: "Continue with email" }),
    );
    expect(await screen.findByRole("alert")).toHaveFocus();
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
  });

  it("provides a named code field, status announcement, resend, and change-email controls", async () => {
    const { container } = render(
      <VerificationForm maskedEmail="a•••@example.test" />,
    );
    expect(screen.getByLabelText("Verification code")).toHaveAttribute(
      "autocomplete",
      "one-time-code",
    );
    expect(screen.getByRole("status", { name: "" })).toHaveTextContent(
      "Waiting for verification",
    );
    expect(
      screen.getByRole("button", { name: "Resend code" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Change email" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
    expect((await axe.run(container, axeOptions)).violations).toEqual([]);
  });
});
