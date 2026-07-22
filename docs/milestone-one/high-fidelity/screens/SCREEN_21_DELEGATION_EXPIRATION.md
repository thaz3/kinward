# Screen 21 — Delegation expiration selection

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Choose a bounded duration or explicitly continue to the governed until-revoked choice. **Primary implementation slice:** Slice 10. **Governing milestone decision:** 6; D-16 review-due behavior. **Low fidelity:** `04-delegation-setup.md`, Screen 21. **Flow/tests:** UF-08–UF-09; AT-009, AT-010.

## Audience, entry, and context

Audience is the verified owner continuing the same `Pending` delegation from Screen 20. Context is `Harbor Circle`, `Dad`, representative `Riley Chen`. No context or dates appear before authorization. After authorization show suggested 90 days, custom date with format/help, and `Until revoked` with its recurring-review consequence.

## Actions and states

**Primary:** `Review delegation`, or `Continue` to Screen 22 for Until revoked. **Secondary:** `Back`, `Cancel`. Loading withholds prior dates. Validation requires one choice and rejects past/invalid dates. Schedule, stale-pending-grant, authority, and system errors grant nothing. Denial is neutral. Success of this step only saves the duration choice; access is not active. Dirty cancel confirms discard with safe `Keep editing` focused.

## Accessibility, privacy, and lifecycle

**Empty state:** not applicable; an unavailable duration catalog is a system error. **Neutral denied state:** `Information unavailable`, without draft, recipient, representative, or date details. **Screen-reader semantics:** expose the duration radio group, persistent custom-date label/help/error, selected state, and result status programmatically.

Use a named radio group of full-row selection cards (not isolated glyphs or text alone), persistent custom-date label, announced format/error, text-linked consequences, and visible focus with the verified 3 px Violet 600 ring plus explicit 2 px White separation. Every duration option occupies a complete ≥48 px-high row target with boundary, label, explanatory text, selected/unselected treatment, and vertical growth at calibrated 200%. At narrow and calibrated 200%, options/actions stack, text wraps, and date controls grow with 48 px targets. No default silently selects duration; `Until revoked` continues to Screen 22 and does not mean permanent, unreviewed, or automatic renewal. Context changes clear dates and stale responses. Excludes automatic revocation on review due, medical features, and uploads. Runtime date parsing, timezone policy, authorization, review scheduling, focus, and stale-response disposal remain implementation-only.
