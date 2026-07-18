# Screen 26 — Revoke delegation

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Permanently end a delegation while preserving authorized audit history. **Decisions:** D-4, D-5. **Low fidelity:** `05-delegation-lifecycle.md`, Screen 26. **Flow/tests:** UF-08; AT-013.

## Audience, entry, and context

Audience is the verified owner with recent authentication. Context is `Harbor Circle`, `Dad`, representative `Riley Chen`, shown only after authorization. Before authorization disclose no grant, actor, dates, or scopes. After authorization show irreversibility, immediate permission removal, preserved history, and the authorized grant summary.

## Actions and states

**Safe/default:** `Keep access`, initially focused. **Destructive:** `Revoke access`, clearly outlined/labeled. Loading clears prior protected content. No empty state applies. Stale/already-revoked, recent-auth, and system errors leave state unchanged and focus an error summary. Denial is neutral. Success says `Access revoked`, focuses the outcome, and offers safe return; no undo is implied. Closing restores focus to the initiating revoke control.

**Primary safe action:** `Keep access`. **Secondary action:** none; `Revoke access` is the separate destructive action. **Neutral denied state:** `Information unavailable`, without grant, actor, scope, or attempted-value details.

## Accessibility, privacy, and lifecycle

Use alert-dialog semantics, consequence list, text plus destructive styling, announced outcome, and verified focus. At narrow and calibrated 200%, actions stack with complete labels and 48 px targets. Revocation changes only this grant for Dad, creates no replacement authority, preserves filtered audit evidence, and does not expose unrelated grants. Clear context and dispose of late responses. Excludes automatic recreation, legal determinations, medical features, and uploads. Runtime recent-auth, atomic revocation, audit, focus restoration, and stale-response protection remain implementation-only.
