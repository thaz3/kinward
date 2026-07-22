# Kinward Milestone One Data Model

> **Status:** Updated conceptual model reflecting D-8 through D-17; closed and verified by targeted systems audit; no database authorized
> **Version:** 0.2
> **Last updated:** 2026-07-22
> **Governing decisions:** D-1 through D-17; `MILESTONE_ONE_DECISIONS.md`; `PERMISSIONS.md`

## Scope

This model covers only accounts, Circles, Care Recipients, membership, invitations, roles, management modes, grants, managed minors, backup contingency authority, permissions, consent, and audit history. It contains no medical, symptom, treatment, medication, diet, movement, alert, legal-document, or real-family-data entities.

## Common Conventions

- Use UUID primary keys and database-generated UTC timestamps.
- Every mutable security record has `status`, `version`, `created_at`, `updated_at`, and actor identifiers where appropriate.
- Every Circle-scoped row carries `circle_id`; every Care Recipient-scoped row carries both `circle_id` and `care_recipient_id`, with a composite consistency constraint.
- Archive and revoke rather than hard-delete in Milestone One.
- Use check constraints or database enums for approved lifecycle values.
- Use partial unique indexes for active designations and assignments.
- Store normalized contacts separately from display labels; never use family relationship as an authorization key.
- Audit events contain identifiers and state references, not copied protected content.

## Relationship Summary

```text
auth.users -> user_profiles
auth.users <-> family_circles through circle_memberships
family_circles -> circle_invitations
family_circles -> care_recipients -> care_management_modes
circle_memberships -> circle_role_assignments
circle_memberships + care_recipients -> care_recipient_role_assignments
care_recipients -> shared_management_grants -> grant_scopes
care_recipients -> delegated_management_grants -> grant_scopes
family_circles -> managed_minor_profiles -> managing_adult_relationships
family_circles -> backup_admin_designations -> backup_activation_records
all security changes -> consent_records + audit_events
```

## Entity Specifications

### 1. Authentication Users (`auth.users`)

- **Purpose:** Supabase-managed adult authentication identity.
- **Key fields:** Supabase user ID, verified-email state, created and last-authentication timestamps; optional contact methods remain separate application records.
- **Identifiers:** Supabase UUID primary key.
- **Foreign keys:** Referenced by `user_profiles`, memberships, actor fields, ownership, and consent.
- **Ownership:** The authenticated adult controls their account identity; it does not own Circle or another adult’s record automatically.
- **Circle context:** None directly.
- **Care Recipient context:** None directly.
- **Lifecycle state:** Supabase authentication lifecycle plus application `account_status` in the profile.
- **Constraints:** Adult accounts only; no managed minor profile may reference or create an Auth user.
- **Indexing:** Provider-managed identity indexes; application joins by UUID.
- **Audit requirements:** Authentication security events remain separate from family audit content.
- **Deletion/deactivation:** Disable sign-in and preserve required references; final deletion policy is deferred.
- **Never combine:** Authentication identity with role, spouse status, Circle ownership, or legal authority.

### 2. User Profiles (`user_profiles`)

- **Purpose:** Minimal application profile for an authenticated adult.
- **Key fields:** `user_id`, preferred display name, locale, time zone, accessibility preferences, `account_status`, version.
- **Identifiers:** `user_id` primary and foreign key to `auth.users`.
- **Foreign keys:** Optional actor references only through `user_id`.
- **Ownership:** The adult user.
- **Circle context:** None; Circle-specific display choices belong to membership.
- **Care Recipient context:** None.
- **Lifecycle state:** Active, disabled, archived.
- **Constraints:** No medical, relationship-authority, or minor credential fields.
- **Indexing:** Status and normalized display search only where privacy-safe.
- **Audit requirements:** Profile status changes and consequential identity changes.
- **Deletion/deactivation:** Archive or disable; prevent new access while preserving audit references.
- **Never combine:** Profile data across users or with managed minor profiles.

### 3. Family Circles (`family_circles`)

- **Purpose:** Top-level privacy and membership boundary.
- **Key fields:** `id`, display name, creator user ID, status, version, timestamps.
- **Identifiers:** Circle UUID.
- **Foreign keys:** Creator references `auth.users`; memberships and all Circle records reference Circle.
- **Ownership:** No personal owner field drives authority; active Circle Head assignments govern administration.
- **Circle context:** Self.
- **Care Recipient context:** None.
- **Lifecycle state:** Active, suspended, archived.
- **Constraints:** Creator metadata cannot be used as permanent authorization.
- **Indexing:** Creator for history, active status, and membership joins.
- **Audit requirements:** Create, rename, suspend, archive, and restore if later approved.
- **Deletion/deactivation:** Archive; deny active operations while retaining history.
- **Never combine:** Rows, counts, search results, or audit events across Circles.

### 4. Circle Memberships (`circle_memberships`)

- **Purpose:** Bind one adult account to one Circle independently of roles.
- **Key fields:** `id`, `circle_id`, `user_id`, Circle display name override if allowed, status, joined/removed timestamps, version.
- **Identifiers:** Membership UUID; unique active pair of Circle and user.
- **Foreign keys:** Circle and Auth user.
- **Ownership:** Circle administration controls membership lifecycle within assigned authority; the adult controls acceptance.
- **Circle context:** Required.
- **Care Recipient context:** None.
- **Lifecycle state:** Invited is kept on invitation; membership is active, suspended, removed, or archived.
- **Constraints:** Membership alone grants only basic Circle entry, never Care Recipient access.
- **Indexing:** Unique `(circle_id, user_id)` for active membership; user/status for My Kinward.
- **Audit requirements:** Create, suspend, remove, leave, and reactivate if approved.
- **Deletion/deactivation:** Remove or archive; cascade no protected records.
- **Never combine:** Roles or grants from another Circle.

### 5. Circle Invitations (`circle_invitations`)

- **Purpose:** Single-use identity-bound path to adult membership and proposed roles.
- **Key fields:** `id`, `circle_id`, normalized verified-email hash/reference, token hash, inviter user ID, status, `expires_at`, accepted/declined/cancelled timestamps, version.
- **Identifiers:** Invitation UUID plus unique token hash.
- **Foreign keys:** Circle, inviter, optional accepted user; proposed assignments use child records.
- **Ownership:** Circle administration record, not the invitee’s authority.
- **Circle context:** Required.
- **Care Recipient context:** Only in separate proposed role records; never as broad invitation access.
- **Lifecycle state:** Pending, accepted, declined, expired, cancelled.
- **Constraints:** Seven-day default, one use, matching verified-email identity, no managed-minor invitations, no access before acceptance.
- **Indexing:** Token hash, normalized contact lookup, pending expiration, Circle/status.
- **Audit requirements:** Create, delivery result, accept, decline, expire, cancel, and mismatch denial.
- **Deletion/deactivation:** Retain minimal history; invalidate token immediately.
- **Never combine:** Token and readable contact in logs; invitation with automatic protected access.

### 5A. Adult Ownership Invitations and Acceptances (`care_recipient_ownership_invitations`, `ownership_acceptance_records`)

- **Purpose:** Bind a proposed adult Care Recipient to verified-email ownership consent without exposing a private record first.
- **Key fields:** invitation ID, Circle ID, pending Care Recipient ID, proposer, normalized verified-email reference and token hash, status, expiration, proposed owner user ID after verification; acceptance ID, accepted terms/version, decision, consent timestamp, actor, and audit event.
- **Lifecycle state:** Invitation pending, accepted, declined, expired, or cancelled; acceptance is immutable consent history.
- **Constraints:** Pending Care Recipient is inactive; no private fields may be entered before acceptance; acceptance establishes sole ownership and Circle membership atomically; no second ordinary invitation is required.
- **Audit requirements:** Proposal, delivery, verification mismatch, accept, decline, expire, cancel, ownership activation, and membership creation.
- **Never combine:** Ownership acceptance with joint ownership, relationship-based authority, or ordinary invitation acceptance inferred as ownership consent.

### 6. Care Recipients (`care_recipients`)

- **Purpose:** Adult-owned privacy context inside one Circle.
- **Key fields:** `id`, `circle_id`, nullable `owner_user_id` while proposed, safe display label, activation status, owner-accepted timestamp, ownership-acceptance ID, version.
- **Identifiers:** Care Recipient UUID.
- **Foreign keys:** Circle and sole owner Auth user.
- **Ownership:** Exactly one adult owner; no co-owner relationship.
- **Circle context:** Required and immutable without a future approved migration process.
- **Care Recipient context:** Self.
- **Lifecycle state:** Proposed, active, suspended, archived, disputed-hold.
- **Constraints:** Unique active owner/Circle record as product requires; `owner_user_id` and accepted ownership record are non-null only when active; owner must become an active member in the acceptance transaction; pending records allow no private data; joint ownership is impossible by schema.
- **Indexing:** Circle/status, owner/status, and composite `(circle_id, id)` for context integrity.
- **Audit requirements:** Proposal, owner acceptance, activation, status changes, and archive.
- **Deletion/deactivation:** Archive or restrict; permanent deletion deferred.
- **Never combine:** Dad and Mom ownership, roles, grants, audit visibility, or permission context.

### 7. Circle-Wide Role Assignments (`circle_role_assignments`)

- **Purpose:** Assign canonical non-medical Circle-wide roles.
- **Key fields:** `id`, `circle_id`, `membership_id`, `role_code`, status, starts/ends, assigned-by user ID, version.
- **Identifiers:** Assignment UUID.
- **Foreign keys:** Circle, membership, role catalog, actor.
- **Ownership:** Governed by authorized Circle administration.
- **Circle context:** Required.
- **Care Recipient context:** Prohibited; no recipient column or scope inference.
- **Lifecycle state:** Active, suspended, expired, removed.
- **Constraints:** Canonical roles only; Circle Head and Family Coordinator remain distinct; no generic administrator or Circle Coordinator. The final active Circle Head assignment cannot end until another verified adult has accepted an active Circle Head assignment.
- **Indexing:** Membership/status, Circle/role/status, active uniqueness where appropriate.
- **Audit requirements:** Assign, suspend, expire, remove, and restore if allowed.
- **Deletion/deactivation:** Mark inactive and preserve history.
- **Never combine:** Circle-wide role with Care Recipient-specific permissions.

### 8. Care Recipient-Specific Role Assignments (`care_recipient_role_assignments`)

- **Purpose:** Assign a canonical coordination role for exactly one Care Recipient.
- **Key fields:** `id`, `circle_id`, `care_recipient_id`, `membership_id`, `role_code`, explicit permission bundle version, status, starts/ends, assigned-by, version.
- **Identifiers:** Assignment UUID.
- **Foreign keys:** Circle, Care Recipient, membership, role catalog, actor.
- **Ownership:** Care Recipient or active explicit management authority for role management.
- **Circle context:** Required and must match membership and Care Recipient.
- **Care Recipient context:** Exactly one required.
- **Lifecycle state:** Active, suspended, expired, removed.
- **Constraints:** No assignment can target every Care Recipient implicitly; recipient and membership must share Circle.
- **Indexing:** Recipient/membership/status, role/status, end time.
- **Audit requirements:** All lifecycle and scope changes.
- **Deletion/deactivation:** Inactivate; historical records remain.
- **Never combine:** A Dad assignment with Mom or another Circle.

### 9. Care Management Modes (`care_management_modes`)

- **Purpose:** Store current and historical management-mode selection per Care Recipient.
- **Key fields:** `id`, `circle_id`, `care_recipient_id`, mode code, effective start/end, selected-by owner, status, version.
- **Identifiers:** Mode-history UUID; one active row per Care Recipient.
- **Foreign keys:** Care Recipient, Circle, owner actor.
- **Ownership:** Adult Care Recipient.
- **Circle context:** Required.
- **Care Recipient context:** Required.
- **Lifecycle state:** Active or superseded; Care Recipient hold may block changes.
- **Constraints:** Values only self-managed, shared-management, delegated-management; mode does not itself grant another user access.
- **Indexing:** Unique active Care Recipient mode; mode/status for testing.
- **Audit requirements:** Every transition with prior and next identifiers.
- **Deletion/deactivation:** Supersede, never rewrite history.
- **Never combine:** Management mode with legal capacity, ownership transfer, or spouse authority.

### 10. Shared Management Grants (`shared_management_grants`)

- **Purpose:** Give selected management scopes to an approved adult while the Care Recipient remains primary manager.
- **Key fields:** `id`, `circle_id`, `care_recipient_id`, grantor owner ID, grantee membership ID, status, starts, optional expiration, suspended/revoked timestamps, version.
- **Identifiers:** Grant UUID.
- **Foreign keys:** Circle, Care Recipient, owner, grantee membership.
- **Ownership:** Care Recipient grantor.
- **Circle context:** Must match recipient and grantee membership.
- **Care Recipient context:** Exactly one.
- **Lifecycle state:** Pending, active, suspended, expired, revoked, disputed.
- **Constraints:** Grantee cannot transfer ownership, self-expand, or remove owner access; explicit scope rows required.
- **Indexing:** Recipient/grantee/status, expiration, and active-grant queries.
- **Audit requirements:** Create, scope, consent, activate, suspend, restore, expire, revoke, and dispute.
- **Deletion/deactivation:** Revoke or expire; preserve scopes and events.
- **Never combine:** Shared grant with joint ownership or another Care Recipient.
- **Slice boundary:** Slice 9 owns schema and completed Shared Management grants for Screen 18. Only `Manage roles` and `Review permissions` may be snapshotted. Change ownership is never grantable. Slice 10 delegated-lifecycle work does not broaden Shared Management scope.

### 11. Delegated Management Grants (`delegated_management_grants`)

- **Purpose:** Record explicit on-behalf-of management authority for a Designated Care Representative.
- **Key fields:** `id`, `circle_id`, `care_recipient_id`, grantor owner ID, representative membership ID, status, starts, optional `expires_at`, `next_review_at`, `last_reviewed_at`, `last_reviewed_by`, `last_review_decision`, consent ID, suspended/revoked data, version.
- **Identifiers:** Delegation UUID.
- **Foreign keys:** Circle, Care Recipient, owner, representative membership, consent.
- **Ownership:** Care Recipient grantor; representative never owns the record.
- **Circle context:** Must match all related records.
- **Care Recipient context:** Exactly one.
- **Lifecycle state:** Pending, active, suspended, expired, revoked, disputed.
- **Constraints:** Active requires accepted consent and scopes; no-expiration requires `next_review_at`; family relationship has no effect.
- **Indexing:** Representative/status, recipient/status, expiration, next review, disputed holds.
- **Audit requirements:** Every lifecycle, review, consent, and scope event plus on-behalf-of actions.
- **Deletion/deactivation:** Revoke; never hard-delete active or historical delegation.
- **Never combine:** Delegation with legal authority, spouse status, Circle Head status, or future automatic scopes.
- **Slice boundary:** Slice 9 may persist only a `Pending` exact-recipient delegation after Screen 20 scope review. `Pending` is the approved pre-activation state and contributes zero effective permission. Slice 9 does not persist expiration choice, no-expiration choice, representative acceptance, activation, suspension, restoration, or revocation behavior. Slice 10 owns those fields and transitions and must reject activation until expiration/no-expiration, required consent, representative acceptance, and exact scopes are complete.

### 12. Grant Scopes (`management_grant_scopes`)

- **Purpose:** Store the exact permission snapshot for Shared and Delegated grants.
- **Key fields:** `id`, grant type, grant ID, permission code, effect, catalog version, created/removed timestamps.
- **Identifiers:** Scope UUID; unique active permission per grant.
- **Foreign keys:** One valid Shared or Delegated grant and permission catalog.
- **Ownership:** Inherits Care Recipient grant ownership.
- **Circle context:** Derived and validated from grant.
- **Care Recipient context:** Derived and validated from grant.
- **Lifecycle state:** Active or removed; grant lifecycle still controls effectiveness.
- **Constraints:** No wildcard or superuser scope; “all current permissions” expands into rows at confirmation time.
- **Indexing:** Grant/active, permission/grant type.
- **Audit requirements:** Add and remove scope with before/after snapshot identifiers.
- **Deletion/deactivation:** Mark removed; preserve consented snapshot.
- **Never combine:** Scopes from separate grants, Circles, Care Recipients, or future catalog versions automatically.
- **Milestone One catalog:** Exactly `Manage roles` and `Review permissions`. `Change ownership` is invariantly excluded. Selected scopes persist the selected rows. “All current Kinward management permissions” persists both current rows and their catalog version; it is never stored as `*`, a superuser flag, or an instruction to include future permissions.
- **Slice boundary:** Slice 9 owns explicit scope snapshots for completed Shared grants and `Pending` Delegated grants. Slice 10 consumes but does not silently expand the snapshot during consent, acceptance, or activation.

### 13. Managed Minor Profiles (`managed_minor_profiles`)

- **Purpose:** Store limited, adult-managed basic profile information without login.
- **Key fields:** `id`, `circle_id`, preferred display name, relationship label, age band, visibility state, status, version.
- **Identifiers:** Minor profile UUID, never an Auth user ID.
- **Foreign keys:** Circle; managing relationship stored separately.
- **Ownership:** Product control belongs to one managing adult; this is not a legal guardianship finding.
- **Circle context:** Required.
- **Care Recipient context:** Prohibited in Milestone One.
- **Lifecycle state:** Active, suspended, archived, transfer-review.
- **Constraints:** No exact birth date by default, credentials, adult roles, delegation, invitations, or protected recipient access. Age band is display and age-appropriate-experience information only; changing or crossing it triggers no account, invitation, ownership, role, or permission transition.
- **Indexing:** Circle/status and managing relationship joins.
- **Audit requirements:** Create, visibility, update, suspend, archive, and transfer-review request.
- **Deletion/deactivation:** Archive; permanent deletion deferred to review.
- **Never combine:** Managed minor profile with `auth.users`, adult membership, Care Recipient, or adult role tables.

### 14. Managing-Adult Relationships (`managing_adult_relationships`)

- **Purpose:** Identify the one adult controlling a managed minor profile.
- **Key fields:** `id`, `circle_id`, minor profile ID, managing membership ID, status, starts/ends, assignment actor, version.
- **Identifiers:** Relationship UUID.
- **Foreign keys:** Circle, minor profile, active adult membership.
- **Ownership:** The relationship controls product actions only and does not assert legal custody.
- **Circle context:** Required and consistent across minor and membership.
- **Care Recipient context:** None.
- **Lifecycle state:** Active, suspended, ended, transfer-review.
- **Constraints:** One active managing adult per profile; minor cannot manage self.
- **Indexing:** Unique active minor relationship; membership/status.
- **Audit requirements:** Assignment, suspension, transfer request, and end.
- **Deletion/deactivation:** End or suspend; preserve history.
- **Never combine:** Product managing status with legal guardian validation.

### 15. Backup Administrator Designations (`backup_admin_designations`)

- **Purpose:** Store one verified dormant Backup Circle Administrator designation per Circle.
- **Key fields:** `id`, `circle_id`, designated membership ID, designated-by user ID, verification state/time, status, accepted time, version.
- **Identifiers:** Designation UUID.
- **Foreign keys:** Circle, adult membership, designator actor.
- **Ownership:** Circle contingency record governed by authorized Circle Head action.
- **Circle context:** Required.
- **Care Recipient context:** Prohibited.
- **Lifecycle state:** Pending-verification, dormant, active-through-activation record, suspended, ended.
- **Constraints:** One current designation per Circle; dormant state yields zero usable permissions; self-activation prohibited.
- **Indexing:** Unique active/dormant Circle designation, membership/status.
- **Audit requirements:** Designate, verify, accept, replace, suspend, and end.
- **Deletion/deactivation:** End designation; do not erase activation history.
- **Never combine:** Backup designation with Circle Head, Care Recipient access, succession, or legal authority.

### 16. Backup Activation Records (`backup_activation_records`)

- **Purpose:** Record each controlled request and period of fixed backup authority.
- **Key fields:** `id`, designation ID, Circle ID, requestor, approver, reason, reauthentication result reference, status, requested/approved/activated/deactivated timestamps, version.
- **Identifiers:** Activation UUID.
- **Foreign keys:** Designation, Circle, requestor and approver users.
- **Ownership:** Circle administration history.
- **Circle context:** Required.
- **Care Recipient context:** Prohibited.
- **Lifecycle state:** Requested, denied, approved-pending-reauth, active, suspended, deactivated, expired-request.
- **Constraints:** Milestone One active state requires authorized Circle Head approval, a fresh provider-supported challenge, reason, and audit event; fixed permissions only. No alternate recovery path or self-activation exists in Milestone One; approval source remains recorded for future design.
- **Indexing:** Designation/status, Circle/status, requested time.
- **Audit requirements:** Every transition and every action performed under active backup authority.
- **Deletion/deactivation:** Deactivate or suspend; preserve immutable record.
- **Never combine:** Activation with Care Recipient roles, grant scopes, ownership transfer, or self-asserted unavailability.

### 17. Permission Catalog and Role Mapping (`permission_definitions`, `role_permissions`)

- **Purpose:** Define stable action codes and approved default mappings without a wildcard administrator permission.
- **Key fields:** Permission code, resource type, action, scope type, catalog version, active status; role code and permission code mapping.
- **Identifiers:** Stable string codes plus versioned IDs.
- **Foreign keys:** Role and grant-scope records reference catalog entries.
- **Ownership:** Product configuration governed by approved documents, not family users.
- **Circle context:** None in catalog; evaluated records supply context.
- **Care Recipient context:** Scope type declares whether a recipient is required or forbidden.
- **Lifecycle state:** Draft, active, retired; future scopes are not added to old grants automatically.
- **Constraints:** Canonical roles only; no generic admin, Circle Coordinator, Primary Circle Administrator, support bypass, or `*` permission.
- **Indexing:** Unique code/version and active code.
- **Audit requirements:** Catalog changes require controlled migration and approval trace.
- **Deletion/deactivation:** Retire; never reinterpret historical grants silently.
- **Never combine:** Circle and Care Recipient scope types or future permissions with prior “all” snapshots.

### 18. Explicit Permission Restrictions (`permission_restrictions`)

- **Purpose:** Record a deny that overrides role and grant unions for a defined context.
- **Key fields:** `id`, subject membership/user, circle ID, optional Care Recipient ID, permission code, reason code, status, starts/ends, actor, version.
- **Identifiers:** Restriction UUID.
- **Foreign keys:** Subject, Circle, optional Care Recipient, permission catalog, actor.
- **Ownership:** Authorized owner or governance process for the affected scope.
- **Circle context:** Required.
- **Care Recipient context:** Required when the permission is recipient-scoped.
- **Lifecycle state:** Active, expired, removed.
- **Constraints:** Deny only; cannot be used to grant access; safe reason codes avoid sensitive content.
- **Indexing:** Subject/context/status and expiration.
- **Audit requirements:** Create, expire, and remove.
- **Deletion/deactivation:** Expire or remove while preserving history.
- **Never combine:** Restrictions across Circles or recipients; never treat absence of restriction as a grant.

### 19. Consent Records (`consent_records`)

- **Purpose:** Preserve explicit consent for ownership acceptance, management grants, delegation, and sensitive authority changes.
- **Key fields:** `id`, consent type, actor user ID, Circle ID, optional Care Recipient ID, target record type/ID, presented-text version, decision, decided time, authentication strength reference.
- **Identifiers:** Consent UUID.
- **Foreign keys:** Actor, Circle, optional Care Recipient, target record.
- **Ownership:** Adult who gave the consent; record is immutable evidence.
- **Circle context:** Required for family actions.
- **Care Recipient context:** Required for management and delegation consent.
- **Lifecycle state:** Accepted, declined, withdrawn-reference; original decision remains immutable.
- **Constraints:** One decision event per presentation; no inferred consent from relationship or role.
- **Indexing:** Target, actor, context, decided time.
- **Audit requirements:** Consent event links to the corresponding audit event.
- **Deletion/deactivation:** Preserve minimum history; final retention policy deferred.
- **Never combine:** Consent across Care Recipients, grants, or future permission versions.
- **Slice boundary:** Slice 9 may introduce this schema foundation and may record the owner confirmation required for completed Screen 18 Shared Management setup. Delegated consent and representative acceptance are Slice 10 behavior and are not fabricated when Slice 9 creates a `Pending` delegation through Screen 20.

### 20. Audit Events (`audit_events`)

- **Purpose:** Append-only accountability for authority, permission, membership, lifecycle, and security changes.
- **Key fields:** `id`, event class/type, actor user ID, actor-display policy or maskable reference, optional approver user ID and display policy, on-behalf-of Care Recipient ID when applicable, Circle ID, optional affected Care Recipient ID, target type/ID, reason classification, attempted or blocked value reference, result/resulting state, safe-display classification, prior/next state identifiers, occurred time, correlation ID, retention classification.
- **Identifiers:** Audit UUID.
- **Foreign keys:** Prefer durable identifiers; avoid cascading deletion that erases events.
- **Ownership:** No family member owns or edits an event; visibility is scoped by governing permissions.
- **Circle context:** Required for Circle events.
- **Care Recipient context:** Required only when event affects that recipient.
- **Lifecycle state:** Immutable; optional retention class without chosen final duration.
- **Constraints:** Insert through constrained paths only; no update/delete for application roles; no copied sensitive content. Viewer queries authorize every row and display field independently by event class, Circle, affected Care Recipient, actor and approver display policy, reason, attempted/blocked value, resulting state, and safe text projection.
- **Indexing:** Circle/time, Care Recipient/time, actor/time, target, event type, correlation ID.
- **Audit requirements:** This is the audit record; monitor failed append attempts separately.
- **Deletion/deactivation:** Retain for the life of an active synthetic test environment. Delete only as part of a documented complete synthetic-environment reset or retirement. Production and real-family retention remain Gate C decisions.
- **Never combine:** Events from unauthorized Circles or Care Recipients in one viewer query; screen-level access with row-level visibility; full actor identity with a viewer allowed only a masked identity.

## Leakage-Prevention Design

### Cross-Circle Leakage

- Every scoped table includes `circle_id`.
- Membership and all target records must share Circle through foreign-key or trigger-backed constraints.
- RLS requires active destination membership before resource-specific permission evaluation.
- Client caches are keyed by Circle and cleared on context change.

### Cross-Care-Recipient Leakage

- Every recipient-specific assignment and grant includes both Circle and Care Recipient.
- No “all Care Recipients” role assignment exists.
- Effective permissions require exact recipient equality.
- Audit queries enforce the same recipient scope.

### Automatic Spouse Access

- No spouse or relationship field participates in authorization.
- Roles and grants require explicit records.
- Owner and grantor identifiers are independent of relationship labels.

### Joint Adult Ownership

- `care_recipients.owner_user_id` is a single required field for active records.
- No co-owner table exists.
- Shared and Delegated grants are separate and cannot mutate owner identity.

### Dormant Backup Access

- Designation and activation are separate tables.
- Dormant designation has no role or permission rows.
- Authorization requires an active activation record and fixed backup action code.

### Independent Minor Login

- Managed minor IDs never reference `auth.users`.
- Invitation and membership constraints accept adult user identities only.
- No role or grant foreign key may target a minor profile.

### Undocumented Superuser Access

- No wildcard permission, generic administrator, support role, or service-role application path exists.
- Application requests use the authenticated user token and RLS.
- Exceptional future support access requires a separately approved model outside Milestone One.

## Deletion and Retention Boundary

Milestone One uses active, suspended, removed, revoked, expired, and archived states. Permanent deletion, legal hold, production retention periods, backup erasure, and public privacy-policy behavior remain at later qualified gates. The schema must preserve enough lifecycle metadata to implement those policies later without making an unapproved decision now.

Family-visible audit events, security events, and operational logs are separate record classes. Consequential denied authority writes create scoped family audit events. Routine denied reads may create privacy-safe security events where appropriate, but never family audit rows. Operational and security records must not copy private record content.
