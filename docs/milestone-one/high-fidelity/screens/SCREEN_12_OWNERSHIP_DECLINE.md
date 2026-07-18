# Screen 12 — Ownership decline

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Let the invited adult decline without activating a Care Recipient or Circle membership. **Decisions:** D-8, D-9. **Low fidelity:** `02-care-recipient-ownership.md`, Screen 12. **Flow/tests:** UF-03; AT-028.

## Audience, entry, and context

Audience is the verified adult bound to a valid dedicated invitation. Context is `Circle — Harbor Circle`; the proposal remains inactive. Before authorization, reveal no Circle, proposer, proposed recipient, or status. After authorization, explain that declining creates no active record, ownership, authority, or membership.

## Actions and states

**Primary safe action:** `Go back`. **Destructive confirmation:** `Decline invitation`, followed by `Decline ownership invitation?`; `Keep reviewing` is initially focused and `Decline invitation` is deliberate. Loading is `Checking invitation…`; no empty state applies. Expired, revoked, used, mismatched, denied, and stale invitations share a neutral non-leaking outcome. System failure retains the authorized decision screen. Success says `Invitation declined` with a safe return; it grants nothing. Closing the confirmation restores focus to `Decline invitation`.

**Secondary action:** none beyond the destructive decision and safe primary return. **Validation error:** not applicable because the confirmation presents no editable field; system errors use the failure behavior above.

## Accessibility, privacy, and lifecycle

At narrow and calibrated 200% layouts, consequence text wraps fully and controls stack with 48 px targets. Use heading, consequence list, dialog semantics, announced outcome, 3 px Violet 600 focus with 2 px white separation, and no color-only destruction cue. Deny by default; no private information may exist before acceptance. Clear authorized invitation context before any new query and discard late results. Excludes activation, ordinary membership invitation, alternate recovery, medical features, and uploads. Runtime binding, single-use invalidation, audit history, focus restoration, and stale-response protection remain implementation-only.
