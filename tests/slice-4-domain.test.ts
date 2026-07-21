import { describe, expect, it } from "vitest";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import {
  generateInvitationToken,
  hashInvitationToken,
  invitedEmailSchema,
  maskInvitationEmail,
  normalizeInvitationEmail,
} from "@/lib/invitations";

describe("Slice 4 invitation domain", () => {
  it("normalizes and validates synthetic invitation emails only", () => {
    expect(normalizeInvitationEmail(" Jordan@Example.TEST ")).toBe(
      "jordan@example.test",
    );
    expect(invitedEmailSchema.safeParse("jordan@example.test").success).toBe(
      true,
    );
    expect(invitedEmailSchema.safeParse("jordan@gmail.com").success).toBe(
      false,
    );
    expect(maskInvitationEmail("jordan@example.test")).toBe(
      "j•••@example.test",
    );
  });

  it("stores only digests for invitation tokens", () => {
    const { token, digest } = generateInvitationToken();
    expect(token).not.toEqual(digest);
    expect(digest).toBe(hashInvitationToken(token));
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("allows only safe invitation return paths after authentication", () => {
    expect(safeAuthRedirect("/invitations/accept/abc_def-123")).toBe(
      "/invitations/accept/abc_def-123",
    );
    expect(
      safeAuthRedirect(
        "/invitations/mine/11111111-1111-1111-1111-111111111111",
      ),
    ).toBe("/invitations/mine/11111111-1111-1111-1111-111111111111");
    expect(safeAuthRedirect("https://evil.example/invitations/accept/x")).toBe(
      "/my-kinward",
    );
    expect(safeAuthRedirect("//evil.example")).toBe("/my-kinward");
  });
});
