# Kinward Deferred Backlog

> **Status:** Current deferred and future work; D-8 through D-17 closed and verified by targeted systems audit
> **Version:** 0.1
> **Last updated:** 2026-07-17
> **Governing or related decisions:** D-1 through D-17; F-01-R, F-02-R, F-17 through F-19

Valid future concerns, beta and public-launch requirements, and non-blocking improvements. Medical, legal, privacy, and authority questions remain open for qualified review.

## Beta and Public-Launch Decisions

### B1 — Locked-Screen Notification Content

- Decide exact generic wording and external delivery channels.
- Preserve the default that sensitive family, medical, caregiver, appointment, spiritual, and task information does not appear on a locked screen.
- **Source:** `PRE_BUILD_DECISIONS.md` B1

### B2 — Notification Recipients and Escalation

- Decide whether any escalation beyond explicit user-directed contact is appropriate.
- Do not add automatic medical escalation, monitoring promises, or implied clinician review without professional medical-safety review.
- **Source:** `PRE_BUILD_DECISIONS.md` B2; `MEDICAL_SAFETY.md`

### B3 — Self-Service Data Export

- Design owner-scoped exports that exclude another person’s private content and preserve permission boundaries outside Kinward.
- **Source:** `PRE_BUILD_DECISIONS.md` B3

### B4 — Exact Retention and Deletion Periods

- Define retention, deletion, legal-hold, backup, cache, and succession periods with legal, privacy, security, and operational review.
- The first family test needs only a written manual cleanup plan.
- **Source:** `PRE_BUILD_DECISIONS.md` B4; `TEST_FAMILY_OVERVIEW.md` section 18 decision 12

### B5 — Offline Emergency Information

- Evaluate an encrypted, user-selected offline information card after privacy and security review.
- **Source:** `PRE_BUILD_DECISIONS.md` B5

## Open Authority, Legal, and Minor Decisions

- **Legal-document intake:** Define verification, rejection, appeal, and retention by launch region. Kinward must not declare a document legally valid. **Source:** `TEST_FAMILY_OVERVIEW.md` section 18 decision 2; remaining decisions in `PERMISSIONS.md` and `FAMILY_ROLES.md`
- **Legal-document storage:** Decide whether Kinward stores documents or only records their existence and review status. **Source:** `TEST_FAMILY_OVERVIEW.md` section 18 decision 6
- **Competing or disputed authority:** Define documented human and legal review when a Care Recipient cannot revoke or claims conflict. Kinward must not decide legal authority. **Source:** `PRE_BUILD_DECISIONS.md` A3; `TEST_FAMILY_OVERVIEW.md` section 18 decision 3
- **Incapacity, separation, death, and succession:** Preserve no automatic transfer and define a reviewed process. **Source:** `PRE_BUILD_DECISIONS.md` A16; `TEST_FAMILY_OVERVIEW.md` section 18 decision 4
- **Managed-minor transitions:** Define ownership transfer, contribution consent, and transition at adulthood. **Source:** `PRE_BUILD_DECISIONS.md` A17; `TEST_FAMILY_OVERVIEW.md` section 18 decision 5; remaining decisions in `FAMILY_ROLES.md`
- **Representative and alternate backup recovery:** D-11 excludes an alternate backup activation branch from Milestone One. Define a qualified future process without restoring unintended authority or asking Kinward to determine incapacity, death, succession, or legal control. **Source:** D-11; `PRE_BUILD_DECISIONS.md` A2
- **Conflicting healthcare-team instructions:** Define handling for conflicting or outdated entries through medical-safety review. **Source:** `TEST_FAMILY_OVERVIEW.md` section 8; `MEDICAL_SAFETY.md`

## Deferred Feature Scope

- Independent child or teen accounts
- Direct clinician accounts or healthcare-system integration
- Automated child summaries
- Medication dosing, interaction checking, or measurement interpretation
- Pump or device monitoring
- Symptom scoring, triage, or generic medical thresholds
- Mental-health crisis assessment
- Public social or fundraising features
- Broad third-party sensitive analytics
- Any HIPAA or compliance claim before documented legal, privacy, security, and operational review
- SMS login, phone OTP, phone recovery, and SMS invitation delivery
- Production or real-family audit-retention automation before Gate C
- Secure medical-document upload and sharing before its separate implementation and readiness review

**Sources:** `TEST_FAMILY_OVERVIEW.md` section 16; `MVP_ROADMAP.md`; `MEDICAL_SAFETY.md`

## Non-Blocking Improvements

- **Membership-only adult invitation path:** Decide whether an adult may be invited into a Circle without any Circle-wide role or Care Recipient-specific assignment. Current invitation behavior is unchanged. Until an approved decision is propagated, high-fidelity Batch One demonstrates only invitations with already-supported authorized assignments and does not present a membership-only option. **Source:** GOV-005; `milestone-one/USER_FLOWS.md` UF-04 and UF-05; `milestone-one/PERMISSION_MODEL.md`
- **Delegation approval timeout:** Define cancellation or expiration when a sensitive-role approval receives no response. Revisit before the delegation feature slice. **Source:** Audit sections 9 and 13
- **Illness and treatment-pattern scope:** Decide how the MVP expands beyond chemotherapy-centered testing. **Source:** `TEST_FAMILY_OVERVIEW.md` section 18 decision 15
- **Success measures:** Define privacy-preserving product measures and analytics before beta. **Source:** `PRODUCT_SPEC.md` section 11; `TEST_FAMILY_OVERVIEW.md` section 18 decision 16
- **Broader device matrix:** D-13 governs the first-family configurations. Expand independent device, browser, operating-system, screen-reader, and assistive-technology coverage before public beta or release. **Source:** D-13; Gate D

## Housekeeping

- Maintain document metadata and the source-of-truth hierarchy in `DOCUMENT_GOVERNANCE.md`.

## Traceability

- F-01-R propagates D-1 and awaits targeted re-audit.
- F-02-R verifies canonical Circle Head terminology and awaits targeted re-audit.
- F-03 and F-06 route to approved D-3; F-17 resolves Family Coordinator routing vocabulary.
- F-04 routes to D-4.
- F-05 routes to approved D-5; its propagation is tracked under F-18.
- F-07, F-09, and F-16 remain fixes.
- Governance and Section A statuses route to approved D-6 and `DOCUMENT_GOVERNANCE.md`.

No medical, legal, privacy, or authority question in this backlog is approved by this document.
