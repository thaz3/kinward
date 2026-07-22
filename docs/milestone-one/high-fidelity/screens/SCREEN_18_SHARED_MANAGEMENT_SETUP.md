# Screen 18 — Shared Management setup

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Let the owner grant discrete management scopes while retaining sole ownership. **Primary implementation slice:** Slice 9. **Governing milestone decision:** 3. **Low fidelity:** `03-roles-and-management-modes.md`, Screen 18. **Flow/tests:** UF-07; AT-007 and S9-01, S9-03–S9-08.

## Audience, entry, and context

Audience is the verified adult Care Recipient owner with recent authentication. Context is `Circle — Harbor Circle`; `Care Recipient — Dad`. Before authorization show no eligible adults, scopes, roles, or recipient identity. After authorization show only eligible authorized Circle adults, the exact `Manage roles` and `Review permissions` scope choices, lifecycle explanation, and existing shared managers visible to this owner. `Change ownership` is never grantable.

## Actions and states

**Primary:** `Review shared access`. **Secondary:** `Add another adult`, `Cancel`. Loading uses anonymous safe placeholders after clearing context. Empty says `No shared managers yet` and offers an allowed next step. Validation requires an adult and at least one scope. Inactive, conflict, stale authority, and system errors focus a summary and grant nothing. Denial is neutral. Confirmation names adult, Dad, scopes, and revocability; success announces recorded access. Dirty cancel asks to discard changes with `Keep editing` default.

**Neutral denied state:** `Information unavailable`; it omits eligible adults, existing managers, scopes, recipient identity, and counts.

## Accessibility, privacy, and lifecycle

Use labeled adult and checkbox groups, complete scope text, selection counts in words, semantic summaries, and verified focus. At narrow and calibrated 200%, cards and actions stack, long identities wrap, and all targets remain 48 px. Shared managers do not become owners, Circle Heads, delegates, legal representatives, or gain unspecified scopes. Selected and all-current choices persist explicit current scope rows; neither creates a wildcard or future automatic scope. Access is explicit, recorded, revocable, and audit-filtered. Clear and discard stale context. Excludes automatic spouse/family access, medical interpretation, and uploads. Runtime auth, authorization, atomic writes, audit, focus, and stale-response handling remain implementation-only.
