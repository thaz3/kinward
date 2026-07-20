import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth: { getUser } })),
}));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

describe("Slice 2 protected session boundary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("treats an expired provider session as unauthenticated", async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new Error("expired"),
    });
    const { getAuthenticatedAdult } = await import("@/lib/auth/session");
    expect(await getAuthenticatedAdult()).toBeNull();
  });

  it("rejects an unverified email at the protected-route boundary", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "avery@example.test",
          email_confirmed_at: undefined,
        },
      },
      error: null,
    });
    const { requireAuthenticatedAdult } = await import("@/lib/auth/session");
    await expect(requireAuthenticatedAdult()).rejects.toThrow(
      "REDIRECT:/sign-in?reason=session",
    );
  });

  it("allows a provider-verified adult with zero authority", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "avery@example.test",
          email_confirmed_at: "2026-07-20T00:01:00Z",
        },
      },
      error: null,
    });
    const { requireAuthenticatedAdult } = await import("@/lib/auth/session");
    expect((await requireAuthenticatedAdult()).authority).toEqual([]);
  });
});
