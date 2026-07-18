# Screen 33 — Consequential denied action

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Explain a denied protected write without leaking the target or expanding authority. **Decisions:** D-2, D-3, D-5, D-14. **Low fidelity:** `07-audit-and-system-states.md`, Screen 33. **Flow/tests:** UF-21, UF-26; AT-022, AT-035, AT-044.

## Audience, entry, and context

Audience is the authenticated actor whose protected action was denied. Circle and recipient context display only if independently authorized. Before authorization reveal no record, event, actor, role, attempted value, reason, identifier, or count. After authorization show generic reason category, `Nothing changed`, and that an audit entry may exist only to viewers authorized for that event.

## Actions and states

**Primary safe action:** `Return`. **Secondary:** `Review your access` only if authorized. Loading is non-identifying. Empty does not apply. System error cannot turn denial into success or disclose detail. Neutral denial is the default presentation. No destructive/discard confirmation applies. Completion returns focus to a safe authorized location; the write remains denied.

**Screen-reader semantics:** expose the denial heading, unchanged-state message, and safe actions as an alert/status with no hidden protected description. **Stale-response behavior:** discard every late success or error from the denied write so it cannot repaint content or imply that the write succeeded.

## Accessibility, privacy, and lifecycle

Use an error-summary/alert heading, text plus icon, calm non-alarmist copy, and verified focus. At narrow and calibrated 200%, messages/actions wrap and stack with 48 px targets. Circle-wide authority does not expose recipient-specific denied writes; audit access is per row and field. Clear context before any follow-up query and discard late success/error responses. Excludes hidden reasons, alternate authority, medical alerts, and uploads. Runtime deny-by-default enforcement, audit filtering, focus restoration, and race disposal remain implementation-only.
