import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const verifyOtp = vi.fn();
const exchangeCodeForSession = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: { verifyOtp, exchangeCodeForSession },
  })),
}));

describe("Slice 2 email-link confirmation route", () => {
  it("rejects unsupported token types without calling the provider", async () => {
    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(
      new NextRequest(
        "https://kinward.example.test/auth/confirm?token_hash=secret&type=recovery&next=https://bad.example",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://kinward.example.test/sign-in?reason=verification",
    );
    expect(verifyOtp).not.toHaveBeenCalled();
  });

  it("exchanges a PKCE callback code and preserves only an allowlisted redirect", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(
      new NextRequest(
        "https://kinward.example.test/auth/confirm?code=synthetic-code&next=%2Fcircles%2Fprivate",
      ),
    );
    expect(exchangeCodeForSession).toHaveBeenCalledWith("synthetic-code");
    expect(response.headers.get("location")).toBe(
      "https://kinward.example.test/my-kinward",
    );
  });

  it("returns a privacy-safe sign-in route for an invalid callback code", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: new Error("expired") });
    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(
      new NextRequest(
        "https://kinward.example.test/auth/confirm?code=expired-code",
      ),
    );
    expect(response.headers.get("location")).toBe(
      "https://kinward.example.test/sign-in?reason=verification",
    );
  });

  it("verifies an allowlisted email token and validates the redirect", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    const { GET } = await import("@/app/auth/confirm/route");
    const response = await GET(
      new NextRequest(
        "https://kinward.example.test/auth/confirm?token_hash=synthetic-hash&type=email&next=https://bad.example",
      ),
    );
    expect(verifyOtp).toHaveBeenCalledWith({
      token_hash: "synthetic-hash",
      type: "email",
    });
    expect(response.headers.get("location")).toBe(
      "https://kinward.example.test/my-kinward",
    );
  });
});
