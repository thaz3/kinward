# Screen 19 — Delegated Management setup

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Start an explicit, recorded delegation without transferring ownership. **Decisions:** D-3, D-4, D-5, D-16. **Low fidelity:** `04-delegation-setup.md`, Screen 19. **Flow/tests:** UF-07; AT-008–AT-013.

## Audience, entry, and context

Audience is the verified adult Care Recipient owner with recent authentication. Context is `Circle — Harbor Circle`; `Care Recipient — Dad`. Before authorization show no recipient, candidate, scope, or delegation status. After authorization show eligible representative choices, the non-legal-authority disclaimer, steps for representative, scope, and duration, plus revocation and audit consequences.

## Actions and states

**Primary:** `Continue to scope`. **Secondary:** `Cancel`. Loading clears former protected context. Empty says no eligible representative is available without exposing hidden adults. Validation requires one eligible adult. Inactive recipient, dispute, stale authority, and system errors grant nothing. Denial is neutral. Unsaved cancel uses `Discard delegation draft?` with `Keep editing` first and focused. Completion continues to Screen 20; no grant exists yet.

**Neutral denied state:** `Information unavailable`, with no recipient, candidate, or draft details. **Success/completion state:** a valid selection advances to Screen 20 and preserves only the authorized draft; it does not activate a delegation.

## Accessibility, privacy, and lifecycle

Use a semantic step list, labeled representative group, full disclaimer, selected mark plus text, error summary, and verified focus. At narrow and calibrated 200%, steps, identity, explanations, and controls stack with 48 px targets. A representative receives only later-confirmed scopes, never ownership, legal status, Circle Head authority, or cross-recipient access. Clear context before queries and discard stale results. Excludes automatic family authority, indefinite access without review, medical advice, and uploads. Runtime eligibility, recent-auth, draft isolation, audit creation, focus, and race protection remain implementation-only.
