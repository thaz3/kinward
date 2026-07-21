export const RECIPIENT_ROLE_CODES = [
  "care_lead",
  "medical_lead",
  "chemo_care_lead",
  "backup_caregiver",
] as const;
export type RecipientRoleCode = (typeof RECIPIENT_ROLE_CODES)[number];

export const RECIPIENT_ROLE_COPY: Record<
  RecipientRoleCode,
  { label: string; purpose: string; boundary: string }
> = {
  care_lead: {
    label: "Care Lead",
    purpose: "Coordinates approved practical daily support.",
    boundary:
      "No medical, ownership, management, delegation, or legal authority.",
  },
  medical_lead: {
    label: "Medical Lead",
    purpose: "Coordinates approved information from the healthcare team.",
    boundary:
      "Cannot diagnose, interpret, recommend treatment, or access another Care Recipient.",
  },
  chemo_care_lead: {
    label: "Chemo Care Lead",
    purpose:
      "Coordinates approved family logistics around a configured treatment window.",
    boundary:
      "Creates no clinical guidance and grants only exact-recipient coordination authority.",
  },
  backup_caregiver: {
    label: "Backup Caregiver",
    purpose: "Provides approved temporary practical coverage.",
    boundary:
      "Creates no permanent medical, caregiver-record, ownership, or management access.",
  },
};
