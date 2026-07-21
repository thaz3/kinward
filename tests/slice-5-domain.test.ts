import { describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { safeAuthRedirect } from "@/lib/auth/redirects";
import {
  OWNERSHIP_CONSENT_VERSION,
  OWNERSHIP_CONSEQUENCE_COPY,
  careRecipientLabelSchema,
  ownershipAcceptPath,
  ownershipDeliveryMarker,
  ownershipTokenSchema,
} from "@/lib/care-recipients";
import {
  generateInvitationToken,
  invitedEmailSchema,
  maskInvitationEmail,
} from "@/lib/invitations";
import { ContextRequestGuard } from "@/lib/protected-state";

describe("Slice 5 care recipient domain", () => {
  it("normalizes and validates display labels", () => {
    expect(careRecipientLabelSchema.parse("  Dad   Willow ")).toBe(
      "Dad Willow",
    );
    expect(careRecipientLabelSchema.safeParse("A").success).toBe(false);
  });

  it("accepts only synthetic owner emails", () => {
    expect(invitedEmailSchema.parse("Dad.Owner@example.test")).toBe(
      "dad.owner@example.test",
    );
    expect(invitedEmailSchema.safeParse("person@gmail.com").success).toBe(
      false,
    );
  });

  it("builds ownership accept paths and digests without leaking tokens in markers", () => {
    const { token, digest } = generateInvitationToken();
    expect(ownershipTokenSchema.parse(token)).toBe(token);
    expect(ownershipAcceptPath(token)).toMatch(
      /^\/ownership\/accept\/[A-Za-z0-9_-]+$/,
    );
    expect(ownershipDeliveryMarker(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(ownershipDeliveryMarker(token)).not.toContain(token);
    expect(digest).toMatch(/^[0-9a-f]{64}$/);
  });

  it("allows ownership accept redirects and rejects unsafe next values", () => {
    const token = generateInvitationToken().token;
    expect(safeAuthRedirect(`/ownership/accept/${token}`)).toBe(
      `/ownership/accept/${token}`,
    );
    expect(safeAuthRedirect("https://evil.example/ownership/accept/x")).toBe(
      "/my-kinward",
    );
  });

  it("masks owner emails and keeps consent copy non-medical", () => {
    expect(maskInvitationEmail("riley@example.test")).toBe("r•••@example.test");
    expect(OWNERSHIP_CONSENT_VERSION).toBe("kinward.ownership.v1");
    expect(OWNERSHIP_CONSEQUENCE_COPY.join(" ")).toMatch(/sole owner/i);
    expect(OWNERSHIP_CONSEQUENCE_COPY.join(" ").toLowerCase()).not.toMatch(
      /diagnos|medication|symptom/,
    );
  });

  it("discards stale recipient responses after context change", () => {
    const guard = new ContextRequestGuard();
    const dad = guard.beginContextChange();
    const mom = guard.beginContextChange();
    expect(dad.isCurrent()).toBe(false);
    expect(mom.isCurrent()).toBe(true);
    guard.clear();
    expect(mom.isCurrent()).toBe(false);
  });

  it("does not log raw tokens or emails in scrubbed fingerprints", () => {
    const email = "secret-owner@example.test";
    const token = generateInvitationToken().token;
    const fingerprint = createHash("sha256")
      .update(`care-recipient-denied:${email}:${token}`)
      .digest("hex");
    expect(fingerprint).not.toContain(email);
    expect(fingerprint).not.toContain(token);
  });
});
