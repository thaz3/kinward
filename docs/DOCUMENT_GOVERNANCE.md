# Kinward Document Governance

> **Status:** Active document-governance policy; D-8 through D-17 propagation verified and closed for planning
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing or related decisions:** D-1 through D-17; F-01-R, F-02-R, F-17 through F-19

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
