export const DELEGATION_CONSENT_VERSIONS = {
  untilRevoked: "kinward.delegation_until_revoked_consent.v1",
  representativeAcceptance: "kinward.delegation_acceptance.v1",
  ownerActivation: "kinward.delegation_activation_consent.v1",
} as const;

export const DELEGATION_REVIEW_INTERVAL_CALENDAR_DAYS = 90;

export const DELEGATION_DURATION_MODES = ["finite", "until_revoked"] as const;
export type DelegationDurationMode = (typeof DELEGATION_DURATION_MODES)[number];

export const DELEGATION_DURATION_COPY: Record<
  DelegationDurationMode,
  { label: string; consequence: string }
> = {
  finite: {
    label: "Ends on a date you choose",
    consequence:
      "Access stays active through the whole chosen date in this Circle's time zone, then ends at the start of the next day.",
  },
  until_revoked: {
    label: "Until revoked",
    consequence:
      "There is no fixed end date. A review is scheduled every 90 days, and you can change, suspend, or revoke access at any time.",
  },
};

export const DELEGATION_STATUSES = [
  "pending",
  "active",
  "suspended",
  "expired",
  "revoked",
  "disputed",
] as const;
export type DelegationStatus = (typeof DELEGATION_STATUSES)[number];

// Full text plus a non-color shape marker, so status never depends on color.
export const DELEGATION_STATUS_COPY: Record<
  DelegationStatus,
  { label: string; marker: string; meaning: string }
> = {
  pending: {
    label: "Pending",
    marker: "○",
    meaning: "Not active. This delegation grants no access yet.",
  },
  active: {
    label: "Active",
    marker: "●",
    meaning: "Active within the listed scopes for this Care Recipient only.",
  },
  suspended: {
    label: "Suspended",
    marker: "◐",
    meaning:
      "Paused. Every delegated permission is denied until it is restored.",
  },
  expired: {
    label: "Expired",
    marker: "◌",
    meaning: "Ended at the recorded expiration. It cannot become active again.",
  },
  revoked: {
    label: "Revoked",
    marker: "✕",
    meaning: "Permanently ended. It cannot be restored.",
  },
  disputed: {
    label: "On hold",
    marker: "◍",
    meaning: "Held while authority is unresolved. No delegated access applies.",
  },
};

export const DELEGATION_BOUNDARY_NOTES = [
  "This is a Kinward grant, not legal authority.",
  "Ownership of this Care Recipient does not change.",
  "The owner keeps their own access at all times.",
  "A review becoming due never changes access on its own.",
] as const;
