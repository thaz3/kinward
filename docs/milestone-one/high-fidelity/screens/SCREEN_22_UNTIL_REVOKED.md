# Screen 22 — “Until revoked” selection

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Obtain explicit consent to no fixed expiry while preserving recurring 90-day review. **Decisions:** D-4, D-5, D-16. **Low fidelity:** `04-delegation-setup.md`, Screen 22. **Flow/tests:** UF-07; AT-011.

## Audience, entry, and context

Audience is the verified owner who selected `Until revoked`. Context repeats `Harbor Circle`, `Dad`, `Riley Chen`, and selected scopes. Before authorization reveal none. After authorization state: no fixed expiry; a 90-day review recurs; review due does not automatically renew, extend, suspend, revoke, or notify externally; the owner may modify, suspend, or revoke.

## Actions and states

**Primary:** `Confirm until revoked`. **Secondary:** `Choose a date`, `Cancel`. Loading clears previous delegation data. No empty state applies. Explicit confirmation is required. Schedule, stale draft, authority, and system errors create no grant. Denial is neutral. Success advances to the final recorded delegation result. Dirty cancel uses `Discard delegation draft?`, with safe action first and focused.

## Accessibility, privacy, and lifecycle

**Neutral denied state:** `Information unavailable`, without recipient, representative, scope, or review metadata. **Screen-reader semantics:** expose the explicit-consent control, consequence summary, confirmation, error summary, and completion status programmatically.

Use warning text rather than color alone, link choice and consequence programmatically, announce confirmation/result, and show verified focus. At narrow and calibrated 200%, summary/actions stack and complete text remains visible. Consent is owner-specific, recorded, revocable, and recipient-scoped; it grants no ownership/legal/Circle-wide authority. Clear context and discard stale responses. Excludes external reminders and automatic access changes. Runtime consent evidence, scheduler behavior, authorization, audit, focus, and stale-response protection remain implementation-only.
