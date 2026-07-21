import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/env", () => ({ getPublicEnvironment: () => null }));

describe("Slice 5 private cache boundary", () => {
  it.each([
    "/ownership/accept/abcdefghijklmnopqrstuvwxyz0123456789_-ab",
    "/ownership/unavailable",
    "/circles/11111111-1111-4111-8111-111111111111/care-recipients/22222222-2222-4222-8222-222222222222",
    "/circles/11111111-1111-4111-8111-111111111111/switch-recipient",
    "/sign-in?reason=invitation&next=%2Fownership%2Faccept%2Fabcdefghijklmnopqrstuvwxyz0123456789_-ab",
  ])("marks %s private and no-store", async (path) => {
    const { refreshSupabaseSession } = await import("@/lib/supabase/proxy");
    const response = await refreshSupabaseSession(
      new NextRequest(`http://localhost:3000${path}`),
    );
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
