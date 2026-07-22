# Kinward Permissions

> **Status:** Current core access requirements; D-8 through D-17 closed and verified by targeted systems audit
> **Version:** 0.2
> **Last updated:** 2026-07-22
> **Governing or related decisions:** D-1 through D-5, D-7 through D-17; F-01-R, F-02-R, F-17 through F-19

## Permission Principles

- Deny access by default.
- Scope every permission to a Family Circle, Care Recipient, information type, action, and time where appropriate.
- Keep Circles strictly separate.
- Keep multiple Care Recipients inside one Circle strictly separate.
- Let each Care Recipient control their medical and personal information.
- Let each adult control their own private well-being entries.
- Keep Circle administration separate from medical access.
- Never grant access because someone is a spouse, relative, Circle Head, Backup Circle Administrator, Family Coordinator, or caregiver.
- Separate permission to view, add, edit, share, approve, administer, export, and delete.
- Preserve the actor and “on behalf of” identity for every delegated action.
- Use the more private behavior when consent or authority is unclear, disputed, expired, or withdrawn.
- Never grant the Extended Circle or managed minor profiles detailed medical access.

## Permission Context

Every screen and record must know:

1. The active Family Circle.
2. The active Care Recipient, when the item belongs to one person.
3. Whether the item is a shared household item.
4. The information owner.
5. The viewer's role and explicit grants.
6. Any delegation, treatment, or coverage time window.
7. The allowed action.

A user may belong to multiple Family Circles, and one Circle may contain multiple Care Recipients. Switching context must be deliberate and visible. Search, notifications, exports, offline data, and audit views must enforce the same boundaries.

## Information Classes

### A. Care Recipient Medical and Personal Information

Patient Check-Ins, symptoms, temperature, food and hydration records, medication references, rest and movement records, port or pump concerns, diagnoses entered for coordination, treatment details, healthcare-team instructions, tests, private documents, prognosis, and detailed appointments.

The Care Recipient owns this information. Detailed access requires their grant or verified legal authority handled through the approved review process.

### B. Adult Private Well-Being

Energy, stress, physical capacity, rest, workload, private support reasons, and other caregiver check-in details.

The adult author owns the entry. They may share:

- The full entry.
- A limited status.
- A request for help.
- Nothing.

No spouse, Care Recipient, Circle Head, Backup Circle Administrator, Family Coordinator, or other family role receives automatic access.

### C. Circle Administration

Membership, non-medical roles, shared household preferences, Circle-level settings, and Backup Circle Administrator designation. Circle administration does not include medical access.

### D. Care Recipient Management

Permissions to manage daily care, Patient Check-Ins, care and medical information, updates, schedules, membership, privacy, documents, caregiving assignments, notifications, or emergency contacts on behalf of one Care Recipient.

These permissions exist only through Self-Managed, Shared Management, or Delegated Management grants.

### E. Coordination Information

Tasks, rides, meals, pharmacy support, household support, childcare, coverage, and the minimum instructions needed to complete them. An item may belong to one Care Recipient or be a shared household task.

### F. Circle Updates

Non-clinical updates intentionally authored and approved for a selected audience. Medical or caregiver records are never copied into an update automatically.

### G. Contacts and Locations

Phone numbers, addresses, appointment locations, household access instructions, healthcare-team contacts, and emergency contacts. Each field has its own audience.

### H. Spiritual and Reflective Content

Prayer, meditation, encouragement, drawings, voice notes, and belief-related preferences. Participation is optional and controlled by the content author, Care Recipient where applicable, and authorized Circle permissions.

### I. Managed Minor Information

Age-appropriate profile details and contributions submitted by an authorized adult. This is separate from adult medical, emergency, caregiver, document, and notification data.

### J. Legal Role Metadata

An optional record that a document or legal role has been presented, its stated type, review status, and audit history. Legal metadata is separate from Kinward app permissions. Kinward does not declare the document valid.

## Default Role Matrix

The matrix describes defaults. Explicit Care Recipient grants may narrow or expand only the scopes the product allows.

| Capability | Care Recipient | Circle Head | Designated Care Representative | Family Coordinator | Medical Lead | Care Lead | Chemo Care Lead | Backup Caregiver | Extended Circle |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Control own medical information | Full | No automatic access | Only granted scope | No | Approved medical scope only | No by default | Treatment-window scope only | Coverage-window scope only | Never |
| View another Care Recipient's information | Only if granted | Only if granted | Only for named Care Recipient and scope | No | Separately approved per Care Recipient | No by default | Separately approved treatment scope | Separately approved coverage scope | Never |
| Complete Patient Check-In | Self | No automatic right | If granted | No | If granted | If granted | If granted | During granted coverage | Never |
| Edit healthcare-team instructions | Self, with history | No | If granted, with history | No | Approved scope, with history | No | Approved treatment scope, with history | No | Never |
| Manage own private well-being entry | Full | Own entries only | Own entries only | Own entries only | Own entries only | Own entries only | Own entries only | Own entries only | Own entries only |
| View another adult's well-being entry | Only if that adult shares | Only if that adult shares | Only if that adult shares | Only if that adult shares | Only if that adult shares | Only if that adult shares | Only if that adult shares | Only if that adult shares | Never by default |
| Manage general Circle membership | If separately a Circle Head or delegated | Assigned scope | If granted | Propose only | No | No | No | No | No |
| Manage Care Recipient privacy | Self | No automatic right | If granted | No | No | No | No | No | No |
| Coordinate general tasks | Yes | Assigned scope | If granted | Yes | Medical tasks | Yes | Treatment-cycle tasks | Assigned coverage | Claim shared tasks |
| View full appointment details | Own | Only if granted | If granted | Logistics only | Approved scope | Logistics only | Approved treatment events | Coverage events | Never |
| View limited schedule summary | As shared | As shared | As granted | As shared | As shared | As shared | As shared | As shared | Only when intentionally shared |
| Manage emergency contacts | Own information | Shared Circle contacts only | If granted | Propose changes | Healthcare contacts in scope | Approved family contacts | View in scope | View during coverage | Never by default |
| Draft Circle update | Yes | Assigned scope | If granted | Yes | Yes | Yes | Yes | No by default | No |
| Approve update about Care Recipient | Self or granted representative | No automatic right | If granted | No | No | No | No | No | No |
| View limited Circle update | As selected | As selected | As selected | As selected | As selected | As selected | As selected | As selected | Yes, when selected |
| Export or delete Care Recipient data | Self, subject to policy | No automatic right | If explicitly granted and policy allows | No | No | No | No | No | No |
| View audit history | Own data and grants | Circle administration scope | Delegated-action scope | Own actions | Own actions | Own actions | Own actions | Own actions | Own actions |

## Care Management Mode Permissions

### Self-Managed

The adult Care Recipient is the sole owner and directly controls management of their record. Other adults may retain non-management coordination or care roles such as Family Coordinator, Care Lead, Medical Lead, or Chemo Care Lead, but those roles grant no management access to the Care Recipient's private information. Other-adult access exists only through explicit role permissions, Shared Management grants, Delegated Management grants, or separately recorded legal authority handled through the approved review process. Family relationship alone creates no access. Joint ownership is excluded from the MVP.

### Shared Management

The Care Recipient may grant selected permissions to one or more adults. Each grant is separate. Slice 9 completes Shared Management setup; Delegated Management expiration and lifecycle behavior remains Slice 10.

### Delegated Management

A Shared Manager or Designated Care Representative may receive only these Milestone One management scopes:

- Manage roles.
- Review permissions.

Change ownership is never grantable. “Grant all current Kinward management permissions” stores both current scopes as explicit versioned rows. It is not a wildcard and does not add future scopes automatically.

Slice 9 may persist a delegated grant only as `Pending` after Screen 20. A pending delegation grants no effective permission. Slice 10 owns expiration or “Until revoked,” delegated consent and representative acceptance, activation, suspension, restoration, expiration, and revocation. Effective-permission evaluation ignores incomplete pending grants.

Every delegation record includes:

- Granting Care Recipient.
- Receiving adult.
- Permission scopes.
- Start date.
- Optional expiration.
- Current status: pending, active, suspended, expired, revoked, or disputed.
- Consent record.
- Change and revocation history.

Every delegated action stores the actor, Care Recipient, action, item, time, and “on behalf of” relationship without unnecessarily duplicating sensitive content.

The interface recommends and prefills a 90-day expiration. The Care Recipient may deliberately choose “Until revoked,” and any delegation without an expiration generates a recurring 90-day access-review reminder. The Care Recipient retains access and can modify, suspend, restore, or immediately revoke delegation while able to do so. Suspension or revocation removes delegated permissions everywhere and invalidates active delegated sessions where technically possible while preserving audit history. Expired, revoked, suspended, unclear, or disputed delegation denies access. No spouse or other family relationship creates an exception.

## Circle Head and Administration Rules

- A Care Recipient may also be a Circle Head but does not have to be.
- A spouse may be a Circle Head but gains no automatic medical or delegated authority.
- Circle Heads manage only assigned shared Circle functions.
- Each Circle has a dormant Backup Circle Administrator designation for approved non-medical continuity. Dormant status grants no usable permissions; approved activation is required before assigned non-medical permissions become active.
- Designation requires identity and account-ownership verification. Milestone One activation requires an authorized Circle Head's approval, a fresh provider-supported challenge, a recorded reason, and an audit entry; the backup cannot self-activate. If no authorized Circle Head is available, Kinward grants no access and shows a neutral message that a separately reviewed recovery process is required.
- Backup Circle Administrator activation, actions, suspension, and deactivation are audited.
- Circle Head or Backup Circle Administrator status does not override record ownership.
- Membership changes must not expose information from another Circle or Care Recipient.

## Managed Minor Profile Rules

An authorized adult controls each managed minor profile.

The profile may:

- Receive an age-appropriate update through the managing adult.
- Hold a prayer, message, drawing, voice note, or supervised contribution submitted by that adult.
- Participate in age-appropriate household coordination.

The profile must not:

- Sign in independently.
- Receive medical or emergency alerts.
- View symptoms, medications, prognosis, emergency information, private documents, or adult well-being entries.
- Receive adult medical content through automatic summarization.
- Hold adult caregiving or medical responsibility.
- Appear in a sensitive locked-screen notification.

Direct minor accounts are outside the MVP.

## Record-Level Rules

- Every sensitive record has an owner, Circle, Care Recipient where applicable, audience, author, source where relevant, and timestamps.
- Patient and caregiver records remain separate even when Circle Today displays separate summaries.
- A Patient Today summary card is visible only through an active permission for that specific Care Recipient.
- A Caregiver Today summary card follows the caregiver author's sharing preference and never inherits a Care Recipient audience.
- A spouse, Circle Head, Family Coordinator, Care Recipient, or other adult receives no automatic Caregiver Today summary access.
- Extended Circle members see neither summary card by default and may receive only manually approved family-safe Circle Updates.
- Permission to see one Care Recipient's summary does not permit viewing another Care Recipient's summary in the same Circle.
- Changing a role does not silently reveal earlier records.
- Removing future access preserves audit history and completed-action history.
- Task recipients see only the details needed to complete the task.
- Shared Household tasks use no active Care Recipient and contain only non-sensitive general meals, groceries, laundry, household cleaning, general transportation logistics, or household coverage. Diagnoses, symptoms, medications, private caregiver information, and other person-specific sensitive information require a Care Recipient-specific task.
- Each Shared Household task has a creator, optional assignee, status, and due-date information where applicable. An unassigned, declined, or overdue task routes to the Circle-wide Family Coordinator queue. If no active Circle-wide Family Coordinator exists, authorization and display rules produce “No routing lead assigned.” A Circle Head may assign a Family Coordinator or directly assign the non-sensitive task but gains no hidden access or Care Recipient authority.
- Notifications contain generic text by default.
- Revocation ends active sessions and protected local access; Kinward cannot recall screenshots or exports already saved outside the product.
- No Circle role, including Circle Head or Backup Circle Administrator, support function, or internal Kinward account receives undocumented or automatic access to Circle or Care Recipient information.
- Authorization denies every action unless a documented, active permission allows that action for the current Circle, Care Recipient, information type, and time window.
- Any future exceptional support access must be separately authorized, time-limited, logged, reviewed, and kept outside family role assignments.

## Consent, Disagreement, and Relationship Changes

- Unclear, disputed, expired, or withdrawn consent uses the more private option.
- Information is not published while approval is disputed.
- A relationship change can remove future access without deleting historical records, audit history, or completed actions.
- Account succession or access transfer requires explicit approval, identity verification, and required legal documentation.
- Kinward does not determine incapacity or legal authority.

## Legal Authority Separation

Healthcare Agent, Health Care Proxy, Power of Attorney, Guardian, Personal Representative, and similar roles are not Kinward permission roles.

Kinward may record that documentation exists and that it entered a review process. It must not:

- Declare the document valid.
- Decide capacity or incapacity.
- Grant access solely from an unverified label.
- Resolve competing legal claims.

Applicable law and verified documentation govern legal authority.

## Permission Changes and Audit

The product records:

- Invitations, acceptances, removals, and role changes.
- Circle and Care Recipient context.
- Sharing settings and audience changes.
- Care Management Mode and delegation changes.
- Who acted and on whose behalf.
- Healthcare-team instruction changes.
- Sensitive exports, deletion requests, support access, and succession requests.

Milestone One authorization also requires:

- Ordinary adult invitations are sent to and bound to the invited adult's verified email address. Adult Care Recipient ownership invitations are sent to and bound to the proposed owner's verified email address. Acceptance requires the invited adult to verify and use the matching email identity. Phone authentication, phone invitation binding, phone OTP, SMS invitation delivery, and phone-based account recovery are deferred under D-8; phone numbers may later be stored separately as contact information.
- A dedicated adult ownership invitation and consent record before a pending Care Recipient becomes active or receives private information.
- Authentication within the prior 15 minutes for consequential authority writes and a fresh provider-supported challenge for every backup activation or other designated strong action.
- A last-active-Circle-Head invariant that blocks departure or role loss until another verified adult accepts Circle Head.
- Family-visible audit events for consequential denied authority writes, but not routine denied reads.
- Separate privacy-safe security and operational logs for routine denied reads where appropriate, without private record content or unauthorized sensitive identifiers.
- In-app 90-day access-review state for “Until revoked” delegation, including next review, last review, reviewer, result, and audit event.
- Synthetic audit retention for the life of each active test environment; production and real-family retention automation remains Gate C work.
- Strict separation among local synthetic, hosted synthetic preview, and any future restricted real-family beta environment.

## Remaining Decisions

- The authorized-adult and consent rules for creating and managing minor profiles.
- The legal-document intake, verification, rejection, appeal, and retention process by launch region.
- The response when a Care Recipient cannot revoke access and people present conflicting authority.
- Whether legal documents are stored or only their existence and review state are recorded.
- The exact scopes permitted for a Backup Circle Administrator during account recovery.
- Whether a later version supports sensitive shared tasks requiring multiple owners' approval; the MVP does not.
- Exact export, deletion, legal hold, backup, cache, and succession periods.
- What support staff may access in exceptional cases and who approves it.
