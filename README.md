# Kinward

> **Status:** Current project overview; Milestone One application coding authorized (D-18)
> **Version:** 0.2
> **Last updated:** 2026-07-17
> **Governing or related decisions:** D-1 through D-18

Kinward is a private family care-coordination application created by First & 8th. It is intended to help families coordinate care, responsibilities, schedules, and support during cancer treatment and other serious illnesses.

## Project Status

Kinward is in Milestone One application implementation. Coding is limited to the approved non-medical foundation under D-18. Local and hosted preview environments use synthetic data only.

The Milestone One high-fidelity package is the visual source of truth for the thirty-nine approved foundation screens. Patient and Caregiver Check-Ins, medical features, document uploads, real-family beta activity, production deployment, and public release remain unauthorized.

## Product Promise

Kinward helps a family understand what is needed today, who is responsible, and what information each person may see. Each adult Care Recipient is the sole owner of their Care Recipient record, and each adult owns their private well-being entries. Circle administration, delegated app management, and legal authority are separate.

Kinward does not diagnose, interpret symptoms, recommend treatments, or replace the patient's healthcare team. Medical instructions must come from the healthcare team.

## Initial Experience

The initial product direction includes:

- Circle Today
- Patient Today
- Caregiver Today
- Daily Care Check, containing separate Patient and Caregiver Check-Ins
- Family task assignments
- Treatment Journey and Appointments
- Pre-chemo preparation
- Recovery-day support
- Diet and hydration
- Gentle movement
- Prayer and meditation
- Emergency contacts

## Design Commitments

- Private and least-privilege by default
- Mobile-first and accessible
- Easy to use for older adults
- Large controls and plain language
- Care Recipient control over personal and medical sharing
- No automatic medical access for a spouse, Circle Head, Family Coordinator, or Backup Circle Administrator
- Managed minor profiles with adult-approved, age-appropriate participation
- No detailed medical information for the Extended Circle
- Equal visibility for primary caregiver well-being
- Adult ownership of private caregiver well-being entries
- Self-Managed, Shared Management, or Delegated Management for each adult Care Recipient
- Multiple Circles and multiple Care Recipients with strict information separation
- Synthetic data only during development and demonstrations
- No HIPAA-compliance claim without future documented review

## Planning Documents

- [Product specification](docs/PRODUCT_SPEC.md)
- [Family roles](docs/FAMILY_ROLES.md)
- [Permissions](docs/PERMISSIONS.md)
- [Medical safety](docs/MEDICAL_SAFETY.md)
- [MVP roadmap](docs/MVP_ROADMAP.md)
- [Document governance](docs/DOCUMENT_GOVERNANCE.md)
- [Milestone-one decisions](docs/MILESTONE_ONE_DECISIONS.md)
- [Decision log](docs/KINWARD_DECISION_LOG.md)
- [Milestone-one open-question resolutions](docs/milestone-one/OPEN_DESIGN_QUESTIONS.md)
- [Real-family beta readiness gate](docs/REAL_FAMILY_BETA_READINESS.md)
- [Fictional test-family overview](docs/TEST_FAMILY_OVERVIEW.md)
- [Contributor guidance](AGENTS.md)

## Approved Authority Model

- An adult **Care Recipient** is the sole owner of their Care Recipient record and controls their medical and personal information.
- A **Circle Head** manages approved shared Circle settings but receives no automatic medical access.
- A **Designated Care Representative** receives explicit, recorded, revocable Kinward permissions from a Care Recipient.
- A **Trusted Decision Contact** is a contact for future review; the designation does not create legal authority.
- A **Backup Circle Administrator** is a separate, dormant contingency role that may preserve approved non-medical Circle administration after activation but receives no automatic medical access or succession authority.
- Legal roles and documents are recorded separately from app permissions. Kinward does not determine their validity.

## Before Development

Before non-medical milestone-one coding, complete the D-6 product-owner, privacy/permission, WCAG 2.2 Level AA baseline, and synthetic-data approvals. Medical-safety, security/privacy architecture, and qualified public-release reviews occur at their named later gates. Legal-document procedures, succession, exact recovery, emergency behavior, and final retention remain unresolved where the decision records say so.

D-8 through D-17 resolve the ten milestone-one design questions and are closed and verified for planning by the 2026-07-16 targeted systems audit. Closure does not authorize coding. Milestone One uses verified email only, keeps the last active Circle Head in place until a verified replacement accepts, separates family audit from privacy-safe security logging, and keeps local and hosted preview environments synthetic. The 39-screen low-fidelity visual baseline passed its targeted design re-audit with verdict **PASSED — SIX DESIGN REPAIRS VERIFIED**. High-fidelity design is authorized by the product owner for design only; outputs remain draft until reviewed, no final interface design is approved, and no interface implementation is authorized. The future **Restricted real-care family pilot** is not authorized; Gate C and the unsigned readiness checklist must be completed before any real information is entered. Document uploads remain outside Milestone One.
