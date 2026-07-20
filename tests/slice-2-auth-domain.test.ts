import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import {
  managedMinorCanAuthenticate,
  ownAccountCapabilities,
  supportHasFamilyBypass,
  toAuthenticatedAdult,
} from "@/lib/auth/account";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import { createAuthSecurityLog } from "@/lib/auth/security-log";
import { profileInputSchema } from "@/lib/profile";

function user(overrides: Partial<User> = {}): User {
  return {
    id: "00000000-0000-4000-8000-000000000001",
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: "2026-07-20T00:00:00Z",
    email: "avery@example.test",
    email_confirmed_at: "2026-07-20T00:01:00Z",
    ...overrides,
  } as User;
}

describe("Slice 2 verified adult identity", () => {
  it("rejects missing, unverified, and phone-only identities", () => {
    expect(toAuthenticatedAdult(null)).toBeNull();
    expect(
      toAuthenticatedAdult(user({ email_confirmed_at: undefined })),
    ).toBeNull();
    expect(
      toAuthenticatedAdult(user({ email: undefined, phone: "+15555550100" })),
    ).toBeNull();
  });

  it("grants a verified adult only own-account capabilities and zero authority", () => {
    const account = toAuthenticatedAdult(user());
    expect(account).not.toBeNull();
    expect(account?.authority).toEqual([]);
    expect(ownAccountCapabilities(account!).permissions).toEqual([
      "account.profile.read",
      "account.profile.update",
    ]);
  });

  it("enforces managed-minor no-login and support no-bypass invariants", () => {
    expect(managedMinorCanAuthenticate()).toBe(false);
    expect(supportHasFamilyBypass()).toBe(false);
  });

  it("accepts only allowlisted post-auth redirects", () => {
    expect(safeAuthRedirect("/account")).toBe("/account");
    expect(safeAuthRedirect("https://malicious.example/collect")).toBe(
      "/my-kinward",
    );
    expect(safeAuthRedirect("//malicious.example")).toBe("/my-kinward");
  });

  it("limits profile input to approved entity 2 fields", () => {
    const result = profileInputSchema.parse({
      preferredDisplayName: "Avery Example",
      locale: "en-US",
      timeZone: "America/New_York",
      prefersReducedMotion: true,
      prefersHighContrast: false,
      prefersLargerText: true,
      familyRelationship: "spouse",
      role: "Circle Head",
    });
    expect(Object.keys(result).sort()).toEqual([
      "locale",
      "preferredDisplayName",
      "prefersHighContrast",
      "prefersLargerText",
      "prefersReducedMotion",
      "timeZone",
    ]);
  });

  it("creates authentication-security logs with no credential or family fields", () => {
    const log = createAuthSecurityLog({
      event: "auth.failed",
      result: "denied",
    });
    expect(log.channel).toBe("authentication-security");
    expect(JSON.stringify(log)).not.toMatch(
      /password|token|email|circle|recipient|family/i,
    );
  });
});
