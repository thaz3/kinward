# Screen 37 — Permission denied

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Deny protected reads, writes, and audit rows without existence leakage. **Decisions:** D-1–D-5, D-14. **Low fidelity:** `07-audit-and-system-states.md`, Screen 37. **Flow/tests:** UF-21, UF-26; AT-022, AT-027, AT-044.

## Audience, entry, and context

Audience is an authenticated adult whose direct or navigational request is unauthorized. Circle and Care Recipient context appear only when independently authorized; otherwise omit them. Before authorization and in the denied result, reveal no protected record, event, actor, role, attempted value, reason, identifier, filtered count, or existence clue. No after-authorization protected content exists on this screen.

## Actions and states

**Primary safe action:** `Return to My Kinward` or the nearest independently authorized page. Loading is non-identifying and is cleared before denial. Empty never substitutes for denial. System error uses the same least-information boundary. Denial says `This information isn’t available to you` and nothing changed. No destructive/discard confirmation applies. Focus moves to the denial heading; returning restores focus to the initiating link/control when possible.

**Secondary action:** none unless an independently authorized safe destination exists. **Success/completion state:** the denied request never succeeds on this screen; completion is a safe return with access unchanged. **Screen-reader semantics:** expose the denial heading and calm message as an alert/status, then the safe action in reading order; do not attach hidden protected descriptions.

## Accessibility, privacy, and lifecycle

Use an alert heading, plain calm message, icon plus text, safe 48 px action, and verified focus. At narrow and calibrated 200%, all content wraps without horizontal scroll. Deny by default across Circle, recipient, audit-row, and audit-field scopes; hidden navigation is not authorization. Clear previous protected content before checking the new context and discard every late response. Excludes support impersonation, relationship-derived access, medical alerts, and uploads. Runtime authorization, focus restoration, audit policy, and stale-response disposal remain implementation-only.
