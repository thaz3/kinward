# Kinward Decision Log

> **Status:** Approved product-owner decisions; D-8 through D-17 closed and verified; D-18 Milestone One coding authorized
> **Version:** 0.2
> **Last updated:** 2026-07-17
> **Governing or related decisions:** D-1 through D-18

Product-owner decisions arising from the Kinward planning audit. Each status records the current disposition. Professional medical, legal, privacy, security, accessibility, and child-safety review remains required at the stages stated below.

## D-1 — Delegation Expiration

- **Decision ID:** D-1, tracing to F-01
- **Question requiring approval:** Must every delegation have an expiration date, or may expiration be optional while lifecycle fields and immediate revocation remain required?
- **Why it matters:** The milestone sheet originally recommended a required 90-day expiration, but the selected alternative makes expiration optional. `PRODUCT_SPEC.md`, `PERMISSIONS.md`, and `FAMILY_ROLES.md` also describe expiration as optional. This affects the schema, renewal workflow, and forgotten-access risk.
- **Available options:** Require expiration with 90 days prefilled; make expiration optional while preserving lifecycle states and immediate revocation; or omit expiration entirely.
- **Recommended privacy-preserving MVP default:** Make expiration optional, but recommend and prefill 90 days. For grants without expiration, require a recurring 90-day access-review reminder. Always support active, suspended, expired, and revoked states, immediate suspension or revocation, permission removal, audit history, and session invalidation where technically possible.
- **Approved decision:** Expiration is optional. Prefill and recommend 90 days, while allowing the Care Recipient to deliberately select “Until revoked.” Every delegation supports active, suspended, expired, and revoked states. A delegation without an expiration generates a recurring 90-day access-review reminder. Immediate suspension or revocation, permission removal, audit history, and session invalidation where technically possible remain required. No family relationship, including spouse, creates an automatic exception.
- **Main tradeoff:** Optional expiration reduces friction during long care periods but increases the risk of forgotten access.
- **Documents affected:** `MILESTONE_ONE_DECISIONS.md` decision 6; `PRODUCT_SPEC.md` section 4.1; `PERMISSIONS.md`; `FAMILY_ROLES.md`
- **Latest point by which it must be decided:** Decided; corresponding schema and permission documents must be revised before milestone-one coding
- **Status:** Approved with modification

## D-2 — Self-Managed Meaning and Record Ownership

- **Decision ID:** D-2, tracing to audit sections 7 and 18 blockers
- **Question requiring approval:** Confirm what Self-Managed mode permits and whether an adult Care Recipient record has one owner or joint owners.
- **Why it matters:** Decisions 2 and 9 in `MILESTONE_ONE_DECISIONS.md` were originally unchecked with alternatives recorded. Both define foundational ownership and permission behavior that cannot be inferred safely.
- **Available options:** For Self-Managed, let the Care Recipient control management while others retain non-management coordination roles, or prohibit other roles entirely. For ownership, use sole Care Recipient ownership with grants, or joint ownership with explicit co-owner, independent-action, conflict, withdrawal, and removal rules.
- **Recommended privacy-preserving MVP default:** Use the recommended Self-Managed model: others may hold coordination or care roles but gain no management permission. Keep the Care Recipient as sole owner and use Shared or Delegated Management grants for assistance.
- **Approved decision:** An adult Care Recipient is the sole owner of their record. In Self-Managed mode, other people may retain non-management coordination or care roles, but those roles grant no management access to the Care Recipient’s private information. Other-adult access exists only through explicit role permissions, Shared Management grants, Delegated Management grants, or separately recorded legal authority handled through the approved review process. Family relationship alone creates no access. Joint ownership of an adult Care Recipient record is excluded from the MVP.
- **Main tradeoff:** Sole ownership with explicit grants provides clearer privacy boundaries but requires more setup and exceptional-review workflows than joint ownership.
- **Documents affected:** `MILESTONE_ONE_DECISIONS.md` decisions 2 and 9; `PERMISSIONS.md`; `FAMILY_ROLES.md`
- **Latest point by which it must be decided:** Decided; corresponding ownership, role, and grant documents must be revised before milestone-one coding
- **Status:** Approved

## D-3 — Shared-Household Context and Content

- **Decision ID:** D-3, tracing to F-03 and F-06
- **Question requiring approval:** What context, header state, ownership rule, and responsible-lead routing apply to a shared household item with no active Care Recipient, including mixed-owner approval?
- **Why it matters:** Multiple Care Recipients are in scope, while a shared household task intentionally belongs to no single Care Recipient. An undefined context risks cross-recipient information leakage, and undefined lead routing risks misdirected or undeliverable updates.
- **Available options:** Add an explicit “Shared household — no active Care Recipient” context and routing rule; require duplicate Care Recipient-specific tasks and prohibit true shared tasks; or postpone shared-task multi-owner handling.
- **Recommended privacy-preserving MVP default:** Define an explicit Shared Household context with no active Care Recipient. Keep person-specific sensitive tasks outside that context and do not build mixed-owner sensitive-content approval in the MVP.
- **Approved decision:** Create an explicit “Shared Household” context with no active Care Recipient. Shared Household items may cover general meals, groceries, laundry, household cleaning, general transportation logistics, and household coverage. They must not contain diagnoses, symptoms, medications, private caregiver information, or other person-specific sensitive information. Sensitive tasks belong to the relevant Care Recipient. Do not build a mixed-owner sensitive-content approval workflow in the MVP. Each shared task has a creator, optional assignee, status, and due information when applicable. Routing is governed by D-7.
- **Main tradeoff:** An explicit shared context is clearer and safer but adds interface, permission, and test states.
- **Documents affected:** `MILESTONE_ONE_DECISIONS.md` decision 11; `PERMISSIONS.md` permission-context and record-level rules; `TEST_FAMILY_OVERVIEW.md` sections 5, 13, and 18 decision 8; `PRE_BUILD_DECISIONS.md` A11
- **Latest point by which it must be decided:** Decided; context and terminology must be reflected before shared-household or multi-Care Recipient task wireframes
- **Status:** Approved with modification

## D-4 — Backup Circle Administrator Activation

- **Decision ID:** D-4, tracing to F-04
- **Question requiring approval:** Is the Backup Circle Administrator continuously active or dormant until activation, and when is identity verification required?
- **Why it matters:** `FAMILY_ROLES.md` required verification before access was activated, while the earlier milestone wording implied continuously available limited authority. This affected continuity, recovery, least privilege, and acceptance tests.
- **Available options:** Keep the role active with verification at designation; keep it dormant until a defined activation event and verify at activation; or omit it from milestone one.
- **Recommended privacy-preserving MVP default:** Keep it dormant until activation, verify identity and account ownership at designation, and require controlled approval plus strong reauthentication at activation.
- **Approved decision:** The Backup Circle Administrator is dormant by default and has no usable backup-administrator permissions while dormant. Identity and account ownership are verified at designation. Activation requires approval from an authorized Circle Head or an approved recovery process, strong reauthentication, a recorded reason, and an audit entry. The backup cannot self-activate solely by claiming the Circle Head is unavailable. Activation, actions, suspension, and deactivation are audited.
- **Main tradeoff:** Dormant-first access lowers standing risk but slows help during a genuine Circle Head absence.
- **Documents affected:** `FAMILY_ROLES.md`; `MILESTONE_ONE_DECISIONS.md` decision 16; `PERMISSIONS.md`
- **Latest point by which it must be decided:** Decided; activation and verification rules must be reflected before coding the Backup Circle Administrator slice
- **Status:** Approved with modification

## D-5 — Circle Today Summary Visibility

- **Decision ID:** D-5, tracing to F-05
- **Question requiring approval:** Which roles may see Patient and Caregiver summary cards on Circle Today, and should Extended Circle members see neither?
- **Why it matters:** Circle Today is described for every authenticated adult, but per-role visibility for these sensitive summary cards is not explicit. The gap could expose medical or caregiver information through a shared feed.
- **Available options:** Show each card only to viewers with the relevant owner-approved scope; or show summaries to every adult Circle member.
- **Recommended privacy-preserving MVP default:** Show Patient Today summary cards only to viewers with the relevant Care Recipient-specific permission. Apply the caregiver author’s sharing preference to Caregiver Today summary cards. Show neither to Extended Circle by default.
- **Approved decision:** Patient Today summary cards are visible only to viewers with the relevant Care Recipient-specific permission. Caregiver Today summary cards follow the caregiver author’s sharing preference. Extended Circle members see neither card by default and may receive only manually approved family-safe Circle Updates. Permission to see one Care Recipient’s summary does not grant access to another Care Recipient’s summary.
- **Main tradeoff:** Strict filtering adds rendering and permission logic but preserves medical and caregiver isolation.
- **Documents affected:** `TEST_FAMILY_OVERVIEW.md` section 5; `PRODUCT_SPEC.md` section 5.1; `PERMISSIONS.md` record-level rules
- **Latest point by which it must be decided:** Decided; corresponding visibility rules must be revised before Circle Today, Patient Today, or Caregiver Today summary work
- **Status:** Approved

## D-6 — Named Review Owners and Required Approvals

- **Decision ID:** D-6, tracing to audit section 7 missing decisions and `TEST_FAMILY_OVERVIEW.md` section 18 decision 1
- **Question requiring approval:** Who owns Kinward product decisions, and which professional reviews are required before milestone one, health-data storage, check-in development, beta, and public release?
- **Why it matters:** Review requirements should match the risk of each development stage without implying that unassigned professional reviewers have approved work.
- **Available options:** Require every external reviewer before any coding; use staged governance tied to feature and data risk; or proceed without formal review gates.
- **Recommended privacy-preserving MVP default:** Use staged governance, name the founder representing First & 8th as product owner by function, and leave qualified reviewer functions marked “Unassigned” until selected.
- **Approved decision:** The Kinward product owner is the founder representing First & 8th. Do not require every external professional reviewer before building the non-medical milestone-one foundation. Before milestone-one coding, require product-owner approval, privacy and permission review against approved Kinward requirements, accessibility baseline approval, and confirmation that development uses no real patient data. Before Patient and Caregiver Check-In development, require medical-safety review of questions, wording, information sources, and escalation boundaries. Before storing real family health data, require security and privacy architecture review. Before public beta or App Store release, require qualified legal/privacy, child-safety, accessibility, and security review. Reviewer functions may remain marked “Unassigned” until qualified reviewers are selected. Do not invent reviewer names or credentials.
- **Main tradeoff:** Formal sign-off adds process overhead but creates clear accountability for high-risk decisions.
- **Documents affected:** `PRE_BUILD_DECISIONS.md` Sections A and B; `MVP_ROADMAP.md` Phase 0; `TEST_FAMILY_OVERVIEW.md` sections 18 and 19
- **Latest point by which it must be decided:** Decided as staged gates; each named gate must be completed before its corresponding work begins
- **Status:** Approved with staged governance

## D-7 — Shared-Household Task Routing Vocabulary

- **Decision ID:** D-7, tracing to F-17
- **Question requiring approval:** Which existing role receives unassigned, declined, or overdue Shared Household tasks, and what happens if no one holds that role?
- **Why it matters:** Earlier planning used an incorrect alternate label and implied a generic task-level routing role. Routing must use canonical roles without creating hidden authority.
- **Available options:** Route to the Circle-wide Family Coordinator queue; require direct assignment when created; or create a new coordination role.
- **Recommended privacy-preserving MVP default:** Route unassigned, declined, or overdue non-sensitive Shared Household tasks to the Circle-wide Family Coordinator and use a visible missing-lead state when none exists.
- **Approved decision:** The earlier alternate label was incorrect and referred to the existing Family Coordinator role. Do not create a separate Circle-wide coordination role or a generic task-level routing role. Unassigned, declined, or overdue Shared Household tasks route to the Circle-wide Family Coordinator queue. If no active Circle-wide Family Coordinator exists, show the exact state “No routing lead assigned.” A Circle Head may see that missing-lead state and either assign a Family Coordinator or directly assign the non-sensitive task. Shared Household tasks have a creator, optional assignee, status, and due-date information where applicable.
- **Main tradeoff:** Reusing Family Coordinator keeps authority understandable, but a Circle without that role requires a visible manual step by a Circle Head.
- **Documents affected:** `PRODUCT_SPEC.md`, `FAMILY_ROLES.md`, `PERMISSIONS.md`, `MILESTONE_ONE_DECISIONS.md`, `PRE_BUILD_DECISIONS.md`, `MVP_ROADMAP.md`, and `TEST_FAMILY_OVERVIEW.md`
- **Latest point by which it must be decided:** Decided; must be reflected before task workflow design
- **Status:** Approved

## D-8 — Adult Authentication Channel

- **Decision ID:** D-8, resolving OQ-01
- **Approved decision:** Milestone One uses verified email as its only authentication, invitation-binding, and account-verification channel. SMS login, phone OTP, phone recovery, and SMS invitation delivery are deferred. Phone numbers may later be contact information, but not Milestone One identity credentials. The identity model remains separate from contact methods so another verified channel can be added without redesigning account ownership.
- **Gate:** Gate A before authentication coding.
- **Status:** Closed — Verified by targeted systems audit

## D-9 — Adult Care Recipient Ownership Invitation

- **Decision ID:** D-9, resolving OQ-02
- **Approved decision:** Proposing another adult as a Care Recipient creates an inactive pending Care Recipient record, a dedicated ownership invitation bound to the proposed owner's verified email, and a separate ownership-acceptance record with consent history. No private Care Recipient information may be entered before acceptance. Acceptance activates sole ownership and Circle membership without a second ordinary invitation. The invitation identifies the Circle, proposer, sole-ownership effect, permissions and consequences, and right to decline.
- **Gate:** Gate A before the Care Recipient activation slice.
- **Status:** Closed — Verified by targeted systems audit

## D-10 — Recent and Strong Reauthentication

- **Decision ID:** D-10, resolving OQ-03
- **Approved decision:** Adults may remain signed in on trusted personal devices for routine authorized access. Consequential authority actions require authentication completed within the prior 15 minutes. Backup activation, account recovery, future top-level authority transfer, and any action later classified as strong require a fresh provider-supported challenge every time. Biometrics are optional device convenience, never mandatory.
- **Gate:** Gate A security and permission confirmation before affected coding.
- **Status:** Closed — Verified by targeted systems audit

## D-11 — Backup Recovery Branch

- **Decision ID:** D-11, resolving OQ-04
- **Approved decision:** Milestone One implements Backup Circle Administrator activation only with approval by an authorized Circle Head. The backup cannot self-activate. If no authorized Circle Head is available, Kinward shows a neutral unavailable message and does not implement an alternate recovery branch. Kinward does not determine incapacity, death, succession, disputed control, legal authority, or replacement authority. Architecture may record the approval source for a future qualified pathway.
- **Gate:** Named recovery and qualified-authority review before any alternate activation branch.
- **Status:** Closed — Verified by targeted systems audit; deferred branch remains deferred

## D-12 — Audit-History Retention

- **Decision ID:** D-12, resolving OQ-05
- **Approved decision:** During Milestone One development and controlled testing, all synthetic audit events remain for the life of their test environment. Individual events are not automatically deleted while it is active. A documented reset or retirement may delete the complete synthetic dataset. Audit events include timestamps and a configurable retention classification. No production retention duration is selected.
- **Gate:** Gate C before production or real-family retention automation.
- **Status:** Closed — Verified by targeted systems audit; production retention remains a Gate C decision

## D-13 — First-Family Device and Accessibility Matrix

- **Decision ID:** D-13, resolving OQ-06
- **Approved decision:** First-family testing uses both Care Recipients' actual iPhones with Safari, VoiceOver, Dynamic Type and enlarged text, contrast settings, portrait forms, focus, labels, errors, and touch targets; the integral nurse team member's actual Android phone with Chrome, TalkBack, font and display scaling, portrait forms, focus, labels, errors, and touch targets; and one current desktop browser with keyboard-only navigation, visible focus, forms, errors, and text resizing. Exact models and software versions are recorded before execution. Working iPhone and Android experiences are required before the restricted real-family beta; broader coverage remains required at Gate D.
- **Gate:** First-family testing plan; broader independent accessibility review remains Gate D.
- **Status:** Closed — Verified by targeted systems audit

## D-14 — Last Active Circle Head Continuity

- **Decision ID:** D-14, resolving OQ-07
- **Approved decision:** The last active Circle Head cannot leave, remove their own role, be removed, or be downgraded until another verified adult accepts Circle Head. Kinward shows a clear blocking message. The Backup Circle Administrator never becomes Circle Head automatically. Exceptional cases use the approved backup activation path or a separately reviewed future recovery process. The data and permission model must enforce this invariant.
- **Gate:** Gate A before Circle Head or membership-removal coding.
- **Status:** Closed — Verified by targeted systems audit

## D-15 — Authorization-Denial Audit Threshold

- **Decision ID:** D-15, resolving OQ-08
- **Approved decision:** Family-visible audit history includes consequential denied attempts involving roles, permissions, grants, delegations, management modes, Circle authority, Circle archival, backup activation, and comparable authority changes. Routine denied reads do not appear there; when appropriate, they enter privacy-safe security or operational logs without private content or unauthorized sensitive identifiers. Architecture separates family audit, security events, and operational logs.
- **Gate:** Gate A privacy and permission confirmation before audit implementation.
- **Status:** Closed — Verified by targeted systems audit

## D-16 — “Until Revoked” Review-Due Experience

- **Decision ID:** D-16, resolving OQ-09
- **Approved decision:** At each recurring 90-day review date, an “Access review due” item appears in My Kinward, the relevant Care Recipient permission summary, and delegation detail. It remains until the Care Recipient continues, modifies, suspends, or revokes access; completion resets the next review by 90 days. Milestone One sends no email, SMS, or push reminder. Records include next and last review dates, reviewer, decision, and audit history.
- **Gate:** Gate A before delegation-review interface coding.
- **Status:** Closed — Verified by targeted systems audit

## D-17 — Environments and Restricted Real-Family Beta

- **Decision ID:** D-17, resolving OQ-10
- **Approved decision:** Kinward plans three isolated environment types: local synthetic development; controlled hosted synthetic preview, clearly test-labeled and prohibited from actual care or real health information; and a separate invite-only restricted real-family beta called “Restricted real-care family pilot.” Real family or health information is prohibited until Gate C is completed and approved. Each real-data environment requires separate configuration, credentials, database and storage resources, logs, and access controls, with no data path back to synthetic environments. Document sharing remains outside non-medical Milestone One and requires a separately approved secure-document design and readiness review. No platform, encryption feature, or private-storage setting alone establishes compliance or production readiness.
- **Gate:** Gate A for environment architecture; Gate C before any real information; separate secure-document readiness before scans or reports.
- **Status:** Closed — Verified by targeted systems audit; Gate C restriction remains in force

## D-18 — Milestone One Application Coding Authorization

- **Decision ID:** D-18
- **Question requiring approval:** May Kinward begin application implementation of the approved non-medical Milestone One foundation?
- **Why it matters:** D-6 and Gate A require explicit product-owner coding authorization before frameworks, packages, databases, authentication, or application code. Prior authorizations covered planning, architecture, wireframes, and high-fidelity design only.
- **Approved decision:** Application implementation of the approved Kinward Milestone One scope is authorized, using the verified thirty-nine-screen high-fidelity design package and governing product documentation.
- **Authorized scope:** User accounts and verified-email identity; multiple Family Circles; multiple Care Recipients per Circle; Circle membership and invitations; Circle-wide and Care Recipient-specific roles; Self-Managed, Shared Management, and Delegated Management modes; managed minor profiles; role- and grant-based permission enforcement; delegation records; authority and permission audit history; and the accessible mobile-first application shell.
- **Required invariants:** Deny-by-default authorization; Care Recipient ownership; Circle and recipient isolation; neutral denial behavior; context clearing; stale-response protection; accessibility requirements; and the approved audit trail.
- **Explicit exclusions:** Patient or Caregiver Check-Ins; symptoms, medications, treatment tracking, medical alerts, diet, or exercise; medical interpretation or recommendations; document or medical-record uploads; real-family beta activity; production deployment; and public release. Any expansion beyond Milestone One requires separate product-owner approval.
- **Gate A confirmation:** Product-owner approval is recorded by this decision. Privacy and permission review against approved Kinward requirements, WCAG 2.2 Level AA baseline, and synthetic-data-only development were previously confirmed in `MILESTONE_ONE_READINESS.md`. Gate B, Gate C, and Gate D restrictions remain in force for later stages.
- **Documents affected:** `AGENTS.md`; `MILESTONE_ONE_READINESS.md`; `DOCUMENT_GOVERNANCE.md`; `milestone-one/IMPLEMENTATION_PLAN.md`; `milestone-one/TECHNICAL_ARCHITECTURE.md`; `README.md`; `MVP_ROADMAP.md`
- **Decision date:** 2026-07-17
- **Status:** Approved — Milestone One application coding authorized

## Propagation Record

These decisions are approved in this log. The corresponding revisions below were applied on 2026-07-16 and were verified by the applicable targeted read-only systems audits under F-01-R, F-02-R, F-17, F-18, F-19, and F-A-04:

- **`MILESTONE_ONE_DECISIONS.md`:** Decisions 2 and 9 are checked; decision 6 uses optional expiration, the 90-day recommended prefill and recurring access-review reminder, and “Until revoked”; decision 16 preserves dormant-by-default activation.
- **`PRODUCT_SPEC.md`:** Aligned delegation review, sole ownership, Shared Household boundaries and routing, summary visibility, and staged governance.
- **`PERMISSIONS.md`:** Aligned sole ownership, management grants, delegation lifecycle, Shared Household scope, backup activation, and summary isolation.
- **`FAMILY_ROLES.md`:** Aligned Self-Managed boundaries, sole ownership, delegation review, Family Coordinator routing, and dormant backup activation.
- **`PRE_BUILD_DECISIONS.md`:** Added explicit Section A statuses, Shared Household restrictions and routing, and D-6 staged gates.
- **`TEST_FAMILY_OVERVIEW.md`:** Added aligned Shared Household, backup activation, summary visibility, delegation lifecycle, and staged-governance scenarios.
- **`MVP_ROADMAP.md`:** Uses D-6's staged governance sequence rather than requiring every professional reviewer before the non-medical foundation.

D-7 resolves the stale routing vocabulary. The canonical role is Family Coordinator; no new administrator, routing, or superuser role is created.

D-8 through D-17 resolve OQ-01 through OQ-10. After the F-A-04 email-only invitation-binding propagation repair, the 2026-07-16 targeted read-only re-audit verified and closed them for planning purposes. D-1 through D-7 are unchanged. “Closed” does not mean implementation is complete.

D-18 authorizes Milestone One application coding within the stated foundation scope and exclusions. It does not authorize medical features, document uploads, real-family beta activity, production deployment, or public release.

## 2026-07-16 Targeted Systems Audit Record

- **Audit type:** Targeted read-only re-audit of D-8 through D-17 and OQ-01 through OQ-10
- **Verdict:** PASSED WITH NON-BLOCKING NOTES
- **Decision results:** D-8 passed subject to the now-completed F-A-04 propagation repair; D-9 through D-16 passed; D-17 passed with a non-blocking environment-wording note.
- **Open-question results:** OQ-01 through OQ-10 were correctly resolved and linked to D-8 through D-17 and are closed for planning purposes.
- **Coverage and scope:** Acceptance-test coverage is complete; Milestone One scope is unchanged.
- **Restrictions:** The restricted real-family beta remains unauthorized. Gate requirements, deferred branches, professional-review requirements, real-data restrictions, and the separate secure-document readiness requirement remain in force.

## 2026-07-17 Documentation-Only Traceability Record

- **Record:** GOV-004
- **Issue:** Tier 3 screen indexes used UF identifiers that conflicted with the substantive flow definitions in `milestone-one/USER_FLOWS.md`.
- **Canonical mapping propagated:** Screen 4 → UF-01; Screens 6–7 → UF-04, with UF-05 where invitation lifecycle applies; Screens 8–12 → UF-03.
- **Disposition:** Documentation-only correction. No decision, role, permission, ownership, invitation, acceptance, or screen behavior changed.
- **Related unresolved item:** GOV-005 records the membership-only adult invitation ambiguity. Batch One excludes that path; no future policy is approved or rejected.
- **Status:** Ready for targeted Batch One design re-audit; not product approval and not implementation authorization.
