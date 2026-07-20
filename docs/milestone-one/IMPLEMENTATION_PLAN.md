# Kinward Milestone One Implementation Plan

> **Status:** Milestone One application coding authorized (D-18); follow slices in order; verified 39-screen high-fidelity baseline (GOV-007 Closed — PASS)
> **Version:** 0.2
> **Last updated:** 2026-07-20
> **Governing decisions:** D-1 through D-18; `MILESTONE_ONE_READINESS.md`; GOV-007 Closed — PASS; all files in `docs/milestone-one/`

## Planning Boundary

This plan sequences Milestone One implementation slices. D-18 authorizes application coding within the approved non-medical foundation. It does not authorize medical features, real-data entry, production deployment, public release, or out-of-scope features. Targeted audit of D-8 through D-17 is complete. Gate A coding authorization is recorded in D-18 / GOV-006. GOV-007 Closed — PASS confirms the verified thirty-nine-screen high-fidelity baseline.

## Slice 1 — Application Shell and Accessibility Foundation

- **Objective:** Establish the mobile-first route shell and reusable WCAG 2.2 AA interaction patterns.
- **Prerequisites:** Approved WCAG 2.2 AA baseline and D-13 first-family matrix; record exact installed device and software versions before test execution.
- **Governing documents:** `WIREFRAME_SPEC.md` sections 24–25 (not high-fidelity Screens 24–25); milestone decision 21; verified high-fidelity design system and Screens 34–38.
- **Screens (final index mapping):** Visual Screen 38 (mobile navigation shell); Visual Screens 34–37 for universal empty / form-error / loading / permission-denied states. All five screens are verified. Do not map Slice 1 to high-fidelity Screens 24–25 (access review due / suspend delegation).
- **Data entities:** None beyond safe session/context envelopes.
- **Authorization rules:** Navigation never substitutes for route and data authorization; protected context clears on switch.
- **Tests:** AT-026 and AT-027.
- **Completion criteria:** Semantic shell, focus management, resizing, contrast, reduced motion, and safe states have objective acceptance criteria against the verified Screens 34–38 baseline.
- **Audit checkpoint:** Confirm no user interaction logging contains family content.

## Slice 2 — Authentication and User Profiles

- **Objective:** Establish adult authentication and minimal user profiles.
- **Prerequisites:** D-8 verified-email-only channel, synthetic-only environment plan, Gate A confirmation, and explicit coding authorization.
- **Governing documents:** `TECHNICAL_ARCHITECTURE.md`; `DATA_MODEL.md` entities 1–2.
- **Screens:** Welcome/authentication and account portion of My Kinward.
- **Data entities:** Auth users and user profiles.
- **Authorization rules:** Authenticated identity is not membership, role, ownership, or legal authority; minors have no login.
- **Tests:** Authentication failure states, managed-minor no-login portion of AT-020, and support isolation AT-023.
- **Completion criteria:** Verified adult identity can sign in and out without accessing any Circle by default.
- **Audit checkpoint:** Separate authentication security logs from family audit events.

## Slice 3 — Circle Creation and Membership

- **Objective:** Support multiple Circles per user and role-based Circle control.
- **Prerequisites:** Slices 1–2 and Circle RLS proof.
- **Governing documents:** Milestone decisions 1 and 10; `USER_FLOWS.md` UF-01 and UF-19–20. UF-02 is the invitation-based second-Circle join path and begins in Slice 4, not Slice 3.
- **Screens:** My Kinward, Create Circle, Circle overview, Circle switcher in shell.
- **Data entities:** Family Circles and Circle memberships.
- **Authorization rules:** Creator becomes first Circle Head through assignment; creator metadata is not permanent authority.
- **Tests:** AT-001 and AT-021. Slice 3 proves only the AT-002 authority boundary that Circle Head status grants no Care Recipient access; full AT-002 requires Care Recipient records and remains assigned to Slice 5.
- **Completion criteria:** One account can create and switch Circles with no cross-Circle state or data leakage.
- **Audit checkpoint:** Circle, membership, and first Circle Head events commit atomically.

## Slice 4 — Invitations

- **Objective:** Add single-use, revocable, identity-bound adult invitations.
- **Prerequisites:** Membership model, verified-email delivery and binding, and secure token handling plan.
- **Governing documents:** Milestone decision 14; `USER_FLOWS.md` UF-04–05.
- **Screens:** Invite member, invitation acceptance, pending invitation states.
- **Data entities:** Circle invitations and proposed assignment records.
- **Authorization rules:** No access before verified acceptance; only authorized roles/scopes may be proposed.
- **Tests:** AT-014 through AT-016.
- **Completion criteria:** Accept, decline, ignore/expire, cancel, mismatch, and retry paths are safe and idempotent.
- **Audit checkpoint:** Every invitation lifecycle transition is recorded without token or contact leakage.

## Slice 5 — Care Recipients

- **Objective:** Add multiple separately owned adult Care Recipient contexts per Circle.
- **Prerequisites:** Circle membership model, D-9 dedicated ownership invitation and consent flow, and recipient RLS proof.
- **Governing documents:** D-2; milestone decisions 9 and 11; `USER_FLOWS.md` UF-03 and UF-15.
- **Screens:** Add Care Recipient, pending owner acceptance, Care Recipient switcher.
- **Data entities:** Pending and active Care Recipients, ownership invitations, ownership acceptances, consent history, and membership.
- **Authorization rules:** One adult owner; no Circle Head, spouse, relationship, or co-owner access.
- **Tests:** AT-002, AT-003, and AT-022.
- **Completion criteria:** Dad and Mom activate independently and remain isolated across all read/write paths.
- **Audit checkpoint:** Proposal, owner acceptance, and activation events are atomic and owner-specific.

## Slice 6 — Circle-Wide Roles

- **Objective:** Represent canonical Circle-wide role assignments and lifecycle.
- **Prerequisites:** Membership and role/permission catalog.
- **Governing documents:** F-02-R closure; milestone decisions 1, 12, and 13; `FAMILY_ROLES.md`.
- **Screens:** Assign Circle-wide roles and roles review.
- **Data entities:** Circle role assignments, role definitions, role permissions, restrictions.
- **Authorization rules:** Circle Head is canonical active authority; Family Coordinator is distinct; no generic administrator or Care Recipient implication.
- **Tests:** Circle-wide portions of AT-004, AT-005, and AT-017.
- **Completion criteria:** Multiple active assignments union only within Circle scope and remove cleanly.
- **Audit checkpoint:** Assignment, suspension, and removal events preserve actor and prior/next states.

## Slice 7 — Care Recipient-Specific Roles

- **Objective:** Assign roles to exactly one Care Recipient.
- **Prerequisites:** Slice 5, permission catalog, and owner/manager authorization.
- **Governing documents:** D-2 and D-5; milestone decisions 11–13; `PERMISSION_MODEL.md`.
- **Screens:** Assign Care Recipient-specific roles, switcher, roles review.
- **Data entities:** Recipient role assignments and restrictions.
- **Authorization rules:** Exact recipient match; owner or explicit management authority; prospective access only.
- **Tests:** AT-003 through AT-006 and recipient portion of AT-017.
- **Completion criteria:** Dad assignment never grants Mom access and restrictions override role union.
- **Audit checkpoint:** Events include Circle and recipient without revealing inaccessible labels.

## Slice 8 — Management Modes

- **Objective:** Store and transition Self-Managed, Shared Management, and Delegated Management modes.
- **Prerequisites:** Care Recipient ownership and recent-authentication pattern.
- **Governing documents:** D-2; milestone decisions 2–4; `USER_FLOWS.md` UF-06–08.
- **Screens:** Select Care Management Mode and mode summaries.
- **Data entities:** Care management mode history.
- **Authorization rules:** Owner selection only; mode never transfers ownership or becomes legal authority.
- **Tests:** AT-006 through AT-008 mode preconditions.
- **Completion criteria:** Exactly one active mode per Care Recipient with auditable transitions and safe disputed hold.
- **Audit checkpoint:** Prior and next mode identifiers are immutable events.

## Slice 9 — Shared and Delegated Management Grants

- **Objective:** Create explicit grant, scope, consent, and acceptance records.
- **Prerequisites:** Management modes, adult memberships, permission catalog, and recipient RLS.
- **Governing documents:** D-1 and D-2; milestone decisions 3–5; `DATA_MODEL.md` entities 10–12 and 19.
- **Screens:** Shared setup, Delegated setup, scope review.
- **Data entities:** Shared grants, delegated grants, grant scopes, consent records.
- **Authorization rules:** Owner grant; exact recipient and scopes; no wildcard, self-expansion, co-ownership, or future automatic scope.
- **Tests:** AT-007 through AT-010.
- **Completion criteria:** Selected and “all current” scope snapshots are explicit, reviewable, and separately consented.
- **Audit checkpoint:** Grant and scope creation cannot commit without consent and audit identifiers.

## Slice 10 — Delegation Lifecycle

- **Objective:** Implement optional expiration, “Until revoked,” recurring review, suspension, expiration, and revocation semantics.
- **Prerequisites:** Slice 9, time-zone policy, authorization refresh strategy, and review-due representation.
- **Governing documents:** D-1; milestone decisions 6–8; `USER_FLOWS.md` UF-09–12.
- **Screens:** Expiration, “Until revoked,” delegation detail, suspend/revoke.
- **Data entities:** Delegated grants, review timestamps, lifecycle events, restrictions.
- **Authorization rules:** Only active exact scopes contribute; suspended/expired/revoked/disputed deny; owner retains access.
- **Tests:** AT-009 through AT-013.
- **Completion criteria:** Revocation denies the next request, recurring review schedules correctly, and unrelated roles remain independent.
- **Audit checkpoint:** Every lifecycle transition and session invalidation result is recorded atomically.

## Slice 11 — Managed Minor Profiles

- **Objective:** Add one-adult-managed basic profiles without authentication or adult authority.
- **Prerequisites:** Circle membership and explicit minor invariants.
- **Governing documents:** Milestone decisions 17–18; `USER_FLOWS.md` UF-16.
- **Screens:** Add managed minor, basic visibility, archive/suspend summary.
- **Data entities:** Managed minor profiles and managing-adult relationships.
- **Authorization rules:** One managing adult; no login, invitation, adult role, delegation, recipient context, or automatic Circle visibility.
- **Tests:** AT-020.
- **Completion criteria:** Schema, server, RLS, and UI independently prohibit adult capabilities.
- **Audit checkpoint:** Creation, visibility, archive, and transfer-review requests preserve managing adult identity.

## Slice 12 — Backup Circle Administrator

- **Objective:** Add dormant designation and controlled fixed-scope activation.
- **Prerequisites:** Circle-wide authorization, D-10 fresh provider challenge, D-11 Circle Head-only approval path, and approval transaction.
- **Governing documents:** D-4; milestone decision 16; `USER_FLOWS.md` UF-17–18.
- **Screens:** Backup designation and activation.
- **Data entities:** Backup designations and activation records.
- **Authorization rules:** Dormant equals zero permission; no self-activation or Milestone One alternate recovery; active fixed scope excludes Care Recipient and succession authority.
- **Tests:** AT-018 and AT-019.
- **Completion criteria:** Every activation condition is independently enforced and deactivation ends backup authority.
- **Audit checkpoint:** Designation, verification, request, approval, reauthentication, activation, action, suspension, and deactivation are traceable.

## Slice 13 — Audit History

- **Objective:** Provide append-only, scope-filtered authority and permission history.
- **Prerequisites:** D-15 event-channel taxonomy and D-12 synthetic-environment retention model.
- **Governing documents:** Milestone decision 15; `DATA_MODEL.md` entity 20.
- **Screens:** Audit-history view and event detail.
- **Data entities:** Audit events and safe correlation references.
- **Authorization rules:** Recipient owners see their events; Circle Heads see Circle administration only; actors see safe own actions; no support access.
- **Tests:** AT-024 and AT-025.
- **Completion criteria:** Events are immutable, minimal, queryable within exact scope, and atomic with security writes.
- **Audit checkpoint:** Audit the audit path for forbidden updates/deletes and failed append behavior.

## Slice 14 — Full Authorization and Isolation Verification

- **Objective:** Prove the complete permission model across every route and table.
- **Prerequisites:** Slices 1–13 complete with server and RLS tests.
- **Governing documents:** `PERMISSION_MODEL.md`, `ACCEPTANCE_TEST_PLAN.md`, `DOCUMENT_GOVERNANCE.md`.
- **Screens:** All Milestone One screens and universal states.
- **Data entities:** Every Milestone One entity.
- **Authorization rules:** Deny by default, exact context, restrictions override, no hidden support, no client-only authorization.
- **Tests:** AT-001 through AT-040 as one regression suite.
- **Completion criteria:** No open Critical or High authorization, privacy, isolation, audit, or accessibility defect.
- **Audit checkpoint:** Independent read-only systems audit of routes, RLS policies, data constraints, and audit coverage before any broader feature work.

## Cross-Slice Rules

- Each slice includes synthetic fixtures, allow and deny tests, accessible states, and audit behavior.
- No slice may introduce medical or care-content tables, routes, screens, or permissions.
- No slice may use support bypass, generic administrator, Circle Coordinator, Primary Circle Administrator, or wildcard permission.
- No application coding expands beyond D-18 without separate product-owner approval. Gate A for Milestone One foundation coding is satisfied by D-18.
- Local implementation and hosted preview remain synthetic-only and isolated. No plan provisions the future pilot.
- Gate C security and privacy architecture review and signed beta readiness precede any real information.
- Secure document sharing is a separate later slice and never enters non-medical Milestone One automatically.
