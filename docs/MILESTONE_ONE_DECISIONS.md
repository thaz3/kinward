# Kinward Milestone One Decision Sheet

> **Status:** Approved milestone-one decisions; D-8 through D-17 closed and verified by targeted systems audit
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing or related decisions:** D-1 through D-17; F-01-R, F-02-R, F-17 through F-19

## Purpose and Scope

This sheet contains only decisions that affect the first coding milestone: accounts, Family Circles, Care Recipients, membership, roles, management modes, delegation, managed minor profiles, permission-change audit history, and the accessible mobile-first application shell.

The milestone does not include check-ins, symptoms, measurements, treatment tracking, care content, alerts, external notifications, offline emergency access, document uploads, analytics, or integrations. Checked selections below are approved product defaults. They are not legal determinations and do not replace the qualified reviews required by D-6.

## Decisions

### 1. Circle Ownership

1. **Decision:** How a Family Circle is controlled.
2. **Recommended MVP default:** A Circle is governed through active Circle Head role assignments, not owned as personal data by one user. The creator becomes the first Circle Head. Store who created the Circle, but do not use that field as permanent authority. Circle Head status never grants Care Recipient-specific access.
3. **Other reasonable options:** Give one user permanent ownership; allow several equal owners; or make every adult member a Circle Head.
4. **Main tradeoff:** Role-based control needs more records than a single owner field, but avoids tying the Circle permanently to one account.
5. **Database or permission impact:** Circle record, membership record, Circle Head role assignment, creator metadata, active-status checks, and separate Circle-versus-Care Recipient permission scopes.
6. **Major rework later:** **Yes** if the first model uses one permanent `owner` field as the permission source.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 2. Self-Managed Mode

1. **Decision:** What Self-Managed means in milestone one.
2. **Recommended MVP default:** The adult Care Recipient solely owns and directly controls their record, Care Recipient-specific roles, and management grants. Other people may hold non-management roles such as Family Coordinator, Care Lead, Medical Lead, or Chemo Care Lead. Those roles provide only their explicit permissions and never grant management access to the Care Recipient's private record. Shared Management and Delegated Management require explicit grants.
3. **Other reasonable options:** **Not selected:** allow a Circle Head to co-manage by default or treat Self-Managed as having no other roles at all.
4. **Main tradeoff:** This gives the Care Recipient clear control but requires them to perform management actions personally.
5. **Database or permission impact:** Care Recipient management-mode field, owner permissions, absence of active management grants, and mode-change audit event.
6. **Major rework later:** **Moderate** if management mode is stored explicitly; **major** if it is only inferred from roles.
7. **Approve recommended default:** [x]
8. **Alternative decision:** **Not selected:** Treat Self-Managed as having no other roles at all.

### 3. Shared Management Mode

1. **Decision:** What approved adults may do under Shared Management.
2. **Recommended MVP default:** The Care Recipient remains the primary manager and grants selected management permissions to one or more adults. Each person receives a separate scoped grant. Shared managers cannot transfer ownership, grant themselves new permissions, or remove the Care Recipient’s access.
3. **Other reasonable options:** Give all shared managers equal control; allow only one shared manager; or use ordinary roles instead of management grants.
4. **Main tradeoff:** Separate grants are safer and clearer but require more setup than one shared-owner switch.
5. **Database or permission impact:** Management-mode field, per-person grant records, permission scopes, grant status, Care Recipient control rules, and audit events.
6. **Major rework later:** **Yes** if Shared Management is implemented as joint ownership rather than scoped permission.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 4. Delegated Management Mode

1. **Decision:** What Delegated Management means in milestone one.
2. **Recommended MVP default:** The Care Recipient appoints one or more adult Designated Care Representatives through explicit, recorded grants. Representatives act only within granted Kinward scopes, and their actions are recorded as performed on behalf of the Care Recipient. The mode creates no legal healthcare authority and does not remove the Care Recipient’s access.
3. **Other reasonable options:** Allow one representative only; transfer full control to the representative; or infer delegation from family relationship.
4. **Main tradeoff:** Explicit grants preserve control and accountability but require more permission checks and audit detail.
5. **Database or permission impact:** Delegation record, grantor, representative, scopes, status, dates, consent record, on-behalf-of context, and audit events.
6. **Major rework later:** **Yes.** Delegation cannot safely be represented as an ordinary role or ownership transfer.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 5. Customizable Versus All-Management Delegation

1. **Decision:** Whether a representative receives selected scopes or every available management scope.
2. **Recommended MVP default:** Make selected scopes the default. Offer an explicit “All current Kinward management permissions” choice with a separate confirmation. Store that choice as the individual scopes granted at that time, not as an unlimited bypass. Future permission types are not added automatically.
3. **Other reasonable options:** Support customized scopes only; provide all-management only; or automatically include future permissions in an all-management grant.
4. **Main tradeoff:** Snapshotting scopes is more transparent and privacy-preserving but requires the Care Recipient to approve future capabilities separately.
5. **Database or permission impact:** Delegation-scope records, permission catalog, optional bundle label and version, confirmation record, and effective-permission calculation.
6. **Major rework later:** **Yes** if “all” is stored as an unchecked superuser flag.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 6. Delegation Expiration and Revocation

1. **Decision:** How delegated authority ends.
2. **Recommended MVP default:** Make expiration optional. Recommend and prefill a 90-day expiration, while allowing the Care Recipient to deliberately choose “Until revoked.” Every delegation supports active, suspended, expired, and revoked states. A delegation without an expiration generates a recurring 90-day access-review reminder. Immediate suspension or revocation removes permissions, preserves audit history, and invalidates active delegated sessions where technically possible. No family relationship, including spouse, creates an exception.
3. **Other reasonable options:** **Not selected:** require expiration, use no review reminders, or allow only Circle Heads to revoke.
4. **Main tradeoff:** Optional expiration reduces renewal burden during long care periods but requires reliable review reminders to reduce forgotten access.
5. **Database or permission impact:** Optional expiration time, next-review time, active/suspended/expired/revoked status, revocation actor and time, permission removal, session invalidation, and audit events.
6. **Major rework later:** **No** for changing the default duration; **yes** if grants have no lifecycle fields.
7. **Approve recommended default:** [x]
8. **Alternative decision:** **Not selected:** Require every delegation to expire after 90 days.

### 7. Temporary Suspension of Delegated Access

1. **Decision:** Whether access can pause without permanent revocation.
2. **Recommended MVP default:** Support active, suspended, expired, and revoked states. The Care Recipient may suspend immediately and later restore the same unexpired grant. Suspension denies access everywhere and ends active delegated sessions while preserving the grant and history.
3. **Other reasonable options:** Support only active and revoked; treat suspension as revocation; or allow support staff to restore grants.
4. **Main tradeoff:** A separate suspended state adds testing complexity but avoids forcing permanent decisions during uncertainty.
5. **Database or permission impact:** Delegation status, suspension reason and timestamps, permission middleware, session invalidation, restoration event, and audit history.
6. **Major rework later:** **Yes** if permission checks assume every non-revoked grant is active.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 8. Disputed Authority

1. **Decision:** What the prototype does when people make conflicting authority claims.
2. **Recommended MVP default:** Mark affected grants as disputed and suspended, deny the disputed access, preserve records, and block permission expansion, ownership changes, and deletion. Do not choose a person based on relationship or Kinward role. Use a documented manual review outside the prototype; Kinward does not determine legal authority.
3. **Other reasonable options:** **Not selected:** honor the newest claim or leave disputed access active during review.
4. **Main tradeoff:** Defaulting to no access protects privacy but may interrupt legitimate coordination.
5. **Database or permission impact:** Disputed status, linked grants and claims, restricted-action checks, audit events, and a non-automated review reference.
6. **Major rework later:** **Yes** if the data model lacks a safe-hold state or assumes one claim is automatically valid.
7. **Approve recommended default:** [x]
8. **Alternative decision:** **Not selected:** Let a Circle Head independently resolve disputed legal authority.

### 9. Care Recipient Record Ownership

1. **Decision:** Who controls an adult Care Recipient record.
2. **Recommended MVP default:** The adult Care Recipient is the sole information owner and is linked to their own user account. Joint ownership is excluded from the MVP. Other adults receive access only through explicit role permissions, Shared Management grants, Delegated Management grants, or separately recorded legal authority handled through the approved review process. Circle Head status, marriage, or another family relationship creates no access by itself.
3. **Other reasonable options:** **Not selected:** let a Circle Head own every Care Recipient record, allow joint ownership, or let a representative become the owner.
4. **Main tradeoff:** Sole ownership preserves privacy but requires separate management and exceptional-review workflows.
5. **Database or permission impact:** Care Recipient record, owner-user link, management mode, grants, permission checks, and lifecycle status.
6. **Major rework later:** **Yes.** Ownership and delegated access must be distinct from the first schema.
7. **Approve recommended default:** [x]
8. **Alternative decision:** **Not selected:** Allow joint ownership of an adult Care Recipient record.

### 10. One User in Multiple Circles

1. **Decision:** Whether one account may belong to more than one Family Circle.
2. **Recommended MVP default:** Allow it. Store a separate membership, role assignments, and permissions for each Circle. Require a clearly visible active-Circle context and never carry results, drafts, or permissions between Circles.
3. **Other reasonable options:** Restrict each account to one Circle; or require separate accounts for separate Circles.
4. **Main tradeoff:** Multiple Circles are more useful but require strict context isolation throughout the application.
5. **Database or permission impact:** Many-to-many user/Circle memberships, Circle-scoped roles, active-context handling, uniqueness rules, and permission queries.
6. **Major rework later:** **Yes** if the first account model assumes one Circle per user.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 11. Multiple Care Recipients in One Circle

1. **Decision:** Whether one Circle may include more than one Care Recipient.
2. **Recommended MVP default:** Allow it. Each Care Recipient has a separate record, owner, management mode, roles, grants, and permissions. A Circle member receives no Care Recipient access unless a role or grant explicitly provides it.
3. **Other reasonable options:** Limit each Circle to one Care Recipient; or automatically give Circle members the same access to every Care Recipient.
4. **Main tradeoff:** Separate records protect privacy but make context switching and permission testing more complex.
5. **Database or permission impact:** One-to-many Circle/Care Recipient relationship, Care Recipient context, scoped role assignments, grants, and deny-by-default queries.
6. **Major rework later:** **Yes** if records or roles assume one Care Recipient per Circle.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 12. Circle-Wide and Care Recipient-Specific Roles

1. **Decision:** How role scope is represented.
2. **Recommended MVP default:** Every role assignment explicitly states either `Circle-wide` or one specific `Care Recipient`. Circle-wide roles cover only approved shared administration. They never imply access to Care Recipient-specific information or management.
3. **Other reasonable options:** Make every role Circle-wide; infer scope from the role name; or duplicate each role into separate Circle and Care Recipient versions.
4. **Main tradeoff:** Explicit scope adds one choice during assignment but keeps permission behavior predictable.
5. **Database or permission impact:** Role-assignment scope type, optional Care Recipient identifier, validation rules, and all permission checks.
6. **Major rework later:** **Yes.** Scope is foundational to the role and permission model.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 13. One Person Holding Multiple Roles

1. **Decision:** Whether one member may hold several roles at once.
2. **Recommended MVP default:** Allow multiple separate role assignments. Effective permissions are the union of active grants within the same scope, while suspension, revocation, scope boundaries, and explicit restrictions always take precedence. Never combine roles across Circles or Care Recipients.
3. **Other reasonable options:** Permit only one role per scope; create combined role names; or let the most powerful role replace the others.
4. **Main tradeoff:** Separate roles are flexible and auditable but require clear permission summaries for users.
5. **Database or permission impact:** Many role assignments per membership, effective-permission calculation, conflict rules, status fields, and audit events.
6. **Major rework later:** **Yes** if the schema stores only one role on each membership.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 14. Invitation Acceptance and Expiration

1. **Decision:** How an adult joins a Circle and receives initial roles.
2. **Recommended MVP default:** Use a single-use, revocable invitation tied to one Circle, the invited adult's verified email address, and proposed role scopes. Require the invited adult to sign in with and verify the matching email identity before acceptance. Expire invitations after seven days. Grant no access before acceptance. Managed minors do not receive invitations. Phone authentication and phone invitation binding are deferred under D-8; phone numbers may later be stored separately as contact information.
3. **Other reasonable options:** Invitations never expire; any signed-in user with the link may accept; or a Circle Head adds members without acceptance.
4. **Main tradeoff:** Contact matching and expiration reduce misuse but create more failed or repeated invitations.
5. **Database or permission impact:** Invitation record, contact hash or normalized contact, token, Circle, proposed roles, expiration, revocation, acceptance event, and resulting membership.
6. **Major rework later:** **No** for changing the duration; **yes** if invitations are not bound to identity, Circle, and scope.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 15. Audit-History Requirements

1. **Decision:** What changes milestone one must record.
2. **Recommended MVP default:** Create append-only audit events for invitations, membership changes, role assignments, permission changes, management-mode changes, delegation creation or status changes, and managed-minor control changes. Record actor, action, target, Circle, Care Recipient when relevant, time, result, and before/after identifiers without copying sensitive content. Care Recipients may view events affecting their record; Circle Heads may view Circle-administration events only.
3. **Other reasonable options:** Log every application action; retain only the latest state; or let Circle Heads edit audit entries.
4. **Main tradeoff:** Minimal append-only events support accountability without creating a duplicate store of sensitive information.
5. **Database or permission impact:** Audit-event table, immutable write path, event types, scoped viewing permissions, actor and on-behalf-of identifiers, and retention-ready timestamps.
6. **Major rework later:** **Yes** if history is reconstructed from current records instead of recorded when changes happen.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 16. Backup Circle Administrator Authority

1. **Decision:** What a Backup Circle Administrator may do.
2. **Recommended MVP default:** Designate one named adult as a dormant Backup Circle Administrator. Dormant status grants no usable backup permissions. After approved activation, the backup may manage invitations, membership, and approved Circle-wide non-sensitive roles and settings. The backup cannot access Care Recipient-specific information, change management modes or delegation, assign themselves more access, remove the Circle Head, transfer control, or delete the Circle. The role is separate from Circle Head and Family Coordinator and creates no automatic succession or legal authority.
3. **Other reasonable options:** Keep limited backup permissions continuously active; give the backup all Circle Head powers; or omit the backup role.
4. **Main tradeoff:** Dormant authority reduces standing access risk but requires an approved activation workflow during a Circle Head absence.
5. **Database or permission impact:** Circle-wide backup designation, dormant and active status, designation verification, activation approval and reason, fixed permission set, one-per-Circle constraint, prohibited-action checks, and audit events for activation, actions, suspension, and deactivation.
6. **Major rework later:** **Moderate** if permissions are data-driven; **major** if Backup Circle Administrator is treated as an unrestricted owner.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 17. Managed Minor Profile Ownership

1. **Decision:** Who controls a managed minor profile.
2. **Recommended MVP default:** A managed minor profile has no independent user account or legal ownership claim in Kinward. One adult Circle member is recorded as the managing adult and controls visibility and basic profile changes. Allow suspension or archive, but require a documented manual review for transfer or permanent deletion. This is a product permission rule, not a legal determination of guardianship.
3. **Other reasonable options:** Allow two equal managing adults; let any Circle Head manage it; or exclude minor profiles from milestone one.
4. **Main tradeoff:** One managing adult is simple and private but creates a continuity problem if that adult becomes unavailable.
5. **Database or permission impact:** Managed-profile record, managing-adult membership link, status, Circle link, control-change audit event, and prohibition on independent authentication.
6. **Major rework later:** **Yes** if minors are implemented as ordinary adult accounts or ordinary Care Recipient owners.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 18. Minor Visibility and Restrictions

1. **Decision:** What others may see and what a managed minor may do.
2. **Recommended MVP default:** Keep a new minor profile visible only to the managing adult until that adult explicitly shares its basic profile with the Circle. Shared fields are limited to preferred display name, relationship, and age band. Do not store an exact birth date unless later required. A managed minor cannot sign in, accept invitations, hold adult roles, administer a Circle, receive delegation, or access Care Recipient-specific information.
3. **Other reasonable options:** Show every minor to all members automatically; allow independent teen accounts; or hide minor profiles from everyone except the managing adult.
4. **Main tradeoff:** Explicit sharing protects the child but requires an extra setup step and limits participation in the prototype.
5. **Database or permission impact:** Minor-profile visibility flag, approved basic fields, restricted role types, no identity credentials, and permission checks.
6. **Major rework later:** **Yes** if minor profiles share the adult account and role model without restrictions.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 19. Support-Team Access Default

1. **Decision:** Whether First & 8th support staff can access prototype family information.
2. **Recommended MVP default:** Build no support-team family-content access and no impersonation capability in milestone one. No Circle role—including Circle Head or dormant Backup Circle Administrator—support function, or internal Kinward account receives undocumented or automatic access to Circle or Care Recipient information. Authorization tests must deny access unless a documented, active permission explicitly allows the requested action and scope. If troubleshooting metadata is later needed, design a separate least-privileged, audited support permission rather than reusing a Circle or Care Recipient role.
3. **Other reasonable options:** Give support read-only access; allow time-limited family-approved access; or provide unrestricted internal access.
4. **Main tradeoff:** No access best protects privacy but makes account and permission problems harder to investigate.
5. **Database or permission impact:** No support membership or content permission in the milestone schema; reserve system-staff identities from family roles; keep future support access separable and auditable.
6. **Major rework later:** **No** if system-staff identity remains separate; **yes** if any support function or internal Kinward account bypasses documented Circle and Care Recipient permission checks.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 20. Prototype Deletion Behavior

1. **Decision:** What “delete” does during milestone one.
2. **Recommended MVP default:** Provide no permanent self-service deletion. Use disable, revoke, remove, or archive states for accounts, memberships, Circles, Care Recipient records, managed minor profiles, roles, and delegations. End access immediately where appropriate and preserve minimum audit history. Label this as a temporary prototype rule, not the final legal deletion policy.
3. **Other reasonable options:** Hard-delete every related record; support complete production-grade deletion now; or omit every removal control.
4. **Main tradeoff:** Archive-first behavior prevents irreversible mistakes but does not satisfy a final production deletion policy.
5. **Database or permission impact:** Lifecycle status and timestamps on core records, access-denial rules, removal versus deletion distinction, immutable audit events, and no cascading hard-delete UI.
6. **Major rework later:** **No to moderate** if lifecycle states and ownership are modeled now; **major** if records are permanently deleted without dependency rules.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

### 21. Accessibility and Supported-Device Baseline

1. **Decision:** What the application shell must support and pass.
2. **Recommended MVP default:** Target WCAG 2.2 Level AA. Test current supported iPhone Safari and Android Chrome configurations plus keyboard use in a desktop browser. Require 200% text resizing, VoiceOver and TalkBack smoke tests, visible focus, logical headings and labels, high contrast, reduced motion, no color-only meaning, plain language, and primary touch targets at least 48 by 48 CSS pixels. Name the exact test devices and versions in the first-family testing plan before testing begins.
3. **Other reasonable options:** Test one phone only; postpone assistive-technology testing; or support a broad legacy-device matrix immediately.
4. **Main tradeoff:** A defined baseline adds design and test work now but avoids expensive accessibility retrofits.
5. **Database or permission impact:** Little direct database impact; substantial application-shell, component, navigation, authentication, validation, content, and acceptance-test impact.
6. **Major rework later:** **Potentially yes.** Accessibility and responsive behavior are costly to add after components are established.
7. **Approve recommended default:** [x]
8. **Alternative decision:** ______________________________________________

## Decisions That Absolutely Must Be Approved Before Coding

D-8 through D-17 resolve the milestone-one operational questions. Their approved defaults are:

- Verified-email-only identity for Milestone One.
- Dedicated adult Care Recipient ownership invitation, inactive record, and separate consent history.
- Routine persistent sign-in, a 15-minute recent-authentication window for consequential actions, and a fresh provider challenge for backup activation and other strong actions.
- No alternate backup recovery branch in Milestone One.
- Full synthetic-environment audit retention with configurable classification.
- D-13's actual-device and accessibility matrix.
- Last-active-Circle-Head continuity invariant.
- Family audit for consequential denied writes and separate privacy-safe logging for routine denied reads.
- In-app recurring 90-day “Access review due” state for “Until revoked.”
- Three isolated environment types, with Gate C before real information and secure documents outside Milestone One.

These additions were closed and verified by the 2026-07-16 targeted systems audit and do not alter decisions 1 through 21 or authorize implementation. “Closed” records planning verification only; it does not mean implementation is complete or authorized.

The following concepts affect the first schema, permission engine, or application shell and need approval before coding:

1. Circle and Care Recipient control boundaries (`1`, `9`).
2. Multiple-Circle and multiple-Care Recipient isolation (`10`, `11`).
3. Role scope, multiple-role behavior, and invitation identity binding (`12`–`14`).
4. The meaning of all three management modes (`2`–`4`).
5. Delegation scope representation, lifecycle states, suspension, and disputed-access behavior (`5`–`8`).
6. Audit event structure and viewing boundaries (`15`).
7. Backup Circle Administrator limits (`16`).
8. Managed-minor control, visibility, and restrictions (`17`, `18`).
9. Separation of support identities from family permissions (`19`).
10. Archive-first record lifecycle structure (`20`).
11. Accessibility acceptance criteria for the shell (`21`).

## Decisions That May Use a Temporary Prototype Default

These details may use the stated temporary default without becoming the final beta or launch policy:

1. The seven-day invitation expiration period (`14`).
2. The 90-day recommended prefill and recurring access-review reminder (`6`), with optional expiration and a deliberate “Until revoked” choice.
3. The exact audit-history retention period; the event structure still blocks coding (`15`).
4. No support console or family-content access (`19`).
5. Archive or disable instead of permanent deletion (`20`).
6. The exact phone models and operating-system versions, provided the accessibility baseline remains approved (`21`).

## PRE_BUILD_DECISIONS Items Not Blocking This Milestone

The earlier workbook treated several choices as blockers before this milestone was narrowed. They are not blockers for the stated milestone-one scope:

1. Exact Patient Check-In questions (`A1`).
2. Exact Caregiver Check-In questions (`A8`).
3. Measurements and units (`A9`).
4. Completing check-ins on another person’s behalf (`A10`).
5. Shared Household task implementation (`A11`) is outside milestone one; approved D-3 and D-7 still govern its non-sensitive context and route unassigned, declined, or overdue tasks to the Family Coordinator queue or “No routing lead assigned.”
6. Task-title and description implementation (`A12`) is outside milestone one; Shared Household content must remain non-sensitive under D-3 and D-7.
7. Recording legal-document information (`A15`).

The following earlier blockers were broader than milestone one requires:

1. Full Designated Care Representative account-recovery procedures (`A2`) may wait; identity and delegated authority must simply remain separate in the schema.
2. Final account and Care Recipient deletion policy (`A6`, `A13`) may wait; milestone one needs only lifecycle states and archive-first behavior.
3. Exact audit retention (`A14`) may wait; milestone one needs the audit event structure.
4. Full incapacity, separation, death, and succession workflows (`A16`) may wait; milestone one needs no automatic transfer and a disputed-access safe hold.
5. Final managed-minor ownership transfer and permanent deletion procedures (`A17`) may wait; milestone one needs one managing adult, strict restrictions, and archive/suspension states.

No medical, notification, document, offline, analytics, integration, or care-coordination feature should be implemented in this milestone.
