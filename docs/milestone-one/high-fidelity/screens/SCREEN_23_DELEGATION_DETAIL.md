# Screen 23 — Delegation detail

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Review the representative, exact scope, dates, status, and lifecycle actions. **Decisions:** D-3–D-5, D-16. **Low fidelity:** `05-delegation-lifecycle.md`, Screen 23. **Flow/tests:** UF-07, UF-08; AT-008–AT-013.

## Audience, entry, and context

Audience is the owner and the representative only within their grant-scoped visibility. Context is `Circle — Harbor Circle`; `Care Recipient — Dad`. Before authorization reveal no grant existence, actor, dates, status, scopes, or review state. After authorization show only permitted representative identity, included scopes, start/end or until-revoked choice, next review, status, audit note, and lifecycle actions.

## Actions and states

**Primary when due:** `Review access`; otherwise no competing primary write. **Secondary:** `Modify access`, `Suspend access`; **destructive:** `Revoke access`. Loading uses anonymous rows after context clear. Empty/no active grant becomes a generic unavailable result, not a revealing count. Errors retain only safe authorized data. Denial is neutral. Success updates status and focuses the outcome. Destructive actions route to Screens 25–26 and restore focus to their initiators on return.

**Neutral denied state:** `Information unavailable`; it reveals no grant existence, representative, scope, dates, status, or review metadata.

## Accessibility, privacy, and lifecycle

Use a definition list, full-text status plus icon/shape, semantic scope list, ordered lifecycle actions, and verified focus. At narrow and calibrated 200%, metadata, long identities, and actions stack without horizontal scroll. Visibility is per grant, row, and field; recipient access does not expose unrelated grants, and Circle authority alone is insufficient. Review-due state is shared with Screens 3 and 24 and clears only after a successful authorized decision. Clear and discard stale context. Excludes legal authority, medical advice, and uploads. Runtime filtering, shared-state synchronization, auditing, focus, and race protection remain implementation-only.
