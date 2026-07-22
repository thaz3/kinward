export const MANAGEMENT_MODE_CODES = [
  "self_managed",
  "shared_management",
  "delegated_management",
] as const;
export type ManagementModeCode = (typeof MANAGEMENT_MODE_CODES)[number];

export const MANAGEMENT_MODE_COPY: Record<
  ManagementModeCode,
  { label: string; summary: string; consequence: string; boundary: string }
> = {
  self_managed: {
    label: "Self-Managed",
    summary:
      "You stay in direct control of management for this Care Recipient.",
    consequence:
      "No one receives management authority through this choice. Separate existing permissions keep their approved limits.",
    boundary:
      "Does not transfer ownership, create Shared or Delegated grants, or create legal authority.",
  },
  shared_management: {
    label: "Shared Management",
    summary:
      "You remain the primary manager and may later grant selected management scopes to approved adults.",
    consequence:
      "Selecting this mode alone grants no one access. Explicit Shared Management grants are configured separately.",
    boundary:
      "Does not transfer ownership, invent shared managers, or create legal authority.",
  },
  delegated_management: {
    label: "Delegated Management",
    summary:
      "You remain the owner and may later appoint Designated Care Representatives for selected scopes.",
    consequence:
      "Selecting this mode alone grants no one access. Explicit Delegated Management grants are configured separately.",
    boundary:
      "Does not create legal healthcare authority, remove your access, or invent a representative.",
  },
};
