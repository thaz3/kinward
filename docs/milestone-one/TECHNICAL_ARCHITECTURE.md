# Kinward Milestone One Technical Architecture

> **Status:** Updated proposal reflecting D-8 through D-17; closed and verified by targeted systems audit; no implementation or infrastructure authorized
> **Version:** 0.1
> **Last updated:** 2026-07-16
> **Governing decisions:** D-1 through D-17; `MILESTONE_ONE_READINESS.md`; `PERMISSIONS.md`

## Scope and Constraints

This proposal covers only the non-medical Milestone One foundation using Next.js, TypeScript, Supabase/PostgreSQL, and a mobile-first Progressive Web App design. It does not authorize framework initialization, package installation, database deployment, application coding, or production infrastructure.

The architecture must not contain check-in, symptom, treatment, medication, diet, movement, medical-alert, document-validation, analytics, or real-family-data modules.

## Proposed System Shape

```text
Browser/PWA
  -> Next.js presentation and route boundary
    -> authenticated server actions / route handlers
      -> Supabase client using the user's session token
        -> PostgreSQL Row Level Security and constrained database functions
          -> scoped records and append-only audit events
```

Authorization is evaluated at every layer but trusted only when enforced server-side and in PostgreSQL policies. Client navigation and hidden controls are usability aids, not security boundaries.

## Frontend Structure

Use a Next.js App Router structure organized by product boundary rather than by database table:

- **Public:** welcome, authentication return, invitation entry, and generic errors.
- **My Kinward:** Circle list, pending invitations, and account profile.
- **Circle context:** overview, members, Circle-wide roles, settings, backup designation, and Circle audit history.
- **Care Recipient context:** owner activation, switcher, Care Recipient-specific roles, management mode, grants, and scoped audit history.
- **Managed minors:** profile creation, visibility, archive, and managing-adult summary.
- **Shared UI:** accessible shell, context banner, forms, confirmations, status badges with text, denied states, and audit-safe event summaries.

Prefer server-rendered initial authorization context. Use client components only for interactions that need local state. Never persist protected records in broad browser stores. Clear query caches, form drafts, and selected recipient state on Circle or Care Recipient changes.

## Server-Side Boundaries

- Treat every route, server action, and route handler as untrusted input.
- Validate identifiers, action names, lifecycle transitions, and expected record versions.
- Resolve the authenticated user from the Supabase session, never from a submitted user identifier.
- Require explicit Circle context and Care Recipient context where applicable.
- Call a single authorization domain service before protected work and rely on RLS as an independent final boundary.
- Perform consequential writes and their audit events in one PostgreSQL transaction or constrained database function.
- Use idempotency keys for invitation creation, Circle creation, grant changes, backup activation, and destructive transitions.
- Do not expose a service-role key to application routes. Administrative migration credentials are operational tooling, not an application superuser.

## Authentication Proposal

- Use Supabase Auth for adult accounts only.
- Use verified email as the only Milestone One authentication, invitation-binding, and account-verification channel. SMS login, phone OTP, phone recovery, and SMS invitation delivery are deferred.
- Keep identity records separate from contact methods so another verified channel can be added later without changing account ownership.
- Bind invitations to a normalized verified email plus a one-way token hash; possession of the token alone is insufficient.
- Require authentication within the prior 15 minutes for role and permission changes, grant changes, management-mode changes, Circle archive, and comparable consequential authority actions.
- Require a fresh provider-supported verification challenge every time for backup activation, account recovery, future top-level authority transfer, and future actions classified as strong. Biometrics are optional convenience only.
- Managed minor profiles never receive an Auth user, credential, session, or invitation.
- Keep authentication identity separate from Circle membership, roles, ownership, and delegation.

## Database Access

- Browser reads use the Supabase client with the authenticated user's token and RLS.
- Sensitive writes use Next.js server actions or route handlers with the same user identity, validated input, and constrained database functions.
- Avoid direct browser writes to security-critical tables even when RLS exists; the server boundary provides validation, idempotency, and consistent audit behavior.
- Never authorize from JWT role claims beyond authenticated identity. Effective Kinward permissions come from current database records so suspension and revocation take effect immediately.
- Use generated UUIDs, database timestamps, immutable actor identifiers, and optimistic version columns.

## Authorization Architecture

The authorization service receives:

- authenticated user identifier;
- requested action;
- Circle identifier;
- Care Recipient identifier when required;
- target record type and identifier;
- current time; and
- expected lifecycle state.

It evaluates active membership, ownership, role assignments, Shared Management grants, Delegated Management grants and scopes, backup activation, managed-minor management, explicit restrictions, and disputed safe holds. Restrictions, invalid lifecycle states, scope mismatches, and context mismatches override permission unions.

The service returns only an allow/deny result plus a safe internal reason code. It never returns broader records to allow the interface to filter them afterward.

## Supabase Row Level Security Strategy

Enable RLS on every Kinward table. Deny all operations unless a narrowly defined policy allows them.

### Policy Principles

- Require `auth.uid()` to match an active Circle membership for Circle-level rows.
- Require a matching Care Recipient owner or active explicit permission for recipient-scoped rows.
- Keep Circle-wide and Care Recipient-specific role tables separate or enforce an exclusive scope constraint.
- Check lifecycle state and time windows inside policies.
- Treat suspended, expired, revoked, disputed, archived, removed, and inactive records as denying access unless the action is an authorized history read.
- Permit a dormant backup to read only its own designation status, not Circle administration data granted for activation.
- Permit managed-minor reads only to the managing adult and explicitly approved basic-profile audience.
- Filter audit events by event scope and viewer authority.
- Do not create a policy that grants all rows to a generic administrator, Circle Head, support account, or internal Kinward user.

### Database Functions

Use security-definer functions only when a multi-row invariant cannot be safely expressed otherwise. Each function must:

- set a fixed search path;
- verify `auth.uid()` and authorization internally;
- accept minimal identifiers rather than whole records;
- enforce expected prior state;
- write the state change and audit event atomically;
- return only the minimum result; and
- have execution granted only to the authenticated application role.

Candidate constrained functions include Circle creation, invitation acceptance, Care Recipient owner activation, management-mode transition, grant lifecycle transition, backup activation, and append-only audit write.

## Invitation Flow

1. Authorized actor submits a normalized contact, Circle, proposed roles, and optional Care Recipient scopes.
2. Server verifies assignment authority and stores a token hash, seven-day expiration, creator, and proposed assignments.
3. Delivery contains generic wording and the opaque token only.
4. Recipient authenticates and verifies control of the bound contact.
5. Transaction locks the invitation, checks active/unused/unexpired state, creates membership, activates only approved assignments, marks the invitation accepted, and writes audit events.
6. Decline, cancel, expiration, and contact mismatch create no membership or access.

No Circle or Care Recipient information is returned before identity binding succeeds.

Another adult Care Recipient uses a separate ownership-invitation flow: create an inactive pending Care Recipient, send a dedicated invitation to the proposed owner's verified email, and record separate acceptance and consent history. No private Care Recipient information may exist before acceptance. Acceptance activates sole ownership and Circle membership atomically; no ordinary membership invitation is also required.

## Session Handling and Revocation

- Keep authorization out of long-lived JWT custom claims.
- Reevaluate database permissions on every protected request.
- On role or grant suspension/revocation, increment an authorization version for affected contexts and clear application caches.
- Realtime or polling may prompt open clients to refresh, but correctness does not depend on delivery.
- PostgreSQL policies deny new reads and writes immediately after the committed change, even if the Supabase authentication session remains valid.
- Where technically possible, invalidate affected application sessions. Do not revoke unrelated Circle access merely because one delegation ends.
- Use server-validated authentication timestamps for the approved 15-minute window; do not store authority-bearing markers in client-readable local storage.

## Audit Events

Write append-only events for:

- Circle creation and archive;
- invitation creation, cancellation, expiration, acceptance, and decline;
- membership creation, removal, and status change;
- Circle-wide and Care Recipient-specific role changes;
- Care Recipient owner acceptance and management-mode changes;
- Shared and Delegated grant creation, consent, acceptance, scope changes, suspension, restoration, expiration, review, and revocation;
- managed-minor creation, visibility, archive, and managing-adult changes;
- backup designation, verification, activation request, approval, activation, action, suspension, and deactivation; and
- consequential denied authority writes.

Events store safe identifiers and before/after state identifiers, not copied private content. Audit events are immutable through application roles.

Routine denied reads do not enter family-visible audit history. Where appropriate, they enter a separate privacy-safe security-event channel. Operational logs remain a third channel. Neither technical channel may contain private record content or expose sensitive identifiers to unauthorized family, support, or internal users.

## Synthetic Test Data

- Provide a deterministic synthetic fixture specification, not real data imports.
- Use obviously fictional Circle and person names.
- Include multiple Circles, Dad/Mom Care Recipients, one multi-role member, one managed minor, one dormant backup, and grants in every lifecycle state.
- Mark every environment and fixture as synthetic.
- Prohibit production exports, copied screenshots, or personal contact data in local, preview, test, or demonstration environments.

## Environment Boundaries

- **Local development:** local execution, development-only configuration, and fictional or synthetic data only.
- **Controlled hosted preview:** separate preview resources, clearly test-labeled, synthetic only, and prohibited from actual care coordination or real health information.
- **Restricted real-family beta:** future separate resources, configuration, credentials, databases, private storage, logs, and access controls. It is the invite-only **Restricted real-care family pilot** and remains unavailable until Gate C and signed readiness approval.

No data path may copy real-family information into local or preview environments. This architecture does not provision any environment. Secure document upload remains outside Milestone One and requires separate authorization, private storage and Care Recipient authorization, no public URLs, encryption, time-limited access where applicable, file restrictions, malicious-file protections, audit rules, lifecycle and backup rules, log protections, and incident response.

## Logging and Observability

- Log request correlation ID, route/action, safe actor identifier, safe context identifiers, result code, latency, and error class.
- Do not log invitation tokens, email/phone values, names, role descriptions containing family context, consent text, or protected record payloads.
- Keep application logs separate from user-visible audit history.
- Record authorization denials with stable reason codes, not sensitive explanations.
- Do not add third-party analytics in Milestone One.

## Error Handling

- Use typed domain errors: unauthenticated, denied, not-found-or-denied, stale-version, invalid-transition, validation, conflict, and unavailable.
- Return the same external response when distinguishing denied from nonexistent would reveal private information.
- Keep validation errors specific only to fields the user is authorized to know.
- Roll back state and audit writes together.
- Provide a safe correlation identifier without protected data.
- Never retry a consequential write without idempotency protection.

## Accessibility Architecture

- Establish shared semantic page, form, dialog, error-summary, status, and confirmation patterns before feature screens.
- Render meaningful page titles and heading hierarchies server-side.
- Maintain focus on route changes and restore focus after dialogs.
- Support keyboard operation, 200% text resize, reduced motion, high contrast, and 48-by-48-pixel primary targets.
- Use native controls first and test custom controls with VoiceOver and TalkBack.
- Keep authorization and validation messages plain, specific, and non-shaming.
- Make loading, denied, empty, and stale states programmatically announced.

## Progressive Web App Boundary

- Provide installable shell metadata and responsive navigation as a proposal.
- Cache only static application shell assets in Milestone One.
- Do not cache protected family, role, delegation, audit, invitation, or minor-profile data for offline use.
- Clear protected in-memory data on sign-out and context change.
- Treat push notifications and offline emergency data as outside Milestone One.

## Future Capacitor and iOS Compatibility

- Keep routing and domain authorization independent of browser-only APIs.
- Wrap authentication return, secure storage, deep links, and app lifecycle behavior behind adapters.
- Avoid assuming service-worker storage is the future native secure store.
- Use responsive web components that can run in a Capacitor web view without changing server authorization.
- Defer native packaging, entitlements, push notifications, biometric unlock, and App Store work to later approved gates.

## Architecture Risks and Required Proofs

- **RLS complexity:** Prove every table with allow and deny tests before coding dependent slices.
- **Context leakage:** Prove Circle and Care Recipient switches clear server and client state.
- **Revocation timing:** Prove committed lifecycle changes deny the next protected request without relying on token refresh.
- **Audit atomicity:** Prove no security state changes without a matching audit event.
- **Backup activation:** Prove dormant designation has zero usable permission and self-activation is impossible.
- **Minor identity:** Prove no authentication identity or invitation can reference a managed minor profile.
- **No superuser:** Prove support and internal identities have no family-content bypass.

## Proposal Decisions Requiring Confirmation

OQ-01 through OQ-10 are resolved by D-8 through D-17. Remaining qualified-review questions include alternate recovery, production and real-family retention, Gate C security and privacy architecture, secure-document readiness, and broader Gate D device coverage. This document authorizes none of them and does not authorize coding or provisioning.
