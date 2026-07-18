# Kinward Milestone One User Flows

> **Status:** Updated product flows reflecting D-8 through D-17; closed and verified by targeted systems audit; no implementation authorized
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing decisions:** D-1 through D-17; `MILESTONE_ONE_DECISIONS.md`; `PERMISSIONS.md`

## Flow Rules

- All examples are synthetic.
- Every protected read and write checks the authenticated user, active Circle, active Care Recipient when relevant, active lifecycle state, explicit permission, and any restriction.
- A failed check returns no protected data. Consequential denied authority writes enter family audit; routine denied reads use a separate privacy-safe security channel where appropriate.
- Milestone One identity and invitation binding use verified email only.
- Consequential authority actions require authentication within the prior 15 minutes; backup activation requires a fresh provider-supported challenge every time.
- UI visibility never replaces server-side and database authorization.
- **GOV-004 traceability correction:** UF-01 is first-Circle creation; UF-03 is adult Care Recipient ownership proposal/acceptance; UF-04 is ordinary adult Circle invitation; UF-05 covers invitation lifecycle. The former conflicting screen-index identifiers remain recorded in `DOCUMENT_GOVERNANCE.md`; no behavior changed.

## UF-01 — New User Creates Their First Circle

- **Starting condition:** Synthetic adult Avery has a verified Kinward account and no Circle membership.
- **Actor:** Avery.
- **Permission checks:** Authenticated account; Circle creation enabled; no existing transaction with the same idempotency key.
- **Main steps:** Open My Kinward; choose Create Circle; enter “Harbor Circle”; review creator-as-first-Circle-Head statement; confirm creation.
- **Alternate paths:** Cancel with no entered or modified data returns directly. Cancel after entering a Circle name or changing a setting opens an unsaved-changes confirmation; the safe default returns to editing, while deliberate discard leaves without creating a Circle. Retry a recoverable failure without creating a duplicate.
- **Failure and recovery:** Authentication expires or name validation fails; preserve non-sensitive input and require reauthentication or correction.
- **Audit events:** `circle.created`, `membership.created`, and `circle_role.assigned` for Circle Head in one atomic outcome.
- **Final state:** Avery has one active membership and one active Circle Head assignment; no Care Recipient access exists yet.
- **Acceptance criteria:** Circle creator metadata does not become permanent ownership or Care Recipient authority.

## UF-02 — Existing User Joins a Second Circle

- **Starting condition:** Avery belongs to Harbor Circle and receives a valid invitation to synthetic Cedar Circle.
- **Actor:** Avery.
- **Permission checks:** Signed in with the matching invited verified-email identity; invitation active, unused, unexpired, and bound to Cedar Circle.
- **Main steps:** Open invitation; verify the invited email; review Cedar roles; accept; return to My Kinward; see both Circles separately.
- **Alternate paths:** Decline or leave invitation pending.
- **Failure and recovery:** Wrong account, cancelled invitation, or expired link; reveal no Cedar data and allow request for a replacement.
- **Audit events:** `invitation.accepted`, `membership.created`, and approved role activation events.
- **Final state:** Separate membership and role records exist for each Circle.
- **Acceptance criteria:** Harbor permissions, drafts, labels, and records never appear in Cedar context.

## UF-03 — Circle Head Adds Two Care Recipients

- **Starting condition:** Avery is Harbor Circle Head; fictional adults “Dad” and “Mom” have verified accounts but no Harbor Care Recipient records.
- **Actor:** Avery proposes; Dad and Mom each accept ownership.
- **Permission checks:** Avery may propose Care Recipients; each invited adult verifies and uses the bound email identity and accepts sole ownership.
- **Main steps:** Create Dad's inactive pending record; send a dedicated ownership invitation to Dad's verified email; Dad reviews the Circle, proposer, sole ownership, consequences, permissions, and decline option; Dad accepts; atomically create membership, ownership acceptance, consent history, and active owner-linked record; repeat independently for Mom.
- **Alternate paths:** A Circle Head adds themselves immediately as owner; one proposed adult declines while the other accepts.
- **Failure and recovery:** Duplicate proposal, identity mismatch, or expired ownership invitation; keep the shell pending or archive it without private content.
- **Audit events:** `care_recipient.proposed`, `ownership_invitation.created`, `care_recipient.owner_accepted`, `membership.created`, and `care_recipient.activated` for each adult.
- **Final state:** Two separate Care Recipient records, owner links, management modes, and permission contexts.
- **Acceptance criteria:** No private record data exists before acceptance; acceptance also establishes Circle membership without a second invitation; Avery gains no private access solely from Circle Head status; Dad and Mom never share ownership.

## UF-04 — Circle Head Invites the Family Coordinator

- **Starting condition:** Avery is Circle Head; synthetic adult Jordan is not a Harbor member.
- **Actor:** Avery invites; Jordan accepts.
- **Permission checks:** Avery may invite and propose the Circle-wide Family Coordinator role; no Care Recipient permission is included.
- **Main steps:** Enter Jordan’s verified email; select Circle-wide Family Coordinator; preview boundaries; send; Jordan verifies and accepts.
- **Alternate paths:** Jordan accepts membership but the role awaits an additional authorized confirmation if required by policy.
- **Failure and recovery:** Mismatched email identity, duplicate invitation, expiration, cancellation, or delivery failure.
- **Audit events:** `invitation.created`, `invitation.accepted`, `membership.created`, `circle_role.assigned`.
- **Final state:** Jordan coordinates Circle-wide non-medical administration without Dad or Mom management access.
- **Acceptance criteria:** Family Coordinator scope cannot read or manage Care Recipient-specific records.

## UF-05 — Member Accepts, Declines, or Ignores an Invitation

- **Starting condition:** One active seven-day invitation exists.
- **Actor:** Invited verified adult.
- **Permission checks:** Contact match, active token hash, unused state, and valid expiration.
- **Main steps:** Accept creates membership; decline records decline and invalidates the token; ignore leaves no access and expires automatically.
- **Alternate paths:** Inviter cancels or resends only through a new invitation.
- **Failure and recovery:** Used, cancelled, expired, or mismatched links return a generic safe state.
- **Audit events:** `invitation.accepted`, `invitation.declined`, `invitation.expired`, or `invitation.cancelled`.
- **Final state:** Only acceptance produces membership; all other outcomes produce no Circle access.
- **Acceptance criteria:** Invitation links never grant access by possession alone.

## UF-06 — Care Recipient Chooses Self-Managed

- **Starting condition:** Dad owns an active Care Recipient record with no selected management mode.
- **Actor:** Dad.
- **Permission checks:** Dad’s owner account, active record, recent authentication, and no disputed hold.
- **Main steps:** Compare modes; select Self-Managed; review that non-management family roles may remain; confirm.
- **Alternate paths:** Cancel and remain unconfigured.
- **Failure and recovery:** Session expires or record enters disputed hold; deny change and preserve no partial grants.
- **Audit events:** `management_mode.changed` from unset to self-managed.
- **Final state:** Dad directly controls management; no Shared or Delegated grant is active.
- **Acceptance criteria:** Family Coordinator, Care Lead, Medical Lead, or Chemo Care Lead roles do not become management grants.

## UF-07 — Self-Managed Moves to Shared Management

- **Starting condition:** Dad is Self-Managed; Jordan is an active adult member.
- **Actor:** Dad.
- **Permission checks:** Owner authority, recent authentication, eligible adult grantee, valid selected scopes.
- **Main steps:** Select Shared Management; choose Jordan; select management scopes; review; confirm.
- **Alternate paths:** Add more than one shared manager through separate grants; remain Self-Managed by cancelling.
- **Failure and recovery:** Inactive member, invalid scope, or concurrency conflict; no partial active grant.
- **Audit events:** `management_mode.changed`, `shared_grant.created`, `permission_scopes.recorded`.
- **Final state:** Dad remains owner and primary manager; Jordan has only selected active scopes.
- **Acceptance criteria:** Jordan cannot transfer ownership, self-expand, or remove Dad’s access.

## UF-08 — Care Recipient Chooses Delegated Management

- **Starting condition:** Dad owns the record; synthetic adult Riley is an active verified member.
- **Actor:** Dad creates; Riley accepts.
- **Permission checks:** Owner authority, eligible representative, explicit scope, consent, lifecycle choice, and contact identity.
- **Main steps:** Choose Delegated Management; select Riley; select scopes; select expiration; review; consent; Riley accepts.
- **Alternate paths:** Multiple representatives receive separate grants; “all current permissions” stores the current scope snapshot.
- **Failure and recovery:** Riley declines, identity mismatches, or scope changes before acceptance; delegation remains pending or cancelled with no access.
- **Audit events:** `management_mode.changed`, `delegation.created`, `delegation.consent_recorded`, `delegation.accepted`, `delegation.activated`.
- **Final state:** Riley acts only within active scopes on Dad’s behalf; Dad retains access.
- **Acceptance criteria:** Delegation creates no legal authority and no spouse or family exception.

## UF-09 — Delegation Uses Suggested 90-Day Expiration

- **Starting condition:** Dad is creating a valid delegation.
- **Actor:** Dad.
- **Permission checks:** Owner authority and a future date computed from the recorded start date and time zone.
- **Main steps:** Accept prefilled 90-day date; review exact date; confirm delegation.
- **Alternate paths:** Choose another future date or “Until revoked.”
- **Failure and recovery:** Invalid or past date returns to the expiration step.
- **Audit events:** `delegation.expiration_selected` and activation event containing expiration identifier.
- **Final state:** Active delegation automatically becomes expired at the recorded time unless suspended or revoked sooner.
- **Acceptance criteria:** Ninety days is a recommended prefill, not a required duration.

## UF-10 — Delegation Uses “Until Revoked”

- **Starting condition:** Dad is creating a delegation and does not choose an expiration.
- **Actor:** Dad.
- **Permission checks:** Owner authority and explicit no-expiration confirmation.
- **Main steps:** Choose “Until revoked”; read recurring-review explanation; confirm; activate after representative acceptance.
- **Alternate paths:** Return and choose a date.
- **Failure and recovery:** Consent expires before confirmation; no active grant is created.
- **Audit events:** `delegation.no_expiration_selected`, `delegation.review_scheduled`, and activation.
- **Final state:** `expires_at` is null, `next_review_at` is set 90 days ahead, and status is active.
- **Acceptance criteria:** A recurring 90-day review is scheduled without changing the lifecycle state automatically.

## UF-11 — Delegation Is Suspended

- **Starting condition:** Riley has an active, unexpired delegation for Dad.
- **Actor:** Dad.
- **Permission checks:** Owner authority, current active status, recent authentication.
- **Main steps:** Open grant; choose Suspend; review impact; confirm; invalidate delegated sessions where technically possible.
- **Alternate paths:** A disputed-authority safe hold suspends the grant without selecting a claimant.
- **Failure and recovery:** Concurrent revocation or expiration wins; UI reloads the current state.
- **Audit events:** `delegation.suspended` and `delegated_sessions.invalidated` result.
- **Final state:** Grant and history remain; authorization denies every delegated scope until valid restoration.
- **Acceptance criteria:** Riley’s unrelated Circle-wide role, if any, remains separate.

## UF-12 — Delegation Is Revoked

- **Starting condition:** Riley has an active or suspended delegation for Dad.
- **Actor:** Dad.
- **Permission checks:** Owner authority and recent authentication.
- **Main steps:** Choose Revoke; review permanent effect; confirm; remove effective permissions; invalidate sessions where possible.
- **Alternate paths:** Cancel and leave status unchanged.
- **Failure and recovery:** Already revoked or expired returns an idempotent current-state result.
- **Audit events:** `delegation.revoked`, scope-removal result, and session-invalidation result.
- **Final state:** Status is revoked and cannot be restored; history remains append-only.
- **Acceptance criteria:** Marriage, Circle role, or prior access cannot preserve delegated permissions.

## UF-13 — One User Holds Multiple Roles

- **Starting condition:** Jordan is Circle-wide Family Coordinator and Dad-specific Care Lead.
- **Actor:** Authorized assigners create separate assignments.
- **Permission checks:** Each assigner controls the relevant scope; assignments are active and in the same Circle.
- **Main steps:** Assign both roles; open permission review; calculate union only within each matching context.
- **Alternate paths:** Add another Dad-specific role or a separate Mom-specific role.
- **Failure and recovery:** Duplicate role is rejected or treated idempotently; cross-Circle roles never combine.
- **Audit events:** One `role_assignment.created` event per assignment.
- **Final state:** Jordan’s effective permissions are context-specific unions with restrictions applied last.
- **Acceptance criteria:** A Dad role grants nothing for Mom; Circle-wide coordination grants no Care Recipient management.

## UF-14 — Role Removal

- **Starting condition:** Jordan has an active role assignment.
- **Actor:** Authorized Circle Head for Circle-wide role or Dad/authorized manager for Dad-specific role.
- **Permission checks:** Actor may remove that exact assignment and is not using the action to expand their own authority.
- **Main steps:** Open role; choose Remove; review future-access impact; reauthenticate; confirm.
- **Alternate paths:** Suspend instead when temporary pause is supported.
- **Failure and recovery:** Assignment already inactive, actor authority removed, or last-Circle-Head safety restriction.
- **Audit events:** `role_assignment.removed` and active-session authorization refresh result.
- **Final state:** Future role-derived access ends; unrelated roles and historical events remain.
- **Acceptance criteria:** Removal does not erase history or silently revoke unrelated delegation.

## UF-15 — Access to Dad but Not Mom

- **Starting condition:** Harbor Circle has Dad and Mom; Jordan has one Dad-specific role only.
- **Actor:** Jordan.
- **Permission checks:** Dad permission succeeds; Mom has no matching assignment or grant.
- **Main steps:** Open Dad context successfully; switcher omits or safely denies Mom; direct Mom URL is denied.
- **Alternate paths:** A separate Mom grant later adds only its explicit scope.
- **Failure and recovery:** Cached Dad state is cleared before any Mom request; denied response returns no Mom metadata.
- **Audit events:** Optional security event for direct unauthorized Mom request; normal Dad reads follow privacy-safe access logging policy.
- **Final state:** Dad access remains; Mom remains inaccessible.
- **Acceptance criteria:** No Mom name, count, role, placeholder, audit entry, or data appears through the unauthorized request.

## UF-16 — Managed Minor Profile Creation

- **Starting condition:** Jordan is an active adult permitted to create one synthetic minor profile.
- **Actor:** Jordan as managing adult.
- **Permission checks:** Adult membership, allowed Circle action, no independent user identity, one managing adult.
- **Main steps:** Enter preferred name, relationship, and age band; accept restrictions; create private; optionally share basic profile fields.
- **Alternate paths:** Keep profile visible only to managing adult; archive later.
- **Failure and recovery:** Prohibited login/invitation attempt, duplicate profile, or inactive managing adult.
- **Audit events:** `minor_profile.created`, `managing_adult.assigned`, optional `minor_visibility.changed`.
- **Final state:** Managed profile has no authentication identity, adult role, delegation, or Care Recipient access.
- **Acceptance criteria:** Transfer and permanent deletion are unavailable and route to documented future review.

## UF-17 — Backup Circle Administrator Designation

- **Starting condition:** Harbor Circle has no backup designation; Jordan is a verified adult member.
- **Actor:** Avery as Circle Head; Jordan accepts designation.
- **Permission checks:** Avery may designate; Jordan controls the account; one-per-Circle constraint.
- **Main steps:** Select Jordan; review dormant boundaries; verify account ownership; Jordan accepts; record designation.
- **Alternate paths:** Cancel or later replace through controlled removal.
- **Failure and recovery:** Existing designation, identity failure, inactive member, or unauthorized designator.
- **Audit events:** `backup.designated`, `backup.identity_verified`, `backup.designation_accepted`.
- **Final state:** Dormant designation exists with zero usable backup permissions.
- **Acceptance criteria:** Jordan gains no Circle action or Care Recipient access from designation alone.

## UF-18 — Dormant Backup Activation

- **Starting condition:** Jordan is the verified dormant backup; Avery is an active authorized Circle Head.
- **Actor:** Avery approves; Jordan strongly reauthenticates.
- **Permission checks:** Dormant designation active, approver authorized, reason present, strong reauthentication successful, no dispute hold.
- **Main steps:** Request activation; Avery reviews fixed scope and approves; Jordan reauthenticates; system activates atomically and records audit.
- **Alternate paths:** Avery denies; later suspend or deactivate. Activation does not make Jordan a Circle Head and cannot satisfy Circle Head replacement acceptance or bypass the last-active-Circle-Head block.
- **Failure and recovery:** Jordan attempts self-activation, no Circle Head can approve, the fresh provider-supported challenge fails, or the request expires; remain dormant. When no approver exists, show the terminal Milestone One recovery-unavailable state, grant no authority, and make no incapacity, death, succession, or legal-authority determination. The alternate recovery branch remains deferred.
- **Audit events:** Request, approval/denial, reauthentication result, activation, later actions, suspension, and deactivation.
- **Final state:** Jordan receives only fixed non-medical backup permissions while active.
- **Acceptance criteria:** No Care Recipient access, ownership transfer, delegation change, self-expansion, Circle Head status, final-Circle-Head removal or replacement, Circle deletion, or hidden succession path.

## UF-19 — User Switches Between Multiple Circles

- **Starting condition:** Avery belongs to Harbor and Cedar Circles.
- **Actor:** Avery.
- **Permission checks:** Active membership in destination Circle; every subsequent query includes destination Circle context.
- **Main steps:** Open Circle switcher; choose Cedar; clear Harbor client state; load Cedar-authorized shell.
- **Alternate paths:** Return to My Kinward or switch back.
- **Failure and recovery:** Destination membership removed; reset to My Kinward with generic message.
- **Audit events:** No sensitive audit required for ordinary switching; security logging uses identifiers without family content.
- **Final state:** Only Cedar context and permissions are active in the interface and requests.
- **Acceptance criteria:** Harbor records, names, drafts, filters, cached results, and Care Recipient context do not persist.

## UF-20 — Unauthorized Cross-Circle Access Attempt

- **Starting condition:** Avery belongs to Harbor but not restricted synthetic Birch Circle.
- **Actor:** Avery submits a Birch identifier through a direct request.
- **Permission checks:** Membership and active scope fail before any record query returns data.
- **Main steps:** Server validates Circle context; database RLS rejects; application returns generic not-found-or-denied state.
- **Alternate paths:** None that reveal Birch existence.
- **Failure and recovery:** Correlation ID is provided; user returns to My Kinward.
- **Audit events:** No family-visible event for this routine denied read; a privacy-safe security event may record safe technical identifiers and reason code.
- **Final state:** No Birch data enters server response, client cache, logs, or audit view visible to Avery.
- **Acceptance criteria:** Manipulating URLs, request bodies, or client state cannot bypass isolation.

## UF-21 — Unauthorized Cross-Care-Recipient Access Attempt

- **Starting condition:** Avery belongs to Harbor and may access Dad but not Mom.
- **Actor:** Avery submits Mom’s identifier directly.
- **Permission checks:** Circle membership passes; Care Recipient-specific permission fails; explicit restrictions would also deny.
- **Main steps:** Server evaluates recipient context; RLS denies protected rows; application shows generic denied state.
- **Alternate paths:** Request an authorized role outside the denied response; no automatic grant.
- **Failure and recovery:** Safe correlation identifier only; reset active Care Recipient to Dad or Circle-wide context.
- **Audit events:** No family-visible event for this routine denied read; a privacy-safe security event may record a non-content reason code without revealing Mom.
- **Final state:** No Mom data or existence clue is returned or cached.
- **Acceptance criteria:** Circle membership and Dad access never imply Mom access.

## UF-22 — Last Active Circle Head Continuity

- **Starting condition:** Avery is the final active Circle Head.
- **Actor:** Avery or another actor attempting removal or downgrade.
- **Permission checks:** Count accepted active Circle Head assignments inside the exact Circle and require a verified replacement acceptance first.
- **Main steps:** Attempt leave, self-removal, removal by another actor, and downgrade; block each; invite or assign a verified adult; wait for acceptance; then permit the original transition with recent authentication.
- **Failure and recovery:** Backup activation cannot complete or substitute for Circle Head transfer. If no verified adult accepts Circle Head, keep the leave/removal/downgrade action blocked. If no active Circle Head can approve backup activation, the neutral unavailable state is terminal for Milestone One and the future alternate recovery branch remains deferred.
- **Audit events:** Consequential denied action, replacement acceptance, and later successful role or membership transition.
- **Final state:** The Circle always has at least one accepted active Circle Head.
- **Acceptance criteria:** Backup designation or activation never becomes Circle Head, never removes or replaces the final Circle Head, and never bypasses verified replacement acceptance.

## UF-25 — Care Recipient Context Reset

- **Starting condition:** Jordan is in Dad context with a protected Dad-scoped request or write still in progress plus a draft, filter, count, heading, cached label, deep link, permission result, or error and chooses Mom.
- **Actor:** Jordan, whose Mom-specific authorization may be allowed or denied independently of Dad access.
- **Permission checks:** Clear Dad-scoped client state first; then evaluate active Harbor membership and exact Mom-specific server and database permission without reusing Dad authorization.
- **Main steps:** Begin in Dad; choose Mom; if a Dad draft is unsaved, prompt before clearing; after confirmation, cancel the Dad request where supported or invalidate its result, permanently invalidate the draft, clear Dad headings, filters, counts, badges, labels, deep-link state, cache, permission results, and errors; show a neutral reset/loading state; request Mom authorization; discard every late Dad success or error; render Mom content only after confirmation; announce the change and move focus to the Mom context heading.
- **Alternate paths:** Cancelling the discard prompt keeps Dad context, request, and draft. If Mom is unauthorized, show a non-leaking denied/not-found state and offer a safe Circle-wide or previously authorized return.
- **Failure and recovery:** Network or authorization failure renders no Dad or Mom protected content and retains no destination deep link.
- **Audit events:** Ordinary authorized context switching creates no family audit event; appropriate privacy-safe operational/security logging contains no family content.
- **Final state:** Only the confirmed destination context and permissions exist in the interface and client state.
- **Acceptance criteria:** A delayed Dad response arriving during reset or after Mom authorization cannot repaint Dad state. No prior-recipient heading flash, draft, count/badge, cache, deep-link, field-label, error, or permission-result carryover occurs; prompt cancellation stays in Dad; confirmed discard invalidates the old work; focus is predictable.

## UF-26 — Per-Viewer Audit-Row Authorization

- **Starting condition:** The audit store contains Circle-administration and Dad-specific events, including a consequential denied Dad write, with actor identity that some viewers may see only masked.
- **Actor:** Avery as Circle Head without Dad-specific access and Dad as Care Recipient owner without unrelated Circle-administration access.
- **Permission checks:** Authorize each row and each display field independently by event class, Circle, affected Care Recipient, actor identity, approver identity, reason, attempted value, resulting state, and safe display text.
- **Main steps:** Each actor opens the same audit route; the server evaluates every candidate row and field; return only authorized rows; mask or omit actor, approver, reason, proposed authority, attempted/blocked value, and resulting state where not permitted; omit unauthorized rows without counts or filtered-state clues.
- **Alternate paths:** Empty and denied audit states use generic copy and never broaden the query.
- **Failure and recovery:** A row-policy or query failure returns a safe generic audit error, never a partially broader event set.
- **Audit events:** Audit reads may use privacy-safe operational logging; they do not create editable family audit content.
- **Final state:** Avery sees only authorized Circle-administration rows; Dad sees only authorized Dad rows; neither infers excluded events.
- **Acceptance criteria:** Opening the audit screen never authorizes all rows; routine denied reads remain absent; consequential denied writes appear only in authorized viewer scope.

## UF-23 — Review an “Until Revoked” Delegation

- **Starting condition:** Dad's delegation reaches `next_review_at`.
- **Actor:** Dad as Care Recipient owner.
- **Permission checks:** Exact owner, Care Recipient, delegation, and current lifecycle; recent authentication for any consequential change.
- **Main steps:** See “Access review due” in My Kinward, the Care Recipient permission summary, and delegation detail; choose continue, modify, suspend, or revoke.
- **Failure and recovery:** Reminder remains after cancellation or failed write; no email, SMS, or push is sent.
- **Audit events:** Review completed with reviewer, decision, last-reviewed time, next-review time when continued, and any lifecycle or scope event.
- **Final state:** Due item clears only after a successful decision; continued access receives a new 90-day review date.
- **Acceptance criteria:** All three placements and review timestamps agree.

## UF-24 — Environment and Real-Data Gate

- **Starting condition:** Local and hosted preview are synthetic-only; the restricted pilot is not authorized.
- **Actor:** Product team or approved tester.
- **Permission checks:** Environment classification, Gate C status, signed beta readiness, and allowed data category.
- **Main steps:** Use synthetic data locally and in preview; reject real-data plans; prepare a separate future **Restricted real-care family pilot** only after Gate C and signed authorization.
- **Failure and recovery:** Any attempted real entry before approval stops; no data is copied between environment types.
- **Audit events:** Operational readiness evidence only; no family audit or real content.
- **Final state:** No real information or document upload enters Milestone One environments.
- **Acceptance criteria:** Separate resources and no cross-environment data path are documented before pilot readiness.

## Flow Review Checklist

- Every flow identifies an actor, permission source, lifecycle state, audit result, safe failure, and final state.
- No flow uses family relationship as authority.
- No flow treats a Circle Head or activated backup as Care Recipient owner.
- No flow adds medical, care-content, notification, document-validation, or production behavior.
