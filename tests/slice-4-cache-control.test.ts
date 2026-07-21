import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({ getPublicEnvironment: () => null }));

describe("Slice 4 private cache boundary", () => {
  it.each([
    "/invitations/accept/abcdefghijklmnopqrstuvwxyz0123456789_-ab",
    "/invitations/mine/33333333-3333-3333-3333-333333333333",
    "/invitations/unavailable",
    "/sign-in?reason=invitation&next=%2Finvitations%2Faccept%2Fabcdefghijklmnopqrstuvwxyz0123456789_-ab",
  ])("marks %s private and no-store", async (path) => {
    const { refreshSupabaseSession } = await import("@/lib/supabase/proxy");
    const response = await refreshSupabaseSession(
      new NextRequest(`http://localhost:3000${path}`),
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
