# Screen 17 — Self-Managed mode

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Confirm that an adult Care Recipient remains in direct control. **Decisions:** D-2, D-3. **Low fidelity:** `03-roles-and-management-modes.md`, Screen 17. **Flow/tests:** UF-06; AT-006.

## Audience, entry, and context

Audience is the verified adult sole owner. Entry is from management-mode selection with recent authentication where required. Context is `Circle — Harbor Circle`; `Care Recipient — Dad`. Before authorization show no recipient identity, mode, or roles. After authorization explain ownership remains constant, self-management grants no one management authority, and non-management helpers keep only separately granted permissions.

## Actions and states

**Primary:** `Use Self-Managed`. **Secondary:** `Back`. Loading clears former context. Initial empty means no mode chosen and makes no automatic selection. Recent-auth, dispute, inactive-recipient, stale, and system errors grant nothing. Denial is neutral. Confirmation summarizes what changes and what does not; success says `Self-Managed selected`. Dirty cancel uses a discard prompt if a choice changed.

**Neutral denied state:** `Information unavailable`, with no recipient or mode details. **Screen-reader semantics:** expose the mode group, selected state, consequence summary, confirmation, and completion status with programmatic names and state.

## Accessibility, privacy, and lifecycle

Use a labeled mode choice, selected mark plus text and boundary, consequence list, announced result, and focus on the changed heading/status. At narrow and 200%, comparison content becomes one column and buttons stack with complete text. Only the owner chooses; spouse, caregiver, Circle Head, or relationship status gives no authority. Changing mode does not silently rewrite discrete roles or grants. Clear context and discard stale writes after a switch. Excludes joint ownership, implied caregivers, medical workflows, and uploads. Runtime recent-auth, authorization, atomic transition, audit, focus, and announcements remain implementation-only.
