# Screen 25 — Suspend delegation

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Temporarily remove delegated permissions while preserving history. **Decisions:** D-4, D-5. **Low fidelity:** `05-delegation-lifecycle.md`, Screen 25. **Flow/tests:** UF-08; AT-012.

## Audience, entry, and context

Audience is the verified owner with recent authentication. Context is `Harbor Circle`, `Dad`, representative `Riley Chen`, only after authorization. Before authorization reveal no grant or identity. After authorization show immediate effect, preserved history, representative/scopes, and a persistent optional-or-required reason exactly as governed; the interface must not invent a reason.

## Actions and states

**Primary deliberate action:** `Suspend access`; **secondary:** `Keep access`. Loading clears protected detail. No empty state applies. Validation, stale/already-ended grant, recent-auth, and system errors preserve active state and focus an error summary. Denial is neutral. Confirmation names the authorized consequence and uses full text, not color alone. Success says `Access suspended`, focuses the result, and offers safe return. Closing restores focus to the initiating suspend control.

**Neutral denied state:** `Information unavailable`; it omits grant existence, representative, scopes, attempted reason, and denial reason.

## Accessibility, privacy, and lifecycle

Use semantic confirmation, persistent reason label, announced consequence/result, and 3 px Violet focus with white separation. At narrow and calibrated 200%, text and actions stack with 48 px targets. Suspension grants nothing new, does not transfer ownership, and preserves audit history with per-field filtering. Clear context before writes and discard late success/error after a switch. Excludes automatic reactivation, medical features, and uploads. Runtime recent-auth, atomic permission removal, audit, notifications policy, focus, and stale-response handling remain implementation-only.
