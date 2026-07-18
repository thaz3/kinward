# Screen 14 — Circle member list

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Review Circle membership and Circle-wide roles without implying Care Recipient access. **Decisions:** D-1, D-2, D-10. **Low fidelity:** `03-roles-and-management-modes.md`, Screen 14. **Flow/tests:** UF-03, UF-05; AT-002, AT-004.

## Audience, entry, and context

Authorized Circle members may see the membership view; invitation and role actions appear only with explicit authority. Active context is `Circle — Harbor Circle`; `Care Recipient — Circle-wide`. Before authorization, show no Circle, member, pending invitation, role, or count. After authorization, show permitted member identities, Circle-wide roles, full-text status, and only allowed actions.

## Actions and states

**Primary when authorized:** `Invite an adult`. **Secondary:** open a permitted member or pending invitation. Loading uses safe unlabeled skeleton rows. Empty says `No other members yet` only when the authorized result is truly empty. Row or system errors reveal no hidden data and offer retry. Neutral denial supplies no identifiers or counts. Successful invitation/role updates announce the result and restore focus to the affected row. Long identities and metadata wrap; a row action remains 48 px.

**Neutral denied state:** `Information unavailable`; it is distinct from an authorized empty list and reveals no member, invitation, role, or count.

## Accessibility, privacy, and lifecycle

Use a semantic list with member-name headings, explicit role/status text, current Circle announcement, visible focus, and logical row actions. At narrow and calibrated 200%, metadata stacks and actions move below the row with no horizontal scroll. Membership never conveys medical, ownership, management, delegation, or recipient-specific permission. Per-row filtering is server-authoritative; clear context before Circle changes and discard stale rows. Excludes hidden administrators, relationship-derived authority, minor sign-in, medical data, and uploads. Runtime row authorization, pagination, live announcements, focus restoration, and stale-response disposal require implementation testing.
