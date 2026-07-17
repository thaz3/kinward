# Kinward Milestone One Acceptance-Test Plan

> **Status:** Updated objective test plan reflecting D-8 through D-17; closed and verified by targeted systems audit; no implementation authorized
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing decisions:** D-1 through D-17; `MILESTONE_ONE_DECISIONS.md`; `PERMISSION_MODEL.md`

## Test Boundaries

- Use only deterministic synthetic data.
- Run authorization tests at both server-operation and PostgreSQL RLS layers.
- Verify that denied responses return no protected row, label, count, cached value, or existence clue.
- Verify audit events without copying family content.
- Milestone One tests contain no check-ins, symptoms, treatment, medication, diet, movement, medical alerts, legal-document validation, or real information.

## Synthetic Baseline

- **Harbor Circle:** Circle Heads Avery and Morgan; adult Care Recipients Dad and Mom.
- **Cedar Circle:** separate Circle with Avery as an ordinary member.
- **Jordan:** Harbor Family Coordinator and Dad-specific Care Lead.
- **Riley:** Dad’s Designated Care Representative.
- **Sam:** Dad’s Shared Manager.
- **Kai:** Harbor managed minor controlled by Morgan.
- **Taylor:** Harbor dormant Backup Circle Administrator.
- **Support User:** authenticated internal-style test identity with no family membership or bypass.

## Acceptance Tests

### AT-001 — One User Belongs to Multiple Circles

- **Starting state:** Avery has active Harbor and Cedar memberships with different roles.
- **Actor:** Avery.
- **Action:** Open My Kinward and switch from Harbor to Cedar.
- **Expected result:** Both Circle cards appear; Cedar shell loads after selection and Harbor client state clears.
- **Expected authorization result:** Allow each Circle only through its separate membership and role records.
- **Expected audit event:** No family audit required for ordinary switching; safe operational log may record context change.
- **Pass/fail criteria:** Pass only if no Harbor Care Recipient, role, draft, filter, count, or cached record remains in Cedar context.

### AT-002 — One Circle Has Multiple Care Recipients

- **Starting state:** Harbor contains active Dad and Mom records with different owners and grants.
- **Actor:** Avery as Circle Head with no recipient grant.
- **Action:** Open Harbor overview and attempt recipient administration.
- **Expected result:** Circle administration is available; protected recipient actions are absent or denied.
- **Expected authorization result:** Allow Circle scope; deny Dad and Mom management.
- **Expected audit event:** Security-relevant denied write records `authorization.denied` without recipient content.
- **Pass/fail criteria:** Pass only if Circle Head status does not grant either recipient’s management permission.

### AT-003 — Access to Dad but Not Mom

- **Starting state:** Jordan has an active Dad-specific role and no Mom role or grant.
- **Actor:** Jordan.
- **Action:** Open Dad permissions, then submit Mom’s identifier directly.
- **Expected result:** Dad-authorized view loads; Mom request returns generic denied/not-found state.
- **Expected authorization result:** Allow exact Dad scope; deny Mom at server and RLS.
- **Expected audit event:** Safe denial event for Mom request.
- **Pass/fail criteria:** Pass only if no Mom label, count, placeholder, role, audit row, or data enters the response or cache.

### AT-004 — One Person Holds Multiple Roles

- **Starting state:** Jordan is Harbor Family Coordinator and Dad-specific Care Lead.
- **Actor:** Jordan.
- **Action:** Open roles review in Circle-wide, Dad, and Mom contexts.
- **Expected result:** Each active assignment appears only in its context.
- **Expected authorization result:** Union only matching active permissions; no cross-recipient union.
- **Expected audit event:** Prior assignment events remain separately visible within authorized scope.
- **Pass/fail criteria:** Pass if role sources remain separate and Mom receives no permission.

### AT-005 — Restriction Overrides Combined Roles

- **Starting state:** Jordan has two active Dad-specific assignments that would otherwise allow one test action; an active restriction denies it.
- **Actor:** Jordan.
- **Action:** Attempt the restricted action.
- **Expected result:** Operation is denied with safe explanation.
- **Expected authorization result:** Deny after permission union because explicit restriction wins.
- **Expected audit event:** `authorization.denied` references restriction identifier and safe reason code.
- **Pass/fail criteria:** Pass only if neither server code nor RLS permits the action.

### AT-006 — Self-Managed With Non-Management Roles

- **Starting state:** Dad is Self-Managed; Jordan retains Family Coordinator and Care Lead assignments.
- **Actor:** Jordan.
- **Action:** Attempt to change Dad’s management mode or grants.
- **Expected result:** Role assignments remain visible where permitted, but management changes fail.
- **Expected authorization result:** Deny management; allow only explicit non-management assignment scope.
- **Expected audit event:** Safe denied-action event.
- **Pass/fail criteria:** Pass if Self-Managed does not require removing family roles and those roles grant no management access.

### AT-007 — Shared Management

- **Starting state:** Dad owns the record and grants Sam two explicit management scopes.
- **Actor:** Sam.
- **Action:** Use one granted scope, one ungranted scope, and attempt ownership transfer.
- **Expected result:** Granted action succeeds; ungranted action and ownership transfer fail.
- **Expected authorization result:** Allow exact active scope; deny others and invariant-prohibited ownership transfer.
- **Expected audit event:** Successful action identifies Sam and grant; denials use safe reason codes.
- **Pass/fail criteria:** Pass if Dad remains sole owner and retains access.

### AT-008 — Delegated Management

- **Starting state:** Dad gives Riley an accepted active delegation with selected scopes.
- **Actor:** Riley.
- **Action:** Perform one granted operation on Dad’s behalf.
- **Expected result:** Operation succeeds and identifies Riley acting for Dad.
- **Expected authorization result:** Allow through the exact delegation and scope.
- **Expected audit event:** Actor Riley, on-behalf-of Dad, delegation ID, action, and result.
- **Pass/fail criteria:** Pass if delegation creates no Mom, legal, spouse, or ownership authority.

### AT-009 — Optional Expiration

- **Starting state:** Dad creates a new delegation.
- **Actor:** Dad.
- **Action:** Review expiration step and choose a custom future date instead of the suggested date.
- **Expected result:** Custom date is accepted and stored.
- **Expected authorization result:** Allow owner with recent authentication.
- **Expected audit event:** Expiration selection and grant creation events.
- **Pass/fail criteria:** Pass if expiration is optional and 90 days is not enforced as a mandatory duration.

### AT-010 — Suggested 90-Day Expiration

- **Starting state:** Delegation start time and Dad’s time zone are fixed in the fixture.
- **Actor:** Dad.
- **Action:** Accept the prefilled 90-day expiration.
- **Expected result:** Exact calculated date is shown before confirmation and stored after consent.
- **Expected authorization result:** Allow owner only.
- **Expected audit event:** Selected expiration identifier and activation event.
- **Pass/fail criteria:** Pass if the date is deterministic, reviewable, and not silently committed.

### AT-011 — “Until Revoked” and Recurring Review

- **Starting state:** Dad creates a delegation with no expiration.
- **Actor:** Dad.
- **Action:** Deliberately choose “Until revoked” and confirm.
- **Expected result:** `expires_at` remains null and `next_review_at` is 90 days after activation; each completed review schedules the next one.
- **Expected authorization result:** Allow owner with explicit no-expiration consent.
- **Expected audit event:** No-expiration choice, review schedule, and subsequent review events.
- **Pass/fail criteria:** Pass if review reminders recur without inventing automatic expiration or a family exception.

### AT-012 — Delegation Suspension

- **Starting state:** Riley’s Dad delegation is active.
- **Actor:** Dad.
- **Action:** Suspend after recent authentication; Riley retries a granted action.
- **Expected result:** Suspension succeeds; Riley’s next protected request fails immediately.
- **Expected authorization result:** Owner may suspend; suspended grant contributes no permission.
- **Expected audit event:** Suspension and session/cache invalidation outcome.
- **Pass/fail criteria:** Pass if grant history remains and unrelated Circle roles are unchanged.

### AT-013 — Delegation Revocation

- **Starting state:** Riley’s delegation is active or suspended.
- **Actor:** Dad.
- **Action:** Revoke; Riley retries; Dad attempts restoration.
- **Expected result:** Revoke is immediate, Riley is denied, and revoked grant cannot restore.
- **Expected authorization result:** Owner may revoke; revoked source is permanently inactive.
- **Expected audit event:** Revocation, scope removal, and session invalidation result.
- **Pass/fail criteria:** Pass if prior actions remain auditable and no relationship preserves access.

### AT-014 — Invitation Acceptance

- **Starting state:** Active unused invitation bound to Jordan’s verified email and Harbor.
- **Actor:** Jordan.
- **Action:** Authenticate with matching contact and accept.
- **Expected result:** Membership is created once and approved proposed assignments activate.
- **Expected authorization result:** Allow only after matching verified-email identity and active invitation checks.
- **Expected audit event:** Acceptance, membership creation, and role assignment.
- **Pass/fail criteria:** Pass if transaction is idempotent and no access existed before acceptance.

### AT-015 — Invitation Expiration

- **Starting state:** Pending invitation is more than seven days old.
- **Actor:** Intended invitee.
- **Action:** Open and attempt acceptance.
- **Expected result:** Generic expired state and no membership.
- **Expected authorization result:** Deny because lifecycle is expired.
- **Expected audit event:** Expiration event exactly once.
- **Pass/fail criteria:** Pass if no Circle data is exposed and the token cannot be reused.

### AT-016 — Invitation Cancellation and Decline

- **Starting state:** Two pending invitations exist.
- **Actor:** Circle Head cancels one; intended invitee declines the other.
- **Action:** Attempt later acceptance of both.
- **Expected result:** Both are invalid and create no membership.
- **Expected authorization result:** Allow authorized cancel and identity-bound decline; deny later acceptance.
- **Expected audit event:** Separate cancelled and declined events.
- **Pass/fail criteria:** Pass if cancellation and decline remain distinguishable in authorized audit history but reveal no family data externally.

### AT-017 — Role Assignment and Removal

- **Starting state:** Jordan is an active Harbor member with no target role.
- **Actor:** Authorized assigner.
- **Action:** Assign one Dad-specific role, verify access, then remove it and retry.
- **Expected result:** Access begins only after assignment and ends immediately after removal.
- **Expected authorization result:** Exact scope allowed while active; denied after removal.
- **Expected audit event:** Assignment and removal with actor, scope, and before/after identifiers.
- **Pass/fail criteria:** Pass if unrelated assignments and history remain.

### AT-018 — Dormant Backup Has No Access

- **Starting state:** Taylor is verified and designated as dormant backup with no other administrative role.
- **Actor:** Taylor.
- **Action:** Attempt invitation, role, membership, settings, audit, and Care Recipient actions.
- **Expected result:** Every backup-derived action is denied.
- **Expected authorization result:** Designation contributes zero permission.
- **Expected audit event:** Security-relevant denials without family content.
- **Pass/fail criteria:** Pass only if Taylor has exactly ordinary membership access, if any, and no backup authority.

### AT-019 — Controlled Backup Activation

- **Starting state:** Taylor is dormant; Avery is authorized Circle Head.
- **Actor:** Avery approves; Taylor strongly reauthenticates.
- **Action:** Request, approve, activate, perform an allowed non-medical action, then attempt prohibited Care Recipient and self-expansion actions.
- **Expected result:** Fixed action succeeds; prohibited actions fail.
- **Expected authorization result:** Activation requires all approved conditions; fixed scope only.
- **Expected audit event:** Request, approval, reauthentication, activation, allowed action, denials, and later deactivation.
- **Pass/fail criteria:** Pass if self-activation fails and no Care Recipient, succession, or legal authority appears.

### AT-020 — Managed Minor Restrictions

- **Starting state:** Kai profile is managed by Morgan and private by default.
- **Actor:** Morgan and a different Circle member.
- **Action:** Create Kai; try to create login, invitation, adult role, delegation, and Care Recipient access; share basic profile fields.
- **Expected result:** Basic profile and approved visibility work; all prohibited actions fail.
- **Expected authorization result:** Managing-adult permission applies only to minor basic profile; invariant denials block adult capabilities.
- **Expected audit event:** Create, managing relationship, visibility change, and safe denials.
- **Pass/fail criteria:** Pass if no Auth user, credential, exact birth date, adult role, or recipient access exists.

### AT-021 — Unauthorized Cross-Circle Access

- **Starting state:** Jordan belongs to Harbor only; Cedar identifiers are known to the test harness.
- **Actor:** Jordan.
- **Action:** Submit Cedar IDs through URL, server action, direct Supabase query, and modified client state.
- **Expected result:** Every path returns no Cedar data.
- **Expected authorization result:** Server and RLS independently deny.
- **Expected audit event:** Safe denial with attempted context identifier and no protected payload.
- **Pass/fail criteria:** Pass if response, cache, logs, and visible audit contain no Cedar family content.

### AT-022 — Unauthorized Cross-Care-Recipient Access

- **Starting state:** Jordan can access Dad only.
- **Actor:** Jordan.
- **Action:** Submit Mom IDs through every supported read and write path.
- **Expected result:** Every path denies without revealing Mom.
- **Expected authorization result:** Exact Care Recipient mismatch or missing permission denial.
- **Expected audit event:** Safe security denial.
- **Pass/fail criteria:** Pass if no Mom existence clue, role, count, label, or row is returned.

### AT-023 — No Hidden Support Access

- **Starting state:** Support User is authenticated but has no family membership.
- **Actor:** Support User.
- **Action:** Query Circle, Care Recipient, membership, role, grant, minor, backup, consent, and audit tables.
- **Expected result:** No family rows and no impersonation path.
- **Expected authorization result:** Deny all through server and RLS.
- **Expected audit event:** Operational security event only; no family audit visibility granted.
- **Pass/fail criteria:** Pass if no service-role key, wildcard policy, hidden role, or internal bypass is available to application code.

### AT-024 — Audit History Preservation

- **Starting state:** Role assignment and delegation have completed actions, then are removed/revoked.
- **Actor:** Authorized Care Recipient and Circle Head viewers.
- **Action:** Open audit history after access removal.
- **Expected result:** Authorized historical events remain immutable and scope-filtered.
- **Expected authorization result:** Each viewer sees only their approved audit scope.
- **Expected audit event:** Audit reads follow safe operational logging; no mutation event.
- **Pass/fail criteria:** Pass if events cannot be edited/deleted and do not copy protected content.

### AT-025 — Audit Atomicity

- **Starting state:** Test database can simulate audit insert failure.
- **Actor:** Authorized role assigner.
- **Action:** Attempt a role change while forcing the audit append to fail.
- **Expected result:** Entire transaction rolls back.
- **Expected authorization result:** Authorization may allow, but persistence fails safely.
- **Expected audit event:** No partial family audit; operational error records safe correlation ID.
- **Pass/fail criteria:** Pass if no security state changes without its required audit event.

### AT-026 — WCAG 2.2 AA Mobile Shell

- **Starting state:** Synthetic account with no Circle, multiple Circles, and denied states across test variants.
- **Actor:** Keyboard, VoiceOver, and TalkBack test users.
- **Action:** Authenticate, navigate, switch context, complete forms, and respond to confirmation and errors at 200% text.
- **Expected result:** Content remains usable with logical headings, labels, focus, announcements, contrast, reduced motion, and 48-pixel primary targets.
- **Expected authorization result:** Accessibility behavior never bypasses authorization and denied states reveal no extra data.
- **Expected audit event:** Normal security events only; assistive technology use is not family audit data.
- **Pass/fail criteria:** Pass when documented WCAG 2.2 AA criteria and the named first-family device matrix succeed without critical accessibility defects.

### AT-027 — Empty, Loading, Error, and No-Role Privacy

- **Starting state:** Test each state with authorized empty data and with an inaccessible hidden record.
- **Actor:** Ordinary member.
- **Action:** Open overview, switcher, roles, grants, and audit pages under each state.
- **Expected result:** States are understandable and actionable but do not distinguish hidden records from nonexistent records.
- **Expected authorization result:** No unauthorized query fallback or broadened retry.
- **Expected audit event:** Safe operational errors; security denial when applicable.
- **Pass/fail criteria:** Pass if names, counts, placeholders, cached content, and error details never leak.

### AT-028 — Verified-Email-Only Identity

- **Pass/fail criteria:** Pass if signup, verification, login, invitation binding, and Milestone One recovery entry use verified email only; SMS and phone identity paths are absent.

### AT-029 — Dedicated Adult Ownership Invitation

- **Pass/fail criteria:** Pass if a proposal creates an inactive pending Care Recipient and separate verified-email ownership invitation and consent history, with no private data before acceptance.

### AT-030 — Ownership Acceptance Creates Membership

- **Pass/fail criteria:** Pass if acceptance atomically activates sole ownership and Circle membership without an ordinary second invitation or access to another Care Recipient.

### AT-031 — Routine Session and 15-Minute Reauthentication

- **Pass/fail criteria:** Pass if routine authorized access repeats no authentication, consequential actions accept authentication no older than 15 minutes, and older evidence blocks the write pending provider-supported reauthentication.

### AT-032 — Fresh Challenge for Backup Activation

- **Pass/fail criteria:** Pass if every activation requires a fresh provider-supported challenge, reason, authorized Circle Head approval, and audit; biometrics are not mandatory.

### AT-033 — No Backup Recovery Branch

- **Pass/fail criteria:** Pass if no available Circle Head produces a neutral unavailable state, zero backup permission, and no incapacity, succession, or authority decision.

### AT-034 — Last Active Circle Head Invariant

- **Pass/fail criteria:** Pass if leave, self-removal, third-party removal, and downgrade are blocked until another verified adult accepts Circle Head, without automatic backup succession.

### AT-035 — Denial Audit Threshold

- **Pass/fail criteria:** Pass if a consequential denied authority write appears in family audit, while a routine denied read does not and may instead create a privacy-safe security event with no private content.

### AT-036 — In-App Delegation Review Due

- **Pass/fail criteria:** Pass if all three D-16 placements persist until review, no external reminder is sent, and continue/modify/suspend/revoke records reviewer and decision and resets or ends the schedule correctly.

### AT-037 — Synthetic Audit Retention

- **Pass/fail criteria:** Pass if all synthetic audit events remain throughout an active test environment and are removed only with the complete synthetic dataset under documented reset or retirement.

### AT-038 — Environment Isolation and Gate C

- **Pass/fail criteria:** Pass if local and preview prohibit real information, the future pilot uses separate resources and no shared data path, and real entry is blocked until Gate C and signed readiness approval.

### AT-039 — Secure Documents Remain Unavailable

- **Pass/fail criteria:** Pass if scans and reports cannot be uploaded in Milestone One and no document path exists before separate implementation and readiness approval.

### AT-040 — First-Family Device Matrix

- **Pass/fail criteria:** Pass if both Care Recipients' actual iPhones, the nurse tester's actual Android, and one desktop keyboard configuration complete every D-13 accessibility check with exact versions recorded; both mobile platforms must work before pilot readiness.

## Test Exit Criteria

- Every allow path and corresponding deny path passes at server and RLS layers.
- Every security-state transition is atomic with its audit event.
- No open Critical or High authorization, isolation, privacy, or accessibility defect remains.
- Tests use synthetic fixtures only.
- No out-of-scope feature is required to pass Milestone One.
- No test result authorizes the restricted real-family beta or real-data entry.
