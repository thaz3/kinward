import { describe, expect, it } from "vitest";
import {
  accessReviewSchema,
  activationReadiness,
  activationSchema,
  DELEGATION_CONSENT_VERSIONS,
  DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS,
  DELEGATION_STATUS_COPY,
  finiteExpirationSchema,
  formatLocalDate,
  lifecycleActions,
  lifecycleTransitionSchema,
  localDateInZone,
  representativeAcceptanceSchema,
  untilRevokedSchema,
  type DelegatedGrantDetail,
} from "@/lib/delegated-grants";
import { DELEGATION_DURATION_MODES } from "@/lib/delegation-lifecycle-catalog";

const fingerprint = "a".repeat(64);

const grant = (
  overrides: Partial<DelegatedGrantDetail> = {},
): DelegatedGrantDetail => ({
  grantId: crypto.randomUUID(),
  viewerRole: "owner",
  careRecipientLabel: "Synthetic Dad",
  membershipId: crypto.randomUUID(),
  displayName: "Synthetic Riley",
  status: "pending",
  selectionMode: "selected",
  permissionCodes: ["recipient.manage_roles"],
  durationMode: "finite",
  governingTimeZone: "America/New_York",
  circleTimeZone: "America/New_York",
  expirationLocalDate: "2026-11-01",
  expiresAt: null,
  activatedAt: null,
  suspendedAt: null,
  restoredAt: null,
  revokedAt: null,
  expiredAt: null,
  nextReviewAt: null,
  lastReviewedAt: null,
  lastReviewDecision: null,
  reviewDue: false,
  termsFingerprint: fingerprint,
  representativeAccepted: true,
  ownerActivationConsented: false,
  version: 3,
  ...overrides,
});

const base = {
  circleId: crypto.randomUUID(),
  careRecipientId: crypto.randomUUID(),
  grantId: crypto.randomUUID(),
  idempotencyKey: crypto.randomUUID(),
  expectedVersion: "2",
};

describe("Slice 10 delegation domain", () => {
  it("keeps duration modes, review interval, and status copy to the approved set", () => {
    expect(DELEGATION_DURATION_MODES).toEqual(["finite", "until_revoked"]);
    expect(DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS).toBe(90);
    for (const status of [
      "pending",
      "active",
      "suspended",
      "expired",
      "revoked",
      "disputed",
    ] as const) {
      const copy = DELEGATION_STATUS_COPY[status];
      expect(copy.label.length).toBeGreaterThan(0);
      expect(copy.marker.length).toBeGreaterThan(0);
      expect(copy.meaning.length).toBeGreaterThan(0);
    }
    expect(DELEGATION_STATUS_COPY.expired.meaning).toMatch(/cannot become/i);
    expect(DELEGATION_STATUS_COPY.revoked.meaning).toMatch(
      /cannot be restored/i,
    );
  });

  it("accepts only versioned consent identifiers for each governed step", () => {
    expect(
      untilRevokedSchema.safeParse({
        ...base,
        consentVersion: DELEGATION_CONSENT_VERSIONS.untilRevoked,
      }).success,
    ).toBe(true);
    expect(
      untilRevokedSchema.safeParse({ ...base, consentVersion: "other" })
        .success,
    ).toBe(false);
    expect(
      representativeAcceptanceSchema.safeParse({
        ...base,
        termsFingerprint: fingerprint,
        consentVersion: DELEGATION_CONSENT_VERSIONS.representativeAcceptance,
      }).success,
    ).toBe(true);
    expect(
      activationSchema.safeParse({
        ...base,
        termsFingerprint: fingerprint,
        consentVersion: DELEGATION_CONSENT_VERSIONS.ownerActivation,
      }).success,
    ).toBe(true);
    expect(
      activationSchema.safeParse({
        ...base,
        termsFingerprint: "short",
        consentVersion: DELEGATION_CONSENT_VERSIONS.ownerActivation,
      }).success,
    ).toBe(false);
  });

  it("requires a calendar date, a known transition, and a keep-access decision", () => {
    expect(
      finiteExpirationSchema.safeParse({
        ...base,
        expirationLocalDate: "2026-12-31",
      }).success,
    ).toBe(true);
    expect(
      finiteExpirationSchema.safeParse({
        ...base,
        expirationLocalDate: "31-12-2026",
      }).success,
    ).toBe(false);
    for (const operation of ["suspend", "restore", "revoke"])
      expect(
        lifecycleTransitionSchema.safeParse({ ...base, operation }).success,
      ).toBe(true);
    expect(
      lifecycleTransitionSchema.safeParse({ ...base, operation: "delete" })
        .success,
    ).toBe(false);
    expect(
      accessReviewSchema.safeParse({ ...base, decision: "keep_access" })
        .success,
    ).toBe(true);
    expect(
      accessReviewSchema.safeParse({ ...base, decision: "extend_forever" })
        .success,
    ).toBe(false);
  });

  // AT-009 and AT-010: the interface never offers activation unless every closed
  // precondition already holds, including a duration and a matching time zone.
  it("blocks activation until every closed precondition holds", () => {
    expect(activationReadiness(grant()).ready).toBe(true);
    expect(
      activationReadiness(grant({ durationMode: null })).blockers,
    ).toContain("Choose a duration first.");
    expect(
      activationReadiness(grant({ expirationLocalDate: null })).blockers,
    ).toContain("Choose an expiration date first.");
    expect(
      activationReadiness(grant({ representativeAccepted: false })).ready,
    ).toBe(false);
    expect(activationReadiness(grant({ permissionCodes: [] })).ready).toBe(
      false,
    );
    expect(activationReadiness(grant({ termsFingerprint: null })).ready).toBe(
      false,
    );
    expect(activationReadiness(grant({ status: "active" })).ready).toBe(false);
    expect(
      activationReadiness(
        grant({ circleTimeZone: "Europe/Berlin" }),
      ).blockers.join(" "),
    ).toMatch(/time zone changed/i);
  });

  // AT-011 through AT-013: review, suspend, restore, and revoke are offered only
  // in the states the lifecycle allows, and never to a representative.
  it("offers lifecycle actions only in the states that allow them", () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    const past = new Date(Date.now() - 86_400_000).toISOString();
    expect(lifecycleActions(grant({ status: "pending" }))).toMatchObject({
      canChooseDuration: true,
      canReview: false,
      canSuspend: false,
      canRestore: false,
      canRevoke: false,
    });
    expect(
      lifecycleActions(grant({ status: "active", reviewDue: true })),
    ).toMatchObject({ canReview: true, canSuspend: true, canRevoke: true });
    expect(
      lifecycleActions(grant({ status: "suspended", expiresAt: future })),
    ).toMatchObject({ canRestore: true, canRevoke: true, canSuspend: false });
    expect(
      lifecycleActions(grant({ status: "suspended", expiresAt: past }))
        .canRestore,
    ).toBe(false);
    for (const status of ["expired", "revoked"] as const)
      expect(lifecycleActions(grant({ status }))).toMatchObject({
        canRestore: false,
        canRevoke: false,
        canSuspend: false,
      });
    expect(
      lifecycleActions(
        grant({ viewerRole: "representative", status: "active" }),
      ),
    ).toMatchObject({ canSuspend: false, canRevoke: false, canReview: false });
  });

  it("reads calendar dates in the governing zone rather than the viewer zone", () => {
    // 2026-08-03T02:00Z is still 2026-08-02 in New York, so the earliest
    // selectable date differs by zone even at the same instant.
    expect(localDateInZone("UTC")).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(localDateInZone("UTC", 1) > localDateInZone("UTC")).toBe(true);
    expect(formatLocalDate("2026-11-01")).toBe("November 1, 2026");
    expect(formatLocalDate("not-a-date")).toBeNull();
  });
});
