# Screen 18 — Shared Management setup

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Let the owner grant discrete management scopes while retaining sole ownership. **Decisions:** D-2, D-3, D-16. **Low fidelity:** `03-roles-and-management-modes.md`, Screen 18. **Flow/tests:** UF-06; AT-007.

## Audience, entry, and context

Audience is the verified adult Care Recipient owner with recent authentication. Context is `Circle — Harbor Circle`; `Care Recipient — Dad`. Before authorization show no eligible adults, scopes, roles, or recipient identity. After authorization show only eligible authorized Circle adults, discrete scope choices, lifecycle explanation, and existing shared managers visible to this owner.

## Actions and states

**Primary:** `Review shared access`. **Secondary:** `Add another adult`, `Cancel`. Loading uses anonymous safe placeholders after clearing context. Empty says `No shared managers yet` and offers an allowed next step. Validation requires an adult and at least one scope. Inactive, conflict, stale authority, and system errors focus a summary and grant nothing. Denial is neutral. Confirmation names adult, Dad, scopes, and revocability; success announces recorded access. Dirty cancel asks to discard changes with `Keep editing` default.

**Neutral denied state:** `Information unavailable`; it omits eligible adults, existing managers, scopes, recipient identity, and counts.

## Accessibility, privacy, and lifecycle

Use labeled adult and checkbox groups, complete scope text, selection counts in words, semantic summaries, and verified focus. At narrow and calibrated 200%, cards and actions stack, long identities wrap, and all targets remain 48 px. Shared managers do not become owners, Circle Heads, delegates, legal representatives, or gain unspecified scopes. Access is explicit, recorded, revocable, audit-filtered, and subject to recurring review where governing rules apply. Clear and discard stale context. Excludes automatic spouse/family access, medical interpretation, and uploads. Runtime auth, authorization, atomic writes, audit/review scheduling, focus, and stale-response handling remain implementation-only.
