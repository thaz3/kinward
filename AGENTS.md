# Kinward Contributor Guidance

> **Status:** Active contributor constraints; Milestone One application coding authorized (D-18)
> **Version:** 0.2
> **Last updated:** 2026-07-17
> **Governing or related decisions:** D-1 through D-18; `docs/DOCUMENT_GOVERNANCE.md`

## Project Purpose

Kinward is a private family care-coordination application created by First & 8th. It helps families organize practical, emotional, and spiritual support during cancer treatment and other serious illnesses.

Kinward is a coordination tool. It must never diagnose, interpret symptoms, recommend treatment, alter a care plan, or replace the patient's healthcare team.

## Current Phase

Milestone One application implementation is authorized under D-18. Work must stay within the approved non-medical foundation and the verified thirty-nine-screen high-fidelity design package. Follow `docs/milestone-one/IMPLEMENTATION_PLAN.md` slices in order unless the product owner directs otherwise.

Do not implement Patient or Caregiver Check-Ins; symptoms, medications, treatment tracking, medical alerts, diet, or exercise; medical interpretation or recommendations; document or medical-record uploads; real-family beta activity; production deployment; or public release. Any expansion beyond Milestone One requires separate product-owner approval.

Approved D-8 through D-17 requirements remain **Closed — Verified by targeted systems audit**. Milestone One remains non-medical. Local and hosted preview environments use synthetic data only. The restricted real-family beta remains unauthorized until Gate C and a signed `docs/REAL_FAMILY_BETA_READINESS.md`.

## Product Principles

- Put each Care Recipient and their caregivers at the center of the experience.
- Let each adult own and control their own personal information.
- Let each Care Recipient control access to their medical and care information.
- Keep Circle administration separate from access to a Care Recipient's medical information.
- Never grant medical access or delegated authority automatically because someone is a spouse, Circle Head, Family Coordinator, Backup Circle Administrator, or family member.
- Track the primary caregiver's well-being alongside the patient's needs.
- Use mobile-first layouts, large touch targets, plain language, and accessible interaction patterns.
- Design for older adults and people who may be tired, stressed, distracted, or managing treatment side effects.
- Share the least information necessary for each person to perform their role.
- Keep detailed medical information unavailable to the Extended Circle.
- Give managed minor profiles only adult-approved, age-appropriate information and supervised participation.
- Make prayer and meditation optional, inclusive, and controlled by the family.
- Support multiple Family Circles and multiple Care Recipients without allowing information to leak between Circles or Care Recipients.

## Medical Safety Rules

- Medical instructions must be recorded as coming from the patient's healthcare team.
- Never present Kinward-generated content as medical advice.
- Do not calculate medication doses, assess symptom severity, or recommend whether to start, stop, or change treatment.
- Do not create generic symptom thresholds or automatic medical decisions.
- Measurements, medication entries, and port or pump concerns may be recorded but must never be interpreted by Kinward.
- Do not imply that app monitoring is continuous or that a family member or clinician has seen an entry.
- Emergency guidance must direct people to the family's emergency plan, local emergency services, or the healthcare team as appropriate.
- Product copy and workflows must follow `docs/MEDICAL_SAFETY.md`.

## Privacy and Data Rules

- Never use real patient, caregiver, child, clinician, or family information in development, testing, demos, screenshots, documentation examples, or sample data.
- Use obviously fictional names and synthetic scenarios if examples are later required.
- Treat health information, schedules, contact details, family relationships, spiritual preferences, and caregiver check-ins as private.
- Apply least-privilege access and deny access by default.
- Keep patient medical information and each adult's private well-being entries in separate permission scopes.
- A caregiver may share a full well-being entry, a limited status, a request for help, or nothing.
- Minor profiles never sign in independently and never receive medical or emergency alerts.
- Care Management Mode and delegated permissions require explicit, recorded, revocable consent with an audit trail.
- Store legal roles separately from Kinward permissions. Kinward must not declare legal documents valid or infer legal authority.
- Do not claim that Kinward is HIPAA-compliant. Any future compliance statement requires documented legal, privacy, security, and operational review.
- Product behavior must follow `docs/PERMISSIONS.md`.
- Milestone One identity uses verified email only; phone contact data must remain separate from account identity.
- Local development and hosted preview use synthetic data only. Real information is prohibited until Gate C and a signed `docs/REAL_FAMILY_BETA_READINESS.md`.
- Secure document sharing is outside Milestone One and requires a separate approved design and readiness review.

## Accessibility and Content Rules

- Use plain, direct language and avoid unexplained medical or technical terms.
- Make primary actions easy to find and large enough to use comfortably on a phone.
- Do not rely on color alone to communicate status, urgency, or meaning.
- Support screen readers, keyboard navigation, text resizing, high contrast, and reduced motion.
- Avoid shaming, alarmist, or guilt-inducing language.
- Clearly distinguish family-entered information from healthcare-team instructions.

## Planning Sources of Truth

- Follow the tier hierarchy and propagation rules in `docs/DOCUMENT_GOVERNANCE.md`.
- Tier 1: checked `docs/MILESTONE_ONE_DECISIONS.md` selections and approved `docs/KINWARD_DECISION_LOG.md` entries (including D-18 coding authorization).
- Tier 2: `docs/PRODUCT_SPEC.md`, `docs/FAMILY_ROLES.md`, `docs/PERMISSIONS.md`, `docs/MEDICAL_SAFETY.md`, and this file.
- Tier 3: `docs/MVP_ROADMAP.md`, `docs/PRE_BUILD_DECISIONS.md`, `docs/TEST_FAMILY_OVERVIEW.md`, and `README.md`.
- Tier 3 also includes the milestone-one design package, `docs/MILESTONE_ONE_READINESS.md`, and `docs/REAL_FAMILY_BETA_READINESS.md`.
- Tier 4: punch lists, deferred backlogs, and audit reports.

When documents conflict, do not silently interpret them. Record and escalate the conflict under `docs/DOCUMENT_GOVERNANCE.md`; the applicable Tier 1 decision governs until propagation is complete.
