# Kinward Document Governance

> **Status:** Active document-governance policy; D-18 Milestone One coding authorized
> **Version:** 0.2
> **Last updated:** 2026-07-17
> **Governing or related decisions:** D-1 through D-18; F-01-R, F-02-R, F-17 through F-19

## Purpose

This policy defines which Kinward planning records govern when documents differ. It does not approve a medical, legal, privacy, security, child-safety, or authority decision by itself.

## Source-of-Truth Tiers

### Tier 1 — Approved Decisions

- Checked selections in `MILESTONE_ONE_DECISIONS.md`.
- Approved entries in `KINWARD_DECISION_LOG.md`.

Tier 1 governs the applicable requirement until the approved decision is propagated into Tier 2.

### Tier 2 — Current Core Requirements

- `PRODUCT_SPEC.md`
- `FAMILY_ROLES.md`
- `PERMISSIONS.md`
- `MEDICAL_SAFETY.md`
- `AGENTS.md`

Approved Tier 1 decisions must be propagated into every affected Tier 2 document.

### Tier 3 — Supporting Plans and Examples

- `MVP_ROADMAP.md`
- `PRE_BUILD_DECISIONS.md`
- `TEST_FAMILY_OVERVIEW.md`
- `README.md`
- `milestone-one/` planning package
- `REAL_FAMILY_BETA_READINESS.md`

Tier 3 explains, sequences, or tests requirements but does not override Tier 1 or Tier 2.

### Tier 4 — Tracking and Historical Analysis

- `KINWARD_FIX_PUNCH_LIST.md`
- `DEFERRED_BACKLOG.md`
- Audit reports and audit attachments

Audit and tracking records identify findings and future work. They do not automatically change product requirements.

## Governance Rules

1. An audit observation or punch-list item does not become a requirement until corrected in the appropriate governing document or approved through Tier 1.
2. Approved decisions must be propagated into every affected Tier 2 document and any Tier 3 document that describes or tests the behavior.
3. Until propagation is complete, the applicable Tier 1 decision governs.
4. Conflicts are recorded and escalated; they are not silently interpreted or resolved by convenience.
5. Medical, legal, privacy, security, child-safety, and authority questions require the approval or qualified review named by their governing decision.
6. Rejected alternatives remain only when useful for traceability and must be labeled “Not selected,” “Rejected,” or “Historical finding.”
7. Current planning documents must display a title, status, version, last-updated date, and governing or related decision identifiers. Historical audit reports are not rewritten solely to add metadata.
8. A repaired finding is marked “Ready for Audit,” not “Closed,” until a targeted re-audit verifies its acceptance criteria.

## Conflict Record

When a conflict is found, record:

- the documents and exact statements in conflict;
- the applicable source-of-truth tiers;
- the relevant decision or finding identifiers;
- the safer temporary restriction, if an approved decision already requires one;
- the owner and named gate for resolution; and
- the propagation or re-audit status.

Do not create a new role, permission, medical rule, legal conclusion, privacy exception, or authority transfer merely to reconcile wording.

### GOV-001 — Accessibility and Staged Professional Reviews

- **Conflict ID:** GOV-001
- **Documents involved:** `PRE_BUILD_DECISIONS.md`; `MVP_ROADMAP.md`; `KINWARD_DECISION_LOG.md` D-6
- **Conflict:** Accessibility approval and later-stage professional reviews were described inconsistently.
- **Governing source:** D-6 in `KINWARD_DECISION_LOG.md`
- **Resolution:** WCAG 2.2 Level AA is the approved accessibility baseline for Milestone One. Professional reviews remain staged according to feature and data risk. Later-stage reviews do not block the non-medical foundation.
- **Status:** Resolved
- **Resolution date:** 2026-07-16

### GOV-002 — OQ-01 Through OQ-10 Resolution Propagation

- **Conflict ID:** GOV-002
- **Documents involved:** `KINWARD_DECISION_LOG.md`; `milestone-one/OPEN_DESIGN_QUESTIONS.md`; affected Tier 2 and Tier 3 documents
- **Governing source:** D-8 through D-17 in `KINWARD_DECISION_LOG.md`
- **Resolution:** OQ-01 through OQ-10 are resolved by D-8 through D-17. Affected requirements and tests must use the approved answers. D-1 through D-7 remain unchanged. No update authorizes coding, provisioning, real-data entry, beta launch, document uploads, or a compliance claim.
- **Status:** Closed — Verified by the 2026-07-16 targeted systems audit after F-A-04 propagation repair
- **Propagation date:** 2026-07-16

Closure records planning verification only. It does not authorize implementation, provisioning, real-data entry, the restricted real-family beta, document uploads, or a compliance claim. Gate A, B, C, and D requirements and all deferred branches remain in force.

### GOV-003 — Low-Fidelity Design Repair Verification and High-Fidelity Phase Authorization

- **Documents involved:** `milestone-one/WIREFRAME_SPEC.md`; `milestone-one/visual-wireframes/`; `MILESTONE_ONE_READINESS.md`; `KINWARD_FIX_PUNCH_LIST.md`
- **Audit verdict:** PASSED — SIX DESIGN REPAIRS VERIFIED
- **Verified repairs:** DR-V1A, DR-V2A, DR-V3A, DR-V4A, DR-D16A, and DR-META1
- **Product-owner decision:** Approved to begin high-fidelity visual design for the non-medical Milestone One foundation.
- **Authorized scope:** Visual styling, layout refinement, responsive behavior, component appearance, typography, spacing, visual hierarchy, interaction-state presentation, accessibility presentation, and draft high-fidelity prototypes based on the verified 39-screen low-fidelity set.
- **Excluded scope:** Application or production-component implementation, backend development, authentication configuration, packages, databases, storage, infrastructure, environments, real information, document uploads, medical functionality, and restricted real-family beta activity.
- **Status:** High-fidelity phase authorized by product owner — design only
- **Decision date:** 2026-07-17

High-fidelity outputs remain draft until reviewed. No final interface design is approved. Application coding remains unauthorized, Milestone One remains non-medical, and Gate A, Gate B, Gate C, and Gate D restrictions remain in force.

### GOV-004 — Milestone One UF-01, UF-03, and UF-04 Screen Traceability

- **Conflict ID:** GOV-004
- **Documents involved:** `milestone-one/USER_FLOWS.md`; `milestone-one/visual-wireframes/WIREFRAME_INDEX.md`; `milestone-one/high-fidelity/HIGH_FIDELITY_INDEX.md`; high-fidelity specifications for Screens 4 and 6–10
- **Conflict:** The visual-wireframe index associated Screen 4 with UF-02 even though first-Circle creation is substantively defined by UF-01. It also associated Screens 6–7 with UF-03 and Screens 8–12 with UF-04, while `USER_FLOWS.md` canonically defines ordinary adult invitation as UF-04 and adult Care Recipient ownership proposal as UF-03.
- **Source-of-truth tiers:** The conflicting records are Tier 3. No Tier 1 or Tier 2 behavior conflicts and no product behavior changes.
- **Canonical substantive mapping:** Screen 4 → UF-01; Screens 6–7 → UF-04, with UF-05 for invitation lifecycle where applicable; Screens 8–12 → UF-03.
- **Resolution:** Correct the affected indexes and high-fidelity screen traceability, retain this conflict record instead of silently swapping identifiers, and leave all approved screen behavior unchanged.
- **Owner and gate:** Kinward product owner; targeted Batch One design re-audit.
- **Status:** Ready for Audit — documentation-only propagation applied 2026-07-17

### GOV-005 — Membership-Only Adult Invitation Path

- **Conflict ID:** GOV-005
- **Documents involved:** `milestone-one/USER_FLOWS.md` UF-04 and UF-05; `milestone-one/PERMISSION_MODEL.md`; Screen 6 low- and high-fidelity specifications; `DEFERRED_BACKLOG.md`
- **Unresolved item:** Current governing sources describe invitation acceptance creating membership and approved proposed assignments, but do not decide whether Screen 6 may send an invitation with no role or Care Recipient-specific access selected.
- **Source-of-truth tiers:** Existing behavior documents are Tier 3 and do not contain an approved Tier 1 policy for this branch.
- **Temporary restriction:** Batch One high-fidelity evidence demonstrates only already-supported invitations with an authorized Circle-wide and/or exact Care Recipient-specific assignment. Membership-only invitation is excluded from the evidence. This exclusion neither approves nor rejects a future membership-only path.
- **Owner and gate:** Kinward product owner with privacy and permission review; resolve before designing or implementing a membership-only branch.
- **Status:** Open governance item — excluded from Batch One; also tracked in `DEFERRED_BACKLOG.md`

### GOV-006 — Milestone One Application Coding Authorization

- **Record ID:** GOV-006
- **Governing source:** D-18 in `KINWARD_DECISION_LOG.md`
- **Product-owner decision:** Approved to begin application implementation of the non-medical Milestone One foundation.
- **Visual source of truth:** The verified thirty-nine-screen high-fidelity design package and governing product documentation.
- **Authorized scope:** User accounts and verified-email identity; multiple Family Circles; multiple Care Recipients per Circle; Circle membership and invitations; Circle-wide and Care Recipient-specific roles; Self-Managed, Shared Management, and Delegated Management modes; managed minor profiles; role- and grant-based permission enforcement; delegation records; authority and permission audit history; and the accessible mobile-first application shell.
- **Required invariants:** Deny-by-default authorization; Care Recipient ownership; Circle and recipient isolation; neutral denial behavior; context clearing; stale-response protection; accessibility requirements; and the approved audit trail.
- **Excluded scope:** Patient or Caregiver Check-Ins; symptoms, medications, treatment tracking, medical alerts, diet, or exercise; medical interpretation or recommendations; document or medical-record uploads; real-family beta activity; production deployment; and public release.
- **Sequencing:** Follow `milestone-one/IMPLEMENTATION_PLAN.md` slices unless the product owner directs otherwise.
- **Status:** Milestone One application coding authorized by product owner
- **Decision date:** 2026-07-17

Gate B, Gate C, and Gate D restrictions remain in force for later stages. The restricted real-family beta remains unauthorized. Secure document sharing remains outside Milestone One. GOV-005 remains open; membership-only adult invitation remains excluded without deciding future policy.

## 2026-07-17 Full High-Fidelity Package Authorization Record

- **Product-owner authorization:** The verified eleven-screen representative package, verified seven-screen Batch One package, and verified design-system/accessibility direction are the visual source of truth for completing the remaining twenty-one static Milestone One high-fidelity screens.
- **Authorized output:** Static Markdown specifications, SVG review boards, PNG review evidence, traceability, and design-governance documentation for all 39 screens.
- **Package status:** The eleven representative and seven Batch One screens retain verified status. Screens 11, 12, 14–23, 25, 26, 28–30, 33, 34, 36, and 37 are draft pending final package audit.
- **Audit boundary:** Assembly does not mean the 21 new screens are approved or verified, and the complete package has not passed the final consistency, completeness, accessibility, permission-safety, and visual-design audit.
- **Implementation boundary:** Historical note — this high-fidelity package authorization covered design only. Application coding is separately authorized by D-18 / GOV-006 within Milestone One foundation scope and exclusions.
- **Open governance:** GOV-004 trace remains preserved. GOV-005 remains open and the membership-only adult invitation path remains excluded without deciding future policy.
