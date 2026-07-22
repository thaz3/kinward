export const MANAGEMENT_SCOPE_CODES = [
  "recipient.manage_roles",
  "recipient.review_permissions",
] as const;
export type ManagementScopeCode = (typeof MANAGEMENT_SCOPE_CODES)[number];

export const MANAGEMENT_SCOPE_CATALOG_VERSION = "kinward.management_scopes.v1";

export const MANAGEMENT_SCOPE_COPY: Record<
  ManagementScopeCode,
  { label: string; purpose: string; boundary: string }
> = {
  "recipient.manage_roles": {
    label: "Manage roles",
    purpose:
      "Assign, suspend, or remove exact-Care-Recipient coordination roles.",
    boundary:
      "Creates no ownership, legal authority, or cross-recipient access.",
  },
  "recipient.review_permissions": {
    label: "Review permissions",
    purpose:
      "Review the Care Recipient permission and role summary for that recipient only.",
    boundary:
      "Creates no ownership change, grant expansion, or medical authority.",
  },
};

export const EXCLUDED_OWNERSHIP_SCOPE = {
  code: "recipient.change_ownership",
  label: "Change ownership",
  boundary: "Never included. Ownership cannot be transferred through a grant.",
} as const;
