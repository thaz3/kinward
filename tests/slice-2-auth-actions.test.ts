import { beforeEach, describe, expect, it, vi } from "vitest";

const cookieValues = new Map<string, string>();
const cookieStore = {
  get: vi.fn((name: string) => {
    const value = cookieValues.get(name);
    return value ? { name, value } : undefined;
  }),
  set: vi.fn(
    (name: string, value: string, options?: Record<string, unknown>) => {
      void options;
      return cookieValues.set(name, value);
    },
  ),
  delete: vi.fn((name: string) => cookieValues.delete(name)),
};

const auth = {
  signInWithOtp: vi.fn(),
  verifyOtp: vi.fn(),
  getUser: vi.fn(),
  signOut: vi.fn(),
};

vi.mock("next/headers", () => ({ cookies: vi.fn(async () => cookieStore) }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({ auth })),
}));

describe("Slice 2 authentication actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieValues.clear();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://synthetic.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY =
      "sb_publishable_synthetic_test_key";
    process.env.KINWARD_AUTH_COOKIE_SECRET =
      "synthetic-test-only-cookie-secret-0001";
  });

  it("validates email before contacting the provider", async () => {
    const { requestEmailCode } = await import("@/app/actions/auth");
    const INITIAL_AUTH_STATE = { status: "idle" as const };
    const form = new FormData();
    form.set("email", "not-an-email");
    const result = await requestEmailCode(INITIAL_AUTH_STATE, form);
    expect(result.fieldErrors?.email).toBeDefined();
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it("requests only an email OTP, stores email in an encrypted HttpOnly cookie, and redirects", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    const { requestEmailCode } = await import("@/app/actions/auth");
    const INITIAL_AUTH_STATE = { status: "idle" as const };
    const form = new FormData();
    form.set("email", "avery@example.test");
    await expect(requestEmailCode(INITIAL_AUTH_STATE, form)).rejects.toThrow(
      "REDIRECT:/verify",
    );
    expect(auth.signInWithOtp).toHaveBeenCalledWith({
      email: "avery@example.test",
      options: { shouldCreateUser: true },
    });
    const cookieCall = cookieStore.set.mock.calls[0];
    expect(cookieCall[1]).not.toContain("avery@example.test");
    expect(cookieCall[2]).toMatchObject({ httpOnly: true, sameSite: "lax" });
  });

  it("rejects an invalid or expired verification without creating a session", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    auth.verifyOtp.mockResolvedValue({
      data: { user: null },
      error: new Error("expired"),
    });
    const { requestEmailCode, verifyEmailCode } =
      await import("@/app/actions/auth");
    const INITIAL_AUTH_STATE = { status: "idle" as const };
    const emailForm = new FormData();
    emailForm.set("email", "avery@example.test");
    await expect(
      requestEmailCode(INITIAL_AUTH_STATE, emailForm),
    ).rejects.toThrow();
    const codeForm = new FormData();
    codeForm.set("code", "123456");
    const result = await verifyEmailCode(INITIAL_AUTH_STATE, codeForm);
    expect(result.message).toMatch(/invalid or has expired/i);
  });

  it("accepts only a provider-confirmed verified email and then redirects", async () => {
    auth.signInWithOtp.mockResolvedValue({ error: null });
    auth.verifyOtp.mockResolvedValue({
      error: null,
      data: {
        user: {
          id: "00000000-0000-4000-8000-000000000001",
          email: "avery@example.test",
          email_confirmed_at: "2026-07-20T00:01:00Z",
          app_metadata: {},
          user_metadata: {},
          aud: "authenticated",
          created_at: "2026-07-20T00:00:00Z",
        },
      },
    });
    const { requestEmailCode, verifyEmailCode } =
      await import("@/app/actions/auth");
    const INITIAL_AUTH_STATE = { status: "idle" as const };
    const emailForm = new FormData();
    emailForm.set("email", "avery@example.test");
    await expect(
      requestEmailCode(INITIAL_AUTH_STATE, emailForm),
    ).rejects.toThrow();
    const codeForm = new FormData();
    codeForm.set("code", "123456");
    await expect(verifyEmailCode(INITIAL_AUTH_STATE, codeForm)).rejects.toThrow(
      "REDIRECT:/my-kinward",
    );
    expect(cookieStore.delete).toHaveBeenCalledWith("kinward-pending-email");
  });

  it("invalidates the local session on logout", async () => {
    auth.getUser.mockResolvedValue({
      data: { user: { id: "synthetic-user" } },
    });
    auth.signOut.mockResolvedValue({ error: null });
    const { signOut } = await import("@/app/actions/auth");
    await expect(signOut()).rejects.toThrow("REDIRECT:/sign-in?signedOut=1");
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
  });
});
