# Kinward Fix Punch List

> **Status:** Verified finding tracker; closed items preserve historical traceability
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing or related decisions:** D-1 through D-17; F-01-R, F-02-R, F-17 through F-19; V-1 through V-5

Confirmed or probable defects requiring a documentation change. Items requiring product-owner approval are tracked separately in `KINWARD_DECISION_LOG.md`.

## F-02 — Admin-Role Vocabulary Conflict

- **Finding ID:** F-02
- **Short title:** Undefined or aliased admin role
- **Severity:** High
- **Classification:** Cross-document contradiction
- **Documents or workflows affected:** `MILESTONE_ONE_DECISIONS.md` decisions 1, 8, 15, and 16; `PERMISSIONS.md` role matrix and narrative rules; `FAMILY_ROLES.md`; `PRODUCT_SPEC.md` section 4; Roles & Permissions and audit workflows
- **Exact problem:** The canonical role is “Circle Head,” but “Circle Administrator” and “Primary Circle Administrator” also appear in permission and audit-visibility rules without a consistent definition. It is unclear whether they are aliases or separate roles.
- **Recommended correction:** Use Circle Head as the only active top-level Circle authority role. Remove or replace the stale administrator labels where Circle Head is intended, keep Family Coordinator distinct, and preserve Backup Circle Administrator as a separate dormant contingency role.
- **Acceptance criteria:** Every permission, audit-visibility, and disputed-authority rule references only roles defined in `FAMILY_ROLES.md` and `PRODUCT_SPEC.md`. No rule uses “Circle Administrator” or “Primary Circle Administrator” unless formally defined.
- **Blocks wireframes:** Yes
- **Blocks first coding milestone:** Yes
- **Dependencies:** None; blocks F-08
- **Suggested owner:** Product owner for the permission model
- **Resolution:** Replaced active uses of “Circle Administrator” and “Primary Circle Administrator” with Circle Head where intended. Preserved Backup Circle Administrator as a separate, formally defined dormant contingency role and kept Family Coordinator distinct.
- **Status:** Closed

## F-09 — Multi-Circle Scope Self-Contradiction

- **Finding ID:** F-09
- **Short title:** Multi-Circle listed as both included and postponed
- **Severity:** Low
- **Classification:** Cross-document contradiction
- **Documents or workflows affected:** `TEST_FAMILY_OVERVIEW.md` section 16; `MVP_ROADMAP.md`; `MILESTONE_ONE_DECISIONS.md` decision 10; test scenario 26
- **Exact problem:** `TEST_FAMILY_OVERVIEW.md` section 16 lists multiple Family Circles per account as postponed, contradicting the roadmap, milestone decision sheet, scenario 26, and other MVP references.
- **Recommended correction:** Remove or correct the stray postponed-scope statement so multi-Circle membership is consistently included in the MVP.
- **Acceptance criteria:** No document lists multiple Circles per user as postponed, and all references consistently include it in MVP scope.
- **Blocks wireframes:** No
- **Blocks first coding milestone:** No
- **Dependencies:** None
- **Suggested owner:** Product owner or documentation maintainer
- **Resolution:** Removed the contradictory postponed-scope bullet. Current planning consistently includes multiple Circles per user with strict Circle isolation.
- **Status:** Closed

## F-07 — Symptom-Check Label Inconsistency

- **Finding ID:** F-07
- **Short title:** Inconsistent Daily Symptom Check naming
- **Severity:** Low
- **Classification:** Terminology defect
- **Documents or workflows affected:** `TEST_FAMILY_OVERVIEW.md` section 8, glossary, and scenario 6; `PRODUCT_SPEC.md` section 5.4; `MEDICAL_SAFETY.md`; future Patient Check-In workflows
- **Exact problem:** The same Patient Check-In section is called “Daily Symptom Check,” “daily symptom check,” and “daily journal.”
- **Recommended correction:** Use Daily Care Check as the umbrella, Patient Check-In and Caregiver Check-In as its two check-ins, and Symptoms as a section inside Patient Check-In. Update the glossary and remove competing feature labels.
- **Acceptance criteria:** One canonical term is defined and used consistently, with no undefined synonyms remaining.
- **Blocks wireframes:** No
- **Blocks first coding milestone:** No
- **Dependencies:** None
- **Suggested owner:** Product owner or documentation maintainer
- **Resolution:** Standardized current product terminology to Daily Care Check, Patient Check-In, Caregiver Check-In, and Symptoms as a Patient Check-In section. Updated the glossary and scenarios.
- **Status:** Closed

## F-08 — Support Rule Depends on Admin Vocabulary

- **Finding ID:** F-08
- **Short title:** Circle-superuser testability depends on F-02
- **Severity:** Low
- **Classification:** Consistency defect
- **Documents or workflows affected:** `MILESTONE_ONE_DECISIONS.md` decisions 16 and 19; support-access permission checks
- **Exact problem:** The “no hidden Circle superuser” requirement cannot be tested cleanly while administrator terminology remains ambiguous.
- **Recommended correction:** Use only canonical role names and state that no Circle role, support function, or internal Kinward account receives undocumented or automatic access. Express the rule as deny-by-default authorization criteria without creating a superuser role.
- **Acceptance criteria:** The support-access rule references only defined roles and can be converted directly into a permission test.
- **Blocks wireframes:** No
- **Blocks first coding milestone:** No
- **Dependencies:** F-02
- **Suggested owner:** Product owner for the permission model
- **Resolution:** Rewrote support requirements using Circle Head, Backup Circle Administrator, Family Coordinator, and explicit permission scopes. Added deny-by-default language suitable for authorization tests without creating a superuser role.
- **Status:** Closed

## F-16 — Stale Accessibility Target Wording

- **Finding ID:** F-16
- **Short title:** Product specification still says the target must be chosen
- **Severity:** Low
- **Classification:** Documentation implementation drift
- **Documents or workflows affected:** `PRODUCT_SPEC.md` section 9; `MILESTONE_ONE_DECISIONS.md` decision 21; `PRE_BUILD_DECISIONS.md` A18; `TEST_FAMILY_OVERVIEW.md` section 19; accessibility acceptance workflow
- **Exact problem:** `PRODUCT_SPEC.md` section 9 says the accessibility conformance target must be chosen before implementation, although WCAG 2.2 AA is selected elsewhere.
- **Recommended correction:** Update `PRODUCT_SPEC.md` section 9 to name WCAG 2.2 Level AA while leaving the exact device and operating-system test matrix for the first-family testing plan.
- **Acceptance criteria:** `PRODUCT_SPEC.md` names WCAG 2.2 Level AA consistently with the other planning documents.
- **Blocks wireframes:** No
- **Blocks first coding milestone:** No
- **Dependencies:** None
- **Suggested owner:** Product owner or documentation maintainer
- **Resolution:** Updated `PRODUCT_SPEC.md` and aligned current acceptance documents to WCAG 2.2 Level AA while leaving the exact test matrix for the first-family testing plan.
- **Status:** Closed

## Verified Repaired Findings

### F-01-R — Delegation Lifecycle Propagation

- **Finding ID:** F-01-R
- **Short title:** D-1 was not propagated consistently
- **Severity:** High
- **Classification:** Approved-decision propagation defect
- **Documents or workflows affected:** `MILESTONE_ONE_DECISIONS.md`, `PRODUCT_SPEC.md`, `PERMISSIONS.md`, `FAMILY_ROLES.md`, `TEST_FAMILY_OVERVIEW.md`; delegation creation, review, suspension, expiration, revocation, permission removal, session invalidation, and audit workflows
- **Exact problem:** Current requirements did not consistently express optional expiration, the recommended 90-day prefill, “Until revoked,” the four lifecycle states, and 90-day review reminders for grants without expiration.
- **Recommended correction:** Propagate D-1 verbatim enough to produce one lifecycle model and label required-expiration alternatives as not selected.
- **Acceptance criteria:** All governing documents permit optional expiration; recommend and prefill 90 days; support “Until revoked”; define active, suspended, expired, and revoked; require a recurring 90-day access-review reminder without expiration; preserve immediate permission removal, audit history, and session invalidation where technically possible; and create no family exception.
- **Blocks wireframes:** Yes, until re-audited for delegation flows
- **Blocks first coding milestone:** Yes, until re-audited for the delegation model
- **Dependencies:** D-1
- **Suggested owner:** Product owner and permission reviewer
- **Verification result:** Passed
- **Verification date:** 2026-07-16
- **Closure basis:** Latest targeted read-only systems audit
- **Status:** Closed

### F-02-R — Canonical Circle Authority Recheck

- **Finding ID:** F-02-R
- **Short title:** Stale administrator vocabulary remained after F-02
- **Severity:** High
- **Classification:** Terminology and authorization-test defect
- **Documents or workflows affected:** All current planning documents; role assignment, support access, audit visibility, recovery, and disputed-authority rules
- **Exact problem:** Stale active-authority references remained outside the documents covered by the first correction.
- **Recommended correction:** Use Circle Head as the only active top-level Circle authority role, keep Family Coordinator distinct, and preserve Backup Circle Administrator as a formally defined dormant contingency role.
- **Acceptance criteria:** No current requirement uses Circle Administrator or Primary Circle Administrator as an active role; every referenced role is formally defined in `FAMILY_ROLES.md` and `PRODUCT_SPEC.md`; Backup Circle Administrator remains distinct and dormant.
- **Blocks wireframes:** Yes, until re-audited
- **Blocks first coding milestone:** Yes, until re-audited for authorization vocabulary
- **Dependencies:** F-02 and F-08
- **Suggested owner:** Product owner and permission reviewer
- **Verification result:** Passed
- **Verification date:** 2026-07-16
- **Closure basis:** Latest targeted read-only systems audit
- **Status:** Closed

### F-17 — Shared-Household Task Routing Vocabulary

- **Finding ID:** F-17
- **Short title:** Undefined alternate routing labels
- **Severity:** High
- **Classification:** Role and workflow contradiction
- **Documents or workflows affected:** `KINWARD_DECISION_LOG.md` D-3 and D-7, `PRODUCT_SPEC.md`, `FAMILY_ROLES.md`, `PERMISSIONS.md`, `PRE_BUILD_DECISIONS.md`, `MVP_ROADMAP.md`, and `TEST_FAMILY_OVERVIEW.md`; Shared Household task routing
- **Exact problem:** Shared tasks referenced undefined alternate Circle-wide and task-level routing labels, risking a new hidden authority role.
- **Recommended correction:** Route unassigned, declined, or overdue non-sensitive Shared Household tasks to the Circle-wide Family Coordinator queue and display “No routing lead assigned” when none is active.
- **Acceptance criteria:** Shared tasks have a creator, optional assignee, status, and due-date information when applicable; no additional routing role exists; only Family Coordinator receives the queue; Circle Heads may resolve the missing-lead state without gaining sensitive access.
- **Blocks wireframes:** Yes, for task wireframes
- **Blocks first coding milestone:** No; tasks are outside milestone one
- **Dependencies:** D-3 and D-7
- **Suggested owner:** Product owner
- **Verification result:** Passed
- **Verification date:** 2026-07-16
- **Closure basis:** Latest targeted read-only systems audit
- **Status:** Closed

### F-18 — Approved Decisions D-2, D-4, and D-5 Propagation

- **Finding ID:** F-18
- **Short title:** Approved ownership, backup, and summary rules needed full propagation
- **Severity:** High
- **Classification:** Multi-decision propagation defect
- **Documents or workflows affected:** `MILESTONE_ONE_DECISIONS.md`, `PRODUCT_SPEC.md`, `FAMILY_ROLES.md`, `PERMISSIONS.md`, and `TEST_FAMILY_OVERVIEW.md`; adult ownership, management modes, backup activation, and Circle Today summaries
- **Exact problem:** D-2 and D-5 were approved but not consistently reflected; D-4 required verification that its already propagated dormant role stayed intact.
- **Recommended correction:** Propagate sole ownership and Self-Managed boundaries, preserve the verified D-4 dormant backup rules, and add explicit per-owner summary authorization requirements and tests.
- **Acceptance criteria:** D-2 propagation is **Ready for Audit**; D-4 remains **Already verified**; D-5 propagation is **Ready for Audit**. Joint ownership is labeled not selected; Self-Managed allows non-management roles without management access; other-adult access requires an explicit role permission, Shared Management grant, Delegated Management grant, or separately recorded legal authority; and summary tests cover two Care Recipients, Dad-not-Mom authorization, caregiver privacy, Extended Circle exclusion, and manually approved family-safe updates.
- **Blocks wireframes:** Yes, for ownership and summary flows
- **Blocks first coding milestone:** Yes for D-2 ownership re-audit; no for D-5 summary work outside milestone one
- **Dependencies:** D-2, D-4, and D-5
- **Suggested owner:** Product owner, permission reviewer, and accessibility reviewer for summary states
- **Component status:** D-2 — Passed; D-4 — Already verified; D-5 propagation — Verified complete as part of F-18
- **Verification result:** Passed
- **Verification date:** 2026-07-16
- **Closure basis:** Latest targeted read-only systems audit
- **Status:** Closed

### F-19 — Milestone-One Decision Selection Drift

- **Finding ID:** F-19
- **Short title:** Checked selections contradicted approved D-1 and D-2
- **Severity:** High
- **Classification:** Tier 1 decision conflict
- **Documents or workflows affected:** `MILESTONE_ONE_DECISIONS.md` decisions 2, 6, and 9 and temporary-prototype summary
- **Exact problem:** Approved defaults remained unchecked while rejected required-expiration and joint-ownership alternatives could still be read as active.
- **Recommended correction:** Check the approved defaults, label rejected alternatives “Not selected,” and make the temporary delegation wording match D-1.
- **Acceptance criteria:** Decisions 2, 6, and 9 are checked; contradictory alternatives are explicitly not selected; the temporary-default summary uses the 90-day recommended prefill and recurring access-review reminder, optional expiration, and “Until revoked.”
- **Blocks wireframes:** Yes
- **Blocks first coding milestone:** Yes, until targeted re-audit
- **Dependencies:** D-1 and D-2
- **Suggested owner:** Product owner
- **Verification result:** Passed
- **Verification date:** 2026-07-16
- **Closure basis:** Latest targeted read-only systems audit
- **Status:** Closed

F-03, F-05, and F-06 were resolved through approved D-3, D-5, and D-7. Their propagation was included in F-17 and F-18 and verified by the latest targeted read-only systems audit.

### F-A-04 — Email-Only Invitation Binding Propagation

- **Governing decision:** D-8
- **Exact problem:** Remaining active Milestone One invitation language allowed an email-or-phone destination even though D-8 makes verified email the only authentication, account-verification, and invitation-binding channel.
- **Correction:** Replaced active email-or-phone invitation language with verified-email-only binding in decision 14, permissions, the test-family flow and glossary, and wireframe screens 7 and 8. Preserved phone numbers only as possible future contact information and preserved phone authentication, OTP, recovery, and SMS delivery as deferred.
- **Verification result:** Passed with the overall audit verdict PASSED WITH NON-BLOCKING NOTES
- **Verification date:** 2026-07-16
- **Closure basis:** Targeted read-only re-audit of D-8 through D-17 and OQ-01 through OQ-10
- **Status:** Closed — Verified by targeted systems audit

## Design Readiness Audit Tracking

### V-1 — Care Recipient Context-Reset State

- **Repair:** Added visual Screen 39, context-reset requirements, UF-25, and AT-041 covering reset, authorization, leakage prevention, announcement, and focus.
- **Status:** Ready for Audit

### V-2 — Backup Activation and Circle Head Continuity

- **Repair:** Cross-linked visual Screens 29–31 and clarified that activation never creates Circle Head status, replacement acceptance, continuity bypass, self-activation, succession, or alternate recovery. Added AT-042.
- **Status:** Ready for Audit

### V-3 — Managed-Minor Age Band

- **Repair:** Clarified that age band is display/experience information only and triggers no account, invitation, ownership, role, permission, or automatic adulthood transition. Updated AT-020 and added AT-043.
- **Status:** Ready for Audit

### V-4 — Per-Viewer Audit-Row Authorization

- **Repair:** Added independent row authorization by event class, Circle, Care Recipient, actor-display policy, and safe event text across Screens 32, 33, and 37, the permission/data models, UF-26, and AT-044.
- **Status:** Ready for Audit

### V-5 — Verified-Email Boundary Watch

- **Classification:** Boundary watch item, not an open defect. No phone-authentication, phone-invitation, phone-recovery, or SMS-authentication affordance is present in the low-fidelity visual planning set.
- **Status:** Watch during future design review

## Latest Design Readiness Repair Tracking

The following documentation repairs preserve V-1 through V-4 history. The targeted design re-audit verdict was **PASSED — SIX DESIGN REPAIRS VERIFIED**.

### DR-V1A — Late Recipient-Scoped Response Handling

- **Repair:** Screen 39, UF-25, and AT-041 now cover in-flight Dad requests, pre-clear draft confirmation, cancelled switching, stale/late response discard during reset and after Mom authorization, clear-before-query behavior, and non-leaking destination failure.
- **Verification result:** Passed — targeted design re-audit
- **Audit verdict:** PASSED — SIX DESIGN REPAIRS VERIFIED
- **Status:** Closed — Verified by targeted design re-audit

### DR-V2A — Compound Backup/Last-Circle-Head State

- **Repair:** Screens 29–31, backup/continuity rules, and AT-042 now cover the compound state with a blocked final Circle Head, no accepted replacement, no available activation approver, dormant/unactivated backup, zero authority, and no alternate recovery.
- **Verification result:** Passed — targeted design re-audit
- **Audit verdict:** PASSED — SIX DESIGN REPAIRS VERIFIED
- **Status:** Closed — Verified by targeted design re-audit

### DR-V3A — Managed-Minor Deferred-Transition Visible Copy

- **Repair:** Screen 27 visibly states that Kinward does not automatically convert a managed minor profile and that minor-to-adult transition remains deferred; AT-043 excludes conversion, claim, ownership-transfer, birthday-invitation, and automatic-account affordances.
- **Verification result:** Passed — targeted design re-audit
- **Audit verdict:** PASSED — SIX DESIGN REPAIRS VERIFIED
- **Status:** Closed — Verified by targeted design re-audit

### DR-V4A — Per-Viewer Backup/Audit Detail Filtering

- **Repair:** Screens 29–33 and 37 plus UF-26, the permission/data models, and AT-044 independently authorize event class, Circle, Care Recipient, actor, approver, reason, attempted/blocked value, resulting state, and safe display text.
- **Verification result:** Passed — targeted design re-audit
- **Audit verdict:** PASSED — SIX DESIGN REPAIRS VERIFIED
- **Status:** Closed — Verified by targeted design re-audit

### DR-D16A — My Kinward Review-Due Frame Coverage

- **Repair:** Screen 3 now draws the D-16 “Access review due” item. Screen 3, the Care Recipient permission summary, and delegation detail share one persistent state that clears together only after a successful authorized decision; AT-036 verifies consistency.
- **Verification result:** Passed — targeted design re-audit
- **Audit verdict:** PASSED — SIX DESIGN REPAIRS VERIFIED
- **Status:** Closed — Verified by targeted design re-audit

### DR-META1 — 39-Screen Metadata Reconciliation

- **Repair:** The README, specification, and index identify 39 low-fidelity planning screens across 9 flow files, with one indexed row per Screen 1–39.
- **Verification result:** Passed — targeted design re-audit
- **Audit verdict:** PASSED — SIX DESIGN REPAIRS VERIFIED
- **Status:** Closed — Verified by targeted design re-audit
