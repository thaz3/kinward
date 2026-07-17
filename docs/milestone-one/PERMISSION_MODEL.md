# Kinward Milestone One Permission Model

> **Status:** Updated authorization proposal reflecting D-8 through D-17; closed and verified by targeted systems audit; no implementation authorized
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing decisions:** D-1 through D-17; `PERMISSIONS.md`; `MILESTONE_ONE_DECISIONS.md`

## Authorization Principle

Kinward denies access by default. An authenticated account receives permission only from a current, documented record that matches the requested Circle, Care Recipient when applicable, action, information class, and lifecycle window. Interface visibility is never sufficient authorization.

## Authorization Inputs

Every protected operation evaluates:

1. Authenticated adult user.
2. Requested action code.
3. Resource type and identifier.
4. Circle identifier.
5. Care Recipient identifier when the resource is recipient-specific.
6. Active Circle membership.
7. Sole-owner relationship when applicable.
8. Active Circle-wide role assignments.
9. Active Care Recipient-specific role assignments.
10. Active Shared Management grants and scopes.
11. Active Delegated Management grants and scopes.
12. Active Backup Circle Administrator activation, never designation alone.
13. Managed-minor managing-adult relationship when applicable.
14. Explicit restrictions, disputed holds, archive state, and time windows.
15. Requested action’s recent-authentication or strong-reauthentication requirement.

## Permission Scope Types

- **Account:** The adult’s own authentication and profile settings.
- **Circle-wide:** Membership, invitations, approved Circle roles, non-medical Circle settings, backup designation, and Circle-administration audit.
- **Care Recipient-specific:** Owner activation, role assignments, management mode, Shared/Delegated grants, and recipient-scoped audit.
- **Managed minor-specific:** Basic profile and visibility under one managing adult.
- **Grant-specific:** Scope, consent, lifecycle, review, and delegated-action history.

No permission is implicitly “all Circles” or “all Care Recipients.”

## Permission Sources

### Adult Self-Service

An adult may manage their own account profile, accept or decline invitations bound to their verified email, view their memberships, and leave a Circle when lifecycle safeguards permit. The final active Circle Head cannot leave until another verified adult accepts Circle Head.

### Circle Head

Circle Head is the only active top-level Circle authority role. It may receive approved Circle-wide permissions for membership, invitations, Circle-wide roles, Circle settings, backup designation, and Circle-administration audit. It grants no Care Recipient-specific access, management authority, private caregiver access, or legal authority.

### Family Coordinator

Family Coordinator is a Circle-wide coordination role. In Milestone One it may be assigned and reviewed but receives no Care Recipient management permission. Future Shared Household routing is governed by D-7 but task implementation is outside this milestone.

### Care Recipient Owner

The adult Care Recipient is the sole owner of their record and may select management mode, assign recipient-specific roles within product rules, create and control management grants, and view audit events affecting their record. Ownership cannot be derived from marriage, Circle role, or delegation.

### Care Recipient-Specific Roles

Medical Lead, Care Lead, Chemo Care Lead, Backup Caregiver, and other approved roles are represented as explicit assignments for one Care Recipient. Milestone One tests their scope and lifecycle but does not implement medical or care-content capabilities.

### Shared Management Grant

An active Shared Management grant gives only listed management permission codes for one Care Recipient. It cannot transfer ownership, remove owner access, or let the grantee expand their own scopes.

### Delegated Management Grant

An active Delegated Management grant gives only listed permission codes for one Care Recipient and records actions as performed by the representative on behalf of that Care Recipient. It creates no legal authority.

### Backup Circle Administrator

Designation is dormant and grants zero usable permissions. An active, controlled activation may grant only the fixed non-medical Circle actions approved for backup continuity. It cannot grant Care Recipient access, change management modes or delegation, self-expand, remove Circle Heads, transfer control, or delete the Circle.

### Managing Adult

The one active managing adult may control a managed minor’s basic profile and visibility. This relationship gives no legal determination, Care Recipient access, adult role, or login to the minor.

### Support and Internal Accounts

Milestone One has no support-team family-content permission, impersonation, hidden bypass, or internal superuser. Support identities must not be inserted into family role tables automatically.

## Permission Union and Restriction Rules

1. Collect active permissions only within the exact Circle.
2. For recipient-scoped actions, collect only records matching the exact Care Recipient.
3. Union permissions from separate active sources in that same context.
4. Never union across Circles, Care Recipients, managed minors, or expired time windows.
5. Apply explicit restrictions after the union; a matching deny wins.
6. Apply lifecycle denial after the union: suspended, expired, revoked, removed, archived, disputed, or inactive sources contribute nothing.
7. Apply resource invariants last: ownership transfer, self-expansion, minor login, dormant backup action, and support bypass are always prohibited.
8. Block any action that would remove, downgrade, or release the final active Circle Head before a verified replacement accepts.

## Permission Matrix

Legend: **Allow** means the source may authorize the action when active and in exact scope; **Grant only** means a matching explicit scope is required; **No** means the source never authorizes it.

| Milestone One capability | Adult self | Circle Head | Family Coordinator | Care Recipient owner | Recipient-specific role | Shared manager | Designated representative | Dormant backup | Activated backup | Managed minor | Support/internal |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| View own account and memberships | Allow | Own only | Own only | Own only | Own only | Own only | Own only | Own only | Own only | No login | Own account only, no family content |
| Create a Circle | Allow | Allow as adult | Allow as adult | Allow as adult | Allow as adult | Allow as adult | Allow as adult | Allow as adult | Allow as adult | No | No family bypass |
| View Circle shell | Active membership | Allow | Allow | Active membership | Active membership | Active membership | Active membership | Active membership only | Allow | Basic profile only when shared | No automatic access |
| Invite adult member | No by default | Allow if assigned | Propose only | No unless separately Circle Head/granted | No | Grant only | Grant only | No | Fixed scope only | No | No |
| Manage Circle membership | No | Allow if assigned | No | No unless separately Circle Head/granted | No | Grant only | Grant only | No | Fixed scope only | No | No |
| Assign Circle-wide roles | No | Allow if assigned | No self-expansion | No unless separately Circle Head/granted | No | Grant only | Grant only | No | Fixed approved subset | No | No |
| Propose another adult Care Recipient | No | Allow proposal only | No | No unless separately Circle Head | No | No | Grant only if explicit | No | No | No | No |
| Own adult Care Recipient record | No | No | No | Allow for self | No | No | No | No | No | No | No |
| View a Care Recipient permission summary | No | No automatic access | No | Allow for own record | Assignment-specific summary | Grant only | Grant only | No | No | No | No |
| Assign recipient-specific roles | No | No automatic right | No | Allow | No self-expansion | Grant only | Grant only | No | No | No | No |
| Select management mode | No | No | No | Allow | No | No | No | No | No | No | No |
| Create or change Shared grants | No | No | No | Allow | No | Only if separately granted and never self-expand | Grant only if explicit | No | No | No | No |
| Create or change Delegated grants | No | No | No | Allow | No | Grant only if explicit and never self-expand | Grant only if explicit and never self-expand | No | No | No | No |
| Suspend or revoke own issued grant | No | No | No | Allow | No | No self-control | No self-control | No | No | No | No |
| Manage minor basic profile | No | No automatic right | No | No automatic right | No | No | No | No | No | Managing adult only | No |
| Designate backup | No | Allow if assigned | No | No unless separately Circle Head | No | No | No | No | No self-designation | No | No |
| Activate backup | No | Approve | No | No unless separately Circle Head | No | No | No | Cannot self-activate | Reauthenticate after approval | No | No |
| View Circle-administration audit | Own actions | Assigned Circle scope | Own actions | Own actions unless Circle Head | Own actions | Grant-specific actions | Grant-specific actions | Own designation only | Fixed Circle scope | No | No |
| View Care Recipient audit | Own actions | No automatic right | No | Own record | Own actions in assignment | Grant only | Grant only | No | No | No | No |
| Permanent delete | No | No | No | No in Milestone One | No | No | No | No | No | No | No |

## Explicit Restrictions

Restrictions are scoped deny records and always override allowed permissions. Examples include:

- disputed authority safe hold;
- archived Circle or Care Recipient;
- suspended membership;
- protected action while recent authentication is absent;
- grantor restriction preventing a manager from changing grants;
- managed-minor prohibition on authentication, invitation, adult role, delegation, and Care Recipient access; and
- dormant backup prohibition on every usable backup action.

Restrictions must not be used as grants or as unstructured text containing sensitive family information.

## Management Mode Rules

### Self-Managed

- Owner receives full product-management authority for their own record.
- No Shared or Delegated management source is active.
- Non-management family roles may remain active but contribute only their explicit non-management permissions.

### Shared Management

- Owner remains primary manager and sole owner.
- Each adult manager has a separate active grant and explicit scopes.
- Shared managers cannot transfer ownership, remove owner access, or self-expand.

### Delegated Management

- Owner remains owner and retains access.
- Each representative has a separate explicit grant and scopes.
- Every delegated action records actor and on-behalf-of Care Recipient.
- Optional expiration, “Until revoked,” recurring review, suspension, expiration, and revocation are independently enforced.

## Delegation Lifecycle Evaluation

- **Pending:** No usable permission.
- **Active:** Permission may be evaluated if start time has arrived and expiration has not passed.
- **Suspended:** No usable permission; may be restored only by an authorized actor if still valid.
- **Expired:** No usable permission; cannot be treated as active by relationship or role.
- **Revoked:** No usable permission; cannot be restored.
- **Disputed:** Safe hold; deny permission expansion, ownership changes, and deletion.

An “Until revoked” grant has no `expires_at` but must have a recurring `next_review_at`. A missed review does not invent automatic revocation unless later approved; it produces a review-due state while existing lifecycle rules remain authoritative.

## Backup Activation Rules

Activation requires all of:

1. Active dormant designation for the same Circle.
2. Verified adult account and membership.
3. Authorized Circle Head approval; Milestone One has no alternate recovery branch.
4. A fresh provider-supported verification challenge by the designated backup for every activation.
5. Recorded reason.
6. No disputed authority hold.
7. Atomic activation and audit event.

The backup cannot satisfy the approval condition by claiming Circle Head unavailability.

If no Circle Head can approve, return a neutral unavailable state, grant no permission, and make no incapacity, succession, or legal-authority determination.

## Audit Visibility

- A Care Recipient sees events affecting their record, grants, roles, and owner permissions.
- Circle Heads see only Circle-administration events within assigned Circle scope.
- A member sees their own invitations, assignments, grant actions, and denials when safe.
- A representative sees grant and delegated-action history within their active or historical scope.
- Dormant backup sees designation status and their own activation requests, not Circle audit generally.
- Activated backup sees only audit events for the fixed actions it may perform.
- Support and internal accounts receive no family audit access.
- Audit rows must not reveal another Care Recipient or Circle through labels, counts, filters, or error messages.
- Consequential denied authority writes enter family-visible audit history when the viewer is authorized for that event scope.
- Routine denied reads never enter family-visible audit history; where appropriate they enter a separate privacy-safe security channel.
- Operational logs remain separate from both channels and contain no private record content.

## Reauthentication Rules

- Routine authorized reads, navigation, and ordinary care-coordination actions do not require repeated authentication.
- Consequential role, permission, grant, delegation, management-mode, Circle-archive, and authority writes require authentication completed within the prior 15 minutes.
- Backup activation, account recovery, future top-level authority transfer, and future actions classified as strong require a fresh provider-supported challenge every time.
- Biometrics are optional device convenience and never a required authorization factor.

## Authorization Evaluation Pseudocode

```text
function authorize(request):
    actor = requireAuthenticatedAdult(request.session)
    resource = loadSafeResourceEnvelope(request.resourceId)

    if resource does not exist:
        return DENY_NOT_FOUND_OR_FORBIDDEN

    if request.circleId != resource.circleId:
        return DENY_CONTEXT_MISMATCH

    membership = activeMembership(actor.id, request.circleId)
    if membership is absent:
        return DENY_NOT_FOUND_OR_FORBIDDEN

    if resource.requiresCareRecipient:
        if request.careRecipientId is absent:
            return DENY_MISSING_CONTEXT
        if request.careRecipientId != resource.careRecipientId:
            return DENY_CONTEXT_MISMATCH

    if hasGlobalInvariantDenial(actor, request, resource):
        return DENY_INVARIANT

    candidatePermissions = empty set

    candidatePermissions += ownAccountPermissions(actor, resource)
    candidatePermissions += soleOwnerPermissions(actor, request.careRecipientId)
    candidatePermissions += activeCircleRolePermissions(membership, request.circleId)
    candidatePermissions += activeRecipientRolePermissions(
        membership,
        request.circleId,
        request.careRecipientId
    )
    candidatePermissions += activeSharedGrantPermissions(
        membership,
        request.circleId,
        request.careRecipientId,
        request.now
    )
    candidatePermissions += activeDelegatedGrantPermissions(
        membership,
        request.circleId,
        request.careRecipientId,
        request.now
    )
    candidatePermissions += activeBackupPermissions(
        membership,
        request.circleId,
        request.now
    )
    candidatePermissions += managingAdultPermissions(
        membership,
        resource.managedMinorId
    )

    restrictions = activeRestrictions(
        actor,
        request.circleId,
        request.careRecipientId,
        request.action,
        request.now
    )

    if restrictions deny request.action:
        return DENY_EXPLICIT_RESTRICTION

    if request.requiresRecentAuthentication and not recentAuthentication(actor):
        return DENY_REAUTHENTICATION_REQUIRED

    if request.action not in candidatePermissions:
        return DENY_NO_PERMISSION

    if not databasePolicyWouldAllow(actor, request, resource):
        return DENY_DATABASE_POLICY

    return ALLOW with exact source identifiers for audit
```

## Protected Write Pattern

```text
begin transaction
    lock target security record
    verify expected version and lifecycle state
    authorize actor for exact action and context
    apply constrained state transition
    append audit event with actor, source, result, and before/after identifiers
commit transaction
```

If the audit append fails, the security change rolls back.

## RLS Translation

- `SELECT`: Return only rows for which the actor has active membership plus exact resource permission.
- `INSERT`: Permit only through constrained operations that validate actor and context.
- `UPDATE`: Allow only approved state transitions and expected versions; never arbitrary row updates.
- `DELETE`: Deny application roles in Milestone One.
- Audit table: allow constrained inserts and scope-filtered selects; deny updates and deletes.

## Required Authorization Tests

The objective scenarios are defined in `ACCEPTANCE_TEST_PLAN.md`. No permission-model slice is complete until server and RLS tests independently prove both allowed and denied paths.
