# Screen 20 — Delegation scope selection

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Select the representative’s exact, bounded capabilities. **Decisions:** D-3, D-4, D-5. **Low fidelity:** `04-delegation-setup.md`, Screen 20. **Flow/tests:** UF-07; AT-008.

## Audience, entry, and context

Audience is the verified owner continuing Screen 19. Context repeats `Circle — Harbor Circle`, `Care Recipient — Dad`, and representative `Riley Chen`. Before authorization reveal none. After authorization show the approved scope catalog, included/excluded meaning, and that on-behalf-of actions are audited.

## Actions and states

**Primary:** `Continue to duration`, disabled with explanatory text until at least one scope is selected. **Secondary:** `Back`, `Cancel`. Loading clears prior catalog. There is no ordinary empty selection; an unavailable catalog is a system state. Validation links to the scope group. Catalog change, stale draft, authority loss, and system errors grant nothing. Denial is neutral. Unsaved cancel uses `Discard delegation draft?`; completion goes to Screen 21 without activating access.

**Success/completion state:** the authorized exact scope selection advances to Screen 21; unselected scopes remain denied and no delegation is active.

## Accessibility, privacy, and lifecycle

Use native checkbox semantics, a named group, complete scope descriptions, selected count in text, visible disabled reason, and focus on error summary or changed group. Narrow and calibrated 200% evidence stacks long cards/actions with complete labels and 48 px targets. Unselected scopes remain denied; no wildcard, inferred, ownership, legal, Circle-wide, or unrelated-recipient authority results. Clear protected context before reload and reject stale catalogs/responses. Excludes medical interpretation and uploads. Runtime catalog/version authorization, draft persistence, audit linkage, focus, and stale-response handling remain implementation-only.
