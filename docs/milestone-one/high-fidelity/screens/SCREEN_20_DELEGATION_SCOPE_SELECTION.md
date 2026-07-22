# Screen 20 — Delegation scope selection

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Select the representative’s exact, bounded capabilities. **Primary implementation slice:** Slice 9. **Governing milestone decisions:** 3–5. **Low fidelity:** `04-delegation-setup.md`, Screen 20. **Flow/tests:** Slice 9 S9-02–S9-09; UF-08 and AT-008 complete in Slice 10.

## Audience, entry, and context

Audience is the verified owner continuing Screen 19. Context repeats `Circle — Harbor Circle`, `Care Recipient — Dad`, and representative `Riley Chen`. Before authorization reveal none. After authorization show the approved scope catalog—exactly `Manage roles` and `Review permissions`—included/excluded meaning, and that later active on-behalf-of actions are audited. `Change ownership` is shown only as invariantly unavailable where the approved design calls for that explanation.

## Actions and states

**Primary:** `Continue to duration`, disabled with explanatory text until at least one scope is selected. **Secondary:** `Back`, `Cancel`. Loading clears prior catalog. There is no ordinary empty selection; an unavailable catalog is a system state. Validation links to the scope group. Catalog change, stale draft, authority loss, and system errors grant nothing. Denial is neutral. Unsaved cancel uses `Discard delegation draft?`; completion goes to Screen 21 without activating access.

**Success/completion state:** the authorized exact scope selection is persisted as explicit versioned rows on one exact-recipient `Pending` delegation and advances to Screen 21. Unselected scopes remain denied; “all current” persists both current rows rather than a wildcard; no delegation is active and no effective permission exists.

## Accessibility, privacy, and lifecycle

Use native checkbox semantics, a named group, complete scope descriptions, selected count in text, visible disabled reason, and focus on error summary or changed group. Narrow and calibrated 200% evidence stacks long cards/actions with complete labels and 48 px targets. Unselected scopes remain denied; no wildcard, future automatic scope, ownership, legal, Circle-wide, or unrelated-recipient authority results. Clear protected context before reload and reject stale catalogs/responses. Excludes expiration, until-revoked choice, representative consent/acceptance, activation, lifecycle mutation, medical interpretation, and uploads. Runtime catalog/version authorization, pending persistence, audit linkage, focus, and stale-response handling remain implementation-only.
