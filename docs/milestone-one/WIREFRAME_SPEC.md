# Kinward Milestone One Wireframe Specification

> **Status:** Verified 39-screen low-fidelity planning baseline; high-fidelity design authorized by product owner — design only; no implementation authorized
> **Version:** 0.1
> **Last updated:** 2026-07-17
> **Governing decisions:** D-1 through D-17; `MILESTONE_ONE_DECISIONS.md`; `MILESTONE_ONE_READINESS.md`

## Scope

These mobile-first wireframe specifications cover only the approved non-medical Milestone One foundation. They intentionally exclude check-ins, symptoms, treatment, medication, diet, movement, medical alerts, legal-document validation, and real family information.

A written wireframe specification and verified 39-screen low-fidelity visual planning baseline exist. The final targeted design re-audit verdict was **PASSED — SIX DESIGN REPAIRS VERIFIED**. Product-owner authorization now permits draft high-fidelity visual design based strictly on this baseline, but no high-fidelity output or final interface design is approved and no application interface is implemented.

The high-fidelity phase status is **Authorized by product owner — design only**. It permits visual styling, layout refinement, responsive behavior, component appearance, typography, spacing, visual hierarchy, interaction-state presentation, accessibility presentation, and draft high-fidelity prototypes. It excludes application or production-component implementation, backend development, authentication configuration, packages, databases, storage, infrastructure, environments, real information, document uploads, medical functionality, and restricted real-family beta activity. Gate A through Gate D remain in force.

The visual planning set is indexed in `visual-wireframes/WIREFRAME_INDEX.md`.

Use synthetic labels in prototypes, such as the fictional Harbor Circle with adult Care Recipients “Dad” and “Mom.” Never use real patient or family data.

## Shared Interaction Rules

- Start with a narrow phone viewport and expand without changing task order.
- Use one clear page heading, one primary action, plain language, and interactive targets at least 48 × 48 CSS pixels. This is Kinward's approved product baseline even where an external standard permits a smaller minimum.
- Keep the active Circle and active Care Recipient visible whenever either context applies.
- Never rely on interface hiding for authorization; denied data is not requested or returned.
- Use text plus icons for status. Never use color alone.
- Provide visible focus, logical heading order, keyboard operation, screen-reader names, 200% text resizing, reduced-motion behavior, and error summaries.
- Require authentication within the prior 15 minutes for consequential authority actions and a fresh provider-supported challenge for every backup activation and other designated strong action.
- Use archive, remove, suspend, or revoke rather than permanent deletion in Milestone One.

## Screen Specifications

### 1. Welcome and Authentication

- **Purpose:** Let an adult create or access a Kinward account without revealing Circle information before authentication.
- **Intended users:** New and returning adults; managed minors never use this screen independently.
- **Information displayed:** Kinward purpose, privacy boundary, sign-in or create-account choices, synthetic-data notice for test environments, and help for expired links.
- **Available actions:** Continue with verified-email authentication; verify email; resume a valid invitation; sign out. No SMS, phone OTP, phone recovery, or SMS invitation action appears.
- **Role and permission requirements:** Public shell only; no Circle, role, or Care Recipient data before an authenticated user and verified email exist.
- **Privacy boundaries:** Generic copy only; invitation context must not reveal names, illness, roles, or Circle details before verification.
- **Empty state:** “Sign in or create an account to continue.”
- **Error state:** Explain invalid, expired, or already-used links without confirming whether a private Circle exists.
- **Destructive-action confirmation:** Sign-out confirmation only when unsaved account setup exists.
- **Accessibility behavior:** Properly labeled fields, password-manager support if passwords are used, announced errors, no timed completion, and accessible one-time-code entry.
- **Navigation:** Enters from the public landing page or invitation link; exits to My Kinward after successful authentication.

### 2. My Kinward Dashboard

- **Purpose:** Give one account a safe launch point for multiple Circles.
- **Intended users:** Authenticated adults.
- **Information displayed:** Circles the user actively belongs to, pending invitations, current role summaries by Circle, a create-Circle action, and any “Access review due” item for an authorized “Until revoked” delegation. Each due item identifies the relevant Care Recipient and representative in privacy-appropriate language without implying automatic renewal, extension, suspension, or revocation.
- **Available actions:** Open a Circle, create a Circle, review an invitation, review due access, switch account settings, or sign out. Opening a due item does not clear it.
- **Role and permission requirements:** Show only memberships and invitations bound to the authenticated identity.
- **Privacy boundaries:** Do not combine Care Recipient names, roles, counts, or activity across Circles beyond the minimum dashboard card chosen for that Circle.
- **Empty state:** “You are not in a Circle yet. Create one or accept an invitation.”
- **Error state:** Load Circles independently; a failure in one Circle must not expose or block another.
- **Destructive-action confirmation:** None.
- **Accessibility behavior:** Circle cards are headings with full-text actions; focus returns to the opened card when navigating back.
- **Navigation:** Enters after sign-in; exits to a selected Circle, invitation, Circle creation, or account settings.

### 3. Create a Family Circle

- **Purpose:** Create a private Circle and establish the creator as its first Circle Head.
- **Intended users:** Authenticated adults.
- **Information displayed:** Circle display name, privacy explanation, creator-as-first-Circle-Head statement, and synthetic-example guidance.
- **Available actions:** Name the Circle, review the setup summary, create, or cancel.
- **Role and permission requirements:** Any authenticated adult may create a Circle; creation creates a membership and Circle Head assignment atomically.
- **Privacy boundaries:** Circle creator metadata is recorded but is not permanent ownership or Care Recipient access.
- **Empty state:** Blank name field with a neutral fictional example.
- **Error state:** Preserve the entered name locally, avoid duplicate creation after retry, and explain recoverable failures.
- **Destructive-action confirmation:** Cancel confirmation when a name or setting has been entered.
- **Accessibility behavior:** One short field, clear character guidance, announced validation, and no placeholder-only label.
- **Navigation:** Enters from My Kinward; exits to the new Circle overview or back to My Kinward.

### 4. Circle Overview

- **Purpose:** Show non-medical Circle structure and the next permitted administration action.
- **Intended users:** Active Circle members, filtered by their permissions.
- **Information displayed:** Circle name, active Care Recipient context if selected, membership summary, role summary, managed minor summary when allowed, and pending setup actions.
- **Available actions:** Switch Care Recipient, review members, invite, add a Care Recipient, review roles, or open settings when authorized.
- **Role and permission requirements:** Basic membership permits entry; each card and action requires its own Circle or Care Recipient permission.
- **Privacy boundaries:** Membership never reveals Care Recipient-specific details; inaccessible Care Recipients do not expose private fields or activity clues.
- **Empty state:** “This Circle has no active Care Recipients yet” with permission-appropriate next steps.
- **Error state:** Show a generic unavailable card rather than leaking which protected record failed.
- **Destructive-action confirmation:** None on overview.
- **Accessibility behavior:** Landmarks separate Circle context, Care Recipient context, and actions; context changes are announced.
- **Navigation:** Enters from My Kinward; exits to members, roles, Care Recipients, audit history, settings, or back to My Kinward.

### 5. Add a Care Recipient

- **Purpose:** Establish an adult Care Recipient record without giving the Circle Head ownership or automatic access.
- **Intended users:** An adult adding themselves or an authorized Circle Head proposing another adult.
- **Information displayed:** Self-versus-another-adult choice, sole-ownership explanation, proposed owner's verified email address, and activation status.
- **Available actions:** Add self, send a Care Recipient ownership invitation, review, cancel, or resend an expired invitation.
- **Role and permission requirements:** Self-add requires active membership; proposing another adult requires Circle administration permission. Another adult’s record remains pending until that adult verifies and accepts ownership.
- **Privacy boundaries:** No private Care Recipient record, role grant, or management access exists before owner acceptance; marriage and Circle Head status add nothing.
- **Empty state:** “Choose who will own this Care Recipient record.”
- **Error state:** Verified-email mismatch, duplicate pending record, or expired invitation is explained without exposing another account.
- **Destructive-action confirmation:** Cancel pending proposal or archive an unactivated shell with confirmation.
- **Accessibility behavior:** Ownership consequences appear before the primary action and are announced in the confirmation summary.
- **Navigation:** Enters from Circle overview; exits to pending status, management-mode selection for self, or Circle overview.

### 6. Care Recipient Switcher

- **Purpose:** Make the active Care Recipient explicit and prevent cross-recipient carryover.
- **Intended users:** Members with access to at least one Care Recipient in the active Circle.
- **Information displayed:** Only Care Recipients the viewer may know about, plus a clearly labeled Circle-wide context where applicable.
- **Available actions:** Select a permitted Care Recipient or return to Circle-wide administration.
- **Role and permission requirements:** The list is server-filtered by active permissions; membership alone does not populate every Care Recipient.
- **Privacy boundaries:** No hidden Care Recipient name, count, role, cached view, or placeholder may reveal an inaccessible person.
- **Empty state:** “No Care Recipient access is assigned to you in this Circle.”
- **Error state:** Reset to Circle-wide context when the prior selection becomes unauthorized.
- **Destructive-action confirmation:** None.
- **Accessibility behavior:** Implement as a labeled dialog or full-page list, not an unlabeled custom dropdown; announce the new context.
- **Navigation:** Opens from the persistent context control; a recipient change enters the dedicated Care Recipient Context Reset state and returns only after protected prior state is cleared and destination authorization is confirmed.

### 7. Invite a Circle Member

- **Purpose:** Create a single-use, revocable, seven-day Circle invitation tied to a verified email.
- **Intended users:** Circle Heads or another actor with explicit invitation permission.
- **Information displayed:** “Verified email address” field, Circle-wide proposed roles, Care Recipient-specific proposed roles, expiration, and access preview.
- **Available actions:** Add proposed roles, send, revise, cancel, or save no draft.
- **Role and permission requirements:** The inviter may propose only roles and scopes they are authorized to assign; Care Recipient-specific roles require owner or authorized grant approval.
- **Privacy boundaries:** Invitation delivery uses generic wording and grants no access before acceptance and required confirmation.
- **Empty state:** Blank verified-contact field and no roles selected.
- **Error state:** Duplicate active invitation, invalid or unsupported email address, insufficient assignment permission, or delivery failure.
- **Destructive-action confirmation:** Cancel an already-sent invitation with confirmation and immediate invalidation.
- **Accessibility behavior:** Role scope is expressed in text, grouped by Circle versus named Care Recipient, with an accessible review summary.
- **Navigation:** Enters from members or role assignment; exits to invitation status or Circle overview.

Planning note: Phone-based authentication and invitation delivery are deferred and are not available in Milestone One.

### 8. Invitation Acceptance

- **Purpose:** Let the intended adult accept or decline after verifying the invited destination and understanding the proposed access.
- **Intended users:** Authenticated adult who verified and uses the matching invited email identity.
- **Information displayed:** Circle name after verification, inviter, proposed roles and scopes, privacy expectations, expiration, and acceptance requirements.
- **Available actions:** Accept, decline, sign in with the correct identity, or leave undecided.
- **Role and permission requirements:** Contact identity must match; acceptance creates membership but sensitive role activation may still require Care Recipient confirmation.
- **Privacy boundaries:** No Circle data before identity match; declined or ignored invitations reveal nothing further.
- **Empty state:** Not applicable; invalid links use the error state.
- **Error state:** Expired, cancelled, used, mismatched, or malformed invitation with a generic request-new-invitation path.
- **Destructive-action confirmation:** Decline confirmation explains the link cannot be reused unless a new invitation is issued.
- **Accessibility behavior:** Proposed permissions are summarized in plain language before buttons; no forced countdown.
- **Navigation:** Enters from the invitation link or My Kinward; exits to the Circle after acceptance or My Kinward after decline.

### 9. Assign Circle-Wide Roles

- **Purpose:** Assign approved non-medical Circle-wide responsibilities.
- **Intended users:** Circle Heads or active backup authority within its fixed activated scope.
- **Information displayed:** Member, available Circle-wide roles, current assignments, restrictions, and effect preview.
- **Available actions:** Assign, suspend, remove, or review a role.
- **Role and permission requirements:** Actor must have assignment authority; no Circle-wide role grants Care Recipient-specific access.
- **Privacy boundaries:** Do not show Care Recipient records or imply medical access in the role summary.
- **Empty state:** “No Circle-wide roles assigned.”
- **Error state:** Stale membership, forbidden role, self-expansion attempt, or concurrent role change.
- **Destructive-action confirmation:** Removing or suspending a role requires affected-scope summary and recent authentication.
- **Accessibility behavior:** Each role includes readable purpose and boundaries; permission changes are announced after completion.
- **Navigation:** Enters from members or roles review; exits to member detail, audit event, or Circle overview.

### 10. Assign Care Recipient-Specific Roles

- **Purpose:** Assign one role for one named Care Recipient without affecting another.
- **Intended users:** The adult Care Recipient or a representative with explicit role-management scope.
- **Information displayed:** Active Circle, named Care Recipient, member, role, explicit permissions, status, and prospective-access warning.
- **Available actions:** Assign, limit, suspend, remove, or return without change.
- **Role and permission requirements:** Owner or explicit management grant for that Care Recipient; never Circle Head status alone.
- **Privacy boundaries:** A role for Dad must not reveal or change Mom; old records remain hidden unless separately shared.
- **Empty state:** “This member has no roles for this Care Recipient.”
- **Error state:** Wrong context, owner approval missing, grant expired, or member inactive.
- **Destructive-action confirmation:** Removal shows what future access ends and that audit history remains.
- **Accessibility behavior:** Context is repeated in the heading and confirmation; roles never rely on abbreviations alone.
- **Navigation:** Enters from member or Care Recipient permissions; exits to role review or audit history.

### 11. Select Care Management Mode

- **Purpose:** Let an adult Care Recipient choose Self-Managed, Shared Management, or Delegated Management.
- **Intended users:** The adult Care Recipient.
- **Information displayed:** Plain-language comparison, ownership constant, assistance model, and current mode.
- **Available actions:** Select a mode, continue to configuration, or cancel.
- **Role and permission requirements:** Only the Care Recipient changes their mode unless a separately verified authority process later applies.
- **Privacy boundaries:** Mode selection never transfers ownership or grants access by relationship.
- **Empty state:** No mode selected during initial owner activation.
- **Error state:** Deny mode changes during disputed authority or when the owner session lacks recent authentication.
- **Destructive-action confirmation:** Changing away from a mode previews grants that will suspend or end.
- **Accessibility behavior:** Comparison uses headings and text, not a dense visual-only table; selection state is announced.
- **Navigation:** Enters after Care Recipient activation or from permissions; exits to Self-Managed summary, Shared setup, or Delegated setup.

### 12. Configure Shared Management

- **Purpose:** Give selected adults discrete management scopes while the Care Recipient remains the primary manager.
- **Intended users:** The adult Care Recipient.
- **Information displayed:** Eligible adult members, scope catalog, existing grants, lifecycle status, and prohibited ownership actions.
- **Available actions:** Add a shared manager, select scopes, set optional dates, review, suspend, or revoke.
- **Role and permission requirements:** Owner action with recent authentication; grantee must be an active adult member.
- **Privacy boundaries:** Each grant applies to one Care Recipient and never permits ownership transfer, self-expansion, or removal of owner access.
- **Empty state:** “No one shares management of this record.”
- **Error state:** Inactive member, invalid scope, conflicting mode change, or stale grant version.
- **Destructive-action confirmation:** Revocation and mode changes show immediate permission loss and preserved history.
- **Accessibility behavior:** Scope selection supports keyboard and screen readers, with select-all avoided unless every selected scope is listed.
- **Navigation:** Enters from mode selection or permissions; exits to grant review or Care Recipient role summary.

### 13. Configure Delegated Management

- **Purpose:** Appoint one or more Designated Care Representatives through explicit recorded consent.
- **Intended users:** The adult Care Recipient.
- **Information displayed:** Eligible adults, legal-authority disclaimer, scope choice, start, expiration choice, and current representatives.
- **Available actions:** Start delegation, choose representative, configure scope and lifecycle, review, or cancel.
- **Role and permission requirements:** Owner action with recent authentication; representative must be an active verified adult member.
- **Privacy boundaries:** Delegation is not legal authority, does not remove owner access, and creates no spouse exception.
- **Empty state:** “No Designated Care Representative is active.”
- **Error state:** Representative inactive, duplicate conflicting grant, disputed hold, or consent recording failure.
- **Destructive-action confirmation:** Final creation requires explicit confirmation of representative, Care Recipient, scopes, and duration.
- **Accessibility behavior:** Multi-step progress has text labels, save-and-return where safe, and no loss on text resize.
- **Navigation:** Enters from management-mode selection; proceeds through scope and expiration review; exits to delegation detail.

### 14. Review Delegation Scope

- **Purpose:** Make every delegated capability understandable before consent.
- **Intended users:** Care Recipient grantor and invited representative during acceptance.
- **Information displayed:** Named Care Recipient, representative, each selected scope, excluded scopes, start, expiration, and “on behalf of” audit behavior.
- **Available actions:** Edit scope, confirm, decline, or return.
- **Role and permission requirements:** Grantor confirms creation; representative may accept but cannot expand scope.
- **Privacy boundaries:** “All current Kinward management permissions” expands to a stored snapshot and never includes future permissions automatically.
- **Empty state:** No scopes selected disables confirmation.
- **Error state:** Scope catalog changed, grantor authority changed, or recipient identity mismatch.
- **Destructive-action confirmation:** Confirmation records explicit consent; declining cancels activation without exposing data.
- **Accessibility behavior:** Scope list is plain text with included/excluded status and an accessible summary count.
- **Navigation:** Enters from Shared or Delegated setup; exits to expiration choice, acceptance, or configuration.

### 15. Set Optional Delegation Expiration

- **Purpose:** Recommend a 90-day end date while keeping expiration optional.
- **Intended users:** Care Recipient creating or editing a delegation.
- **Information displayed:** Suggested 90-day date, custom-date choice, “Until revoked” choice, consequences, and review-reminder explanation.
- **Available actions:** Accept suggested date, choose another future date, choose “Until revoked,” or go back.
- **Role and permission requirements:** Grantor must own the Care Recipient record and have recent authentication.
- **Privacy boundaries:** No relative receives a bypass; expiration never widens scope.
- **Empty state:** Suggested 90-day date is prefilled but not silently committed.
- **Error state:** Past date, invalid time zone, changed start date, or stale delegation.
- **Destructive-action confirmation:** Extending an active delegation requires confirmation and audit.
- **Accessibility behavior:** Date input has a text alternative, clear format, and no calendar-only interaction.
- **Navigation:** Enters after scope review; exits to final delegation review or “Until revoked” confirmation.

### 16. Choose “Until Revoked”

- **Purpose:** Confirm a deliberate no-expiration choice and its recurring review requirement.
- **Intended users:** Care Recipient grantor.
- **Information displayed:** No automatic expiration, recurring 90-day access-review reminder, immediate suspension/revocation controls, and current scopes.
- **Available actions:** Confirm “Until revoked,” return to dates, or cancel delegation.
- **Role and permission requirements:** Same owner and recent-authentication requirements as delegation creation.
- **Privacy boundaries:** The choice does not create permanent authority, family exceptions, or future scope additions.
- **Empty state:** Not applicable.
- **Error state:** Consent session expired or grant data changed; return to review without activation.
- **Destructive-action confirmation:** Explicit confirmation is mandatory because access has no scheduled end.
- **Accessibility behavior:** Consequences are in visible text and announced before the confirmation control.
- **Navigation:** Enters from expiration; exits to final review or back to expiration options.

### 17. Suspend or Revoke a Delegation

- **Purpose:** End active access immediately, temporarily or permanently.
- **Intended users:** Care Recipient grantor; disputed holds may be system-enforced under the approved safe restriction.
- **Information displayed:** Representative, scopes, status, dates, last review, impact of suspension versus revocation, and audit preservation.
- **Available actions:** Suspend, restore an unexpired suspended grant, revoke, or cancel.
- **Role and permission requirements:** Owner or explicitly approved authority; representative cannot restore or expand their own grant.
- **Privacy boundaries:** Suspension and revocation deny access everywhere and attempt delegated-session invalidation; unrelated Circle roles remain separate.
- **Empty state:** No active delegation shows history only.
- **Error state:** Already expired/revoked, concurrent change, session invalidation delay, or disputed hold.
- **Destructive-action confirmation:** Revoke requires recent authentication and a final scope-impact summary; suspension requires clear temporary-impact confirmation.
- **Accessibility behavior:** Status and consequences use text, focus moves to the updated status, and live announcements are concise.
- **Navigation:** Enters from delegation detail or permissions review; exits to updated delegation history or roles review.

### 18. Add a Managed Minor Profile

- **Purpose:** Create an adult-managed, non-login minor profile with tightly limited basic information.
- **Intended users:** One authorized adult Circle member who becomes managing adult.
- **Information displayed:** Preferred display name, relationship, age band, visibility default, restrictions, and managing-adult responsibility. Age band is display and age-appropriate-experience information only.
- **Available actions:** Create privately, optionally share approved basic fields with the Circle, archive, or cancel.
- **Role and permission requirements:** Active adult membership and allowed minor-profile creation permission; exactly one managing adult.
- **Privacy boundaries:** No credentials, exact birth date by default, adult role, delegation, Care Recipient access, or medical/emergency information. Selecting, changing, or crossing an age band creates no automatic transition, upgrade, invitation, independent account, ownership transfer, or adult-role path. Kinward does not automatically convert a managed minor profile into an adult account; transition rules remain deferred to their named decision and qualified-review gate.
- **Empty state:** Blank profile with visibility set to managing adult only.
- **Error state:** Duplicate profile, inactive managing adult, invalid age band, or prohibited invitation/login/transition action.
- **Destructive-action confirmation:** Archive or suspend requires confirmation; transfer and permanent deletion route to manual review outside Milestone One.
- **Accessibility behavior:** Restrictions are explained before create; age band is a labeled control, not inferred from a date.
- **Visible transition copy:** “Kinward does not automatically convert a managed minor profile into an adult account. Minor-to-adult transition rules remain deferred.” No convert, claim, transfer-ownership, birthday invitation, automatic-account, or transition action appears.
- **Navigation:** Enters from Circle members; exits to minor profile summary or Circle overview.

### 19. Backup Circle Administrator Designation

- **Purpose:** Designate one verified adult as a dormant contingency role without usable permissions.
- **Intended users:** Authorized Circle Head and proposed adult backup.
- **Information displayed:** Candidate, dormant status, fixed future non-medical boundaries, verification state, and no-self-activation rule.
- **Available actions:** Designate, replace after controlled removal, accept designation, or cancel.
- **Role and permission requirements:** Authorized Circle Head designates; candidate verifies identity and account ownership; one active designation per Circle.
- **Privacy boundaries:** Dormant designation grants no Circle action, Care Recipient access, medical access, succession, or legal authority.
- **Empty state:** “No backup is designated.”
- **Error state:** Candidate inactive, another designation exists, identity not verified, or self-designation attempt.
- **Destructive-action confirmation:** Replacing or removing a designation requires recent authentication and audit summary.
- **Accessibility behavior:** Dormant status and zero current permissions are explicit text, not a muted visual treatment alone.
- **Navigation:** Enters from Circle settings; exits to designation detail, activation history, or settings.

### 20. Backup Circle Administrator Activation

- **Purpose:** Activate fixed non-medical contingency permissions through an authorized path.
- **Intended users:** Authorized Circle Head approving activation and the verified designated backup reauthenticating.
- **Information displayed:** Designation, requested reason, approver, fixed allowed and prohibited actions, reauthentication status, and audit notice. In the compound state—one last active Circle Head attempting departure, no accepted replacement, and no authorized activation approver—the last-Circle-Head block remains active and activation remains unavailable.
- **Available actions:** Request activation, approve or deny as Circle Head, strongly reauthenticate, activate, suspend, or deactivate.
- **Role and permission requirements:** Existing dormant designation, authorized Circle Head approval, a fresh provider-supported challenge, reason, and atomic audit event. Activation grants only the fixed backup scope; it does not make the backup a Circle Head and cannot satisfy the requirement that another verified adult accept Circle Head.
- **Privacy boundaries:** Backup cannot self-activate by claiming unavailability, never receives Care Recipient-specific or hidden authority, cannot remove or replace the final Circle Head, and cannot bypass the last-active-Circle-Head block. No automatic succession, incapacity determination, death determination, or alternate recovery mechanism exists in Milestone One.
- **Empty state:** No eligible dormant designation blocks the flow.
- **Error state:** Missing approver routes to Screen 30, the terminal Milestone One recovery-unavailable state, which grants no authority. Failed reauthentication, disputed Circle authority, expired request, or stale designation also grants no access. See visual Screens 29–31 together.
- **Destructive-action confirmation:** Activation, suspension, and deactivation each require a clear fixed-scope confirmation.
- **Accessibility behavior:** Multi-party status is announced plainly; calm neutral copy states that the action cannot currently be completed; failure never suggests that authority was granted.
- **Navigation:** Enters from backup detail; exits to activated-scope summary, denied request, or audit history.

### 21. Roles and Permissions Review

- **Purpose:** Explain effective access by Circle, Care Recipient, role, grant, restriction, and lifecycle state.
- **Intended users:** Each member for their own access; Care Recipients for their record; Circle Heads for Circle administration only.
- **Information displayed:** Active assignments, grants, denied scopes, source of access, expiration/review dates, statuses, and any “Access review due” item for the selected Care Recipient.
- **Available actions:** Filter by Circle or Care Recipient, open a permitted assignment, request correction, or perform an authorized change.
- **Role and permission requirements:** Audit-safe, scope-limited visibility; no viewer sees assignments that would disclose an inaccessible Care Recipient.
- **Privacy boundaries:** Effective permission union never crosses Circle or Care Recipient boundaries; explicit restrictions are visible to affected actors.
- **Empty state:** “No roles or grants apply in this context.”
- **Error state:** Stale permission snapshot triggers reload and safe denial.
- **Destructive-action confirmation:** Changes are performed on their dedicated screens, not inline.
- **Accessibility behavior:** Use lists and headings rather than color-coded diagrams; expose the access source in text.
- **Navigation:** Enters from member, Care Recipient, or settings; exits to role, grant, or audit detail.

### 22. Audit-History View

- **Purpose:** Show privacy-respecting history for role, permission, delegation, membership, backup, and minor-control changes.
- **Intended users:** Care Recipients for events affecting their record; Circle Heads for Circle-administration events; actors for their own actions.
- **Information displayed:** Time, actor, action, target identifier or safe label, Circle, Care Recipient when permitted, result, on-behalf-of context, and before/after identifiers.
- **Available actions:** Filter within authorized scope, open an event, or return; no edit or delete.
- **Role and permission requirements:** Opening the audit screen does not authorize its rows or every field within a row. The server independently authorizes every event row and display field by event class, Circle, affected Care Recipient when applicable, actor identity, approver identity, reason, attempted value, resulting state, and safe display text.
- **Privacy boundaries:** Unauthorized row fields are masked or omitted. Each authorized row exposes no hidden role, record, proposed authority, denied or blocked value, reason, or sensitive identifier beyond the viewer's scope. Circle-wide authority does not reveal recipient-specific denied writes; recipient-specific access does not reveal unrelated Circle-administration events. Routine denied reads remain outside family-visible audit history, and consequential denied writes appear only within the viewer's authorized audit scope. Filtered and empty states disclose no hidden count or existence.
- **Empty state:** “No audit events are available in this scope.”
- **Error state:** Safe generic failure; never fall back to a broader event query.
- **Destructive-action confirmation:** None; audit events are immutable.
- **Accessibility behavior:** Chronological list with semantic timestamps, filter labels, and readable before/after summaries.
- **Navigation:** Enters from settings, role, grant, or backup detail; exits to the authorized source screen.

### 23. Circle Settings

- **Purpose:** Manage approved non-medical Circle settings and lifecycle controls.
- **Intended users:** Circle Heads; activated backup only for its fixed allowed subset.
- **Information displayed:** Circle name, membership controls, backup designation, archive status, audit link, current authority summary, and last-active-Circle-Head continuity state.
- **Available actions:** Rename, manage membership, open roles, designate backup, archive Circle, or leave when allowed.
- **Role and permission requirements:** Action-specific Circle administration permission; no setting grants Care Recipient access.
- **Privacy boundaries:** No medical, caregiver, or Care Recipient private information appears.
- **Empty state:** Default Circle settings with no backup designation.
- **Error state:** Denied action, concurrent archive, or inactive backup scope. The last active Circle Head sees a clear block stating that another verified adult must accept Circle Head before they can leave or lose the role.

- **Destructive-action confirmation:** Archive, leave, membership removal, and authority changes require impact summaries and recent authentication.
- **Accessibility behavior:** Dangerous actions are separated and labeled; keyboard focus returns after modal cancellation.
- **Navigation:** Enters from Circle overview or shell; exits to members, backup, audit, or My Kinward after archive/leave.

### 24. Accessible Mobile Navigation Shell

- **Purpose:** Provide consistent navigation without introducing out-of-scope care features.
- **Intended users:** All authenticated adults, filtered by context and permissions.
- **Information displayed:** My Kinward, active Circle, active Care Recipient when applicable, Overview, Members, Roles, Audit, and Settings destinations.
- **Available actions:** Switch Circle, switch Care Recipient, open permitted destination, return, or sign out.
- **Role and permission requirements:** Navigation items are derived from authorized routes, but route and data authorization still run independently server-side.
- **Privacy boundaries:** Hidden destinations are not security controls; direct unauthorized requests return denied states with no protected data.
- **Empty state:** Shell shows My Kinward and setup action when no Circle exists.
- **Error state:** Preserve safe shell and context reset; never display stale protected content.
- **Destructive-action confirmation:** Sign out confirms only when unsaved setup exists.
- **Accessibility behavior:** Skip link, landmarks, visible focus, targets at least 48 × 48 CSS pixels, reduced motion, screen-reader page title, and logical back behavior.
- **Navigation:** Wraps all authenticated screens and clears context-specific client state on every Circle or Care Recipient change.

### 25. Empty, Loading, Error, Denied-Access, and No-Role States

- **Purpose:** Provide safe, useful states without revealing protected records or implying system authority.
- **Intended users:** Any authenticated or invited adult encountering incomplete, delayed, or unauthorized data.
- **Information displayed:** State title, plain explanation, safe next action, context when permitted, and support-independent recovery steps.
- **Available actions:** Retry, return, switch context, request a new invitation, or contact an authorized Circle person outside hidden support access.
- **Role and permission requirements:** State generation follows the same server and database authorization as successful content.
- **Privacy boundaries:** Denied and not-found responses are indistinguishable where existence itself is sensitive; no names, counts, or stale content leak.
- **Empty state:** Distinguish “nothing created,” “nothing shared with you,” and “no role assigned” without exposing why protected data is absent.
- **Error state:** Correlation identifier contains no sensitive data; logs receive safe metadata only.
- **Destructive-action confirmation:** None unless recovery would cancel or revoke an existing record.
- **Accessibility behavior:** Loading status is announced once, errors receive focus, retry is keyboard accessible, and motion is not required.
- **Navigation:** Available from every route; recovery returns to the nearest authorized parent or My Kinward.

### 26. Care Recipient Context Reset — Visual Screen 39

- **Purpose:** Safely interrupt a Dad-scoped protected action when the user switches to Mom and prevent any cross-recipient carryover or momentary display.
- **Intended users:** An authenticated adult switching Care Recipient while a recipient-scoped page, draft, filter, deep link, count, cached label, or permission result is active.
- **Information displayed:** The starting Dad frame may show an in-flight protected request or write. After switch initiation, a neutral “Changing Care Recipient…” state appears with the destination name only when the viewer is permitted to know it; no Dad heading, draft, filter, count, badge, cached label, field label, deep-link result, permission result, error, or Mom protected content.
- **Available actions:** Wait for authorization confirmation or return to the nearest safe Circle-wide or previously authorized context.
- **Role and permission requirements:** Cancel the Dad request where supported or mark its success/error result stale and discard it. A late Dad response arriving during reset or after Mom authorization succeeds cannot repaint any Dad state. Clear all Dad-scoped client state before issuing Mom-scoped protected queries. Render Mom protected content only after server and database authorization confirm the exact Mom scope; never reuse Dad permission results.
- **Privacy boundaries:** No Dad information may flash in Mom context. An unauthorized Mom destination returns the same non-leaking denied/not-found state used for sensitive existence boundaries, with no Mom record, heading, count, or label.
- **Empty state:** Neutral reset/loading state while destination authorization is pending; it is not a protected-content empty state.
- **Error state:** Authorization failure clears the pending destination and deep-link state and offers a safe return without revealing whether Mom exists.
- **Destructive-action confirmation:** If the interrupted Dad action contains an unsaved draft, show discard confirmation before clearing context. Cancelling the confirmation keeps Dad context and its draft. Confirming discard permanently invalidates the old request and draft before the switch continues; no draft is carried forward.
- **Accessibility behavior:** Announce the context change, discard outcome, and neutral loading status to screen readers; use text plus reduced-motion-safe feedback rather than a spinner alone; and after authorization move focus predictably to the new Care Recipient context heading. At 200% text, primary content reflows without horizontal scrolling; error-summary focus and field associations are preserved, and authorized input remains after validation errors.
- **Navigation:** Enters from Screen 13 or Screen 38 while in Dad context; exits to authorized Mom content after confirmation, or Screen 37 when authorization is denied.

## D-8 Through D-17 Screen Amendments

- **Adult owner onboarding:** “Add a Care Recipient” creates only a pending inactive record and sends a dedicated ownership invitation to verified email. Before acceptance, no private fields are available. The invitation names the Circle and proposer, explains sole ownership and consequences, and allows decline. Acceptance also creates Circle membership.
- **My Kinward:** Displays “Access review due” for every due “Until revoked” delegation and keeps it visible until an authorized continue, modify, suspend, or revoke decision.
- **Delegation detail:** Displays the same due item plus next review, last review, reviewer, and decision when authorized; completion resets a continued grant by 90 days.
- **Audit view:** Shows consequential denied authority writes, but never routine denied reads. Routine denied reads have no family-visible placeholder or count.
- **Environment labels:** Local and hosted preview designs carry synthetic/test labeling. No screen implies that the restricted real-family beta is authorized or that document upload exists.

## Wireframe Review Checklist

- No medical or care-content screen is included.
- Every screen shows or safely derives its Circle and Care Recipient context.
- Every consequential action includes server authorization, confirmation, and an audit expectation.
- Every denied state prevents existence, count, label, and cached-state leakage.
- Every flow supports phone use, keyboard use, screen readers, text resizing, high contrast, and reduced motion.
- Kinward's approved product baseline is at least 48 × 48 CSS pixels for every interactive target, including where an external standard permits a smaller target.
- Every screen preserves text labels in addition to color or icons, visible focus, screen-reader announcements, 200% primary-content reflow without horizontal scrolling, error summaries with field associations, reduced-motion-safe loading feedback, and one clear primary action.
- The canonical visual-planning baseline contains 39 low-fidelity planning screens across 9 flow files and is verified for advancement into high-fidelity design. High-fidelity design is authorized by the product owner for design only; outputs remain draft until reviewed. Application coding is not authorized, and no final interface design or implemented application interface exists.
