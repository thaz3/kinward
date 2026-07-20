# Screen 15 — Circle-wide role assignment

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Assign an approved Circle-wide responsibility while preserving its exact boundary. **Decisions:** D-1, D-2, D-10, D-14. **Low fidelity:** `03-roles-and-management-modes.md`, Screen 15. **Flow/tests:** UF-05; AT-004, AT-017, AT-025.

## Audience, entry, and context

Audience is an adult with explicit assignment authority. Entry is from a permitted member row. Context is `Circle — Harbor Circle`; `Care Recipient — Circle-wide`; selected adult `Jordan Lee`. Before authorization reveal no Circle, adult, role, current state, or options. After authorization show the selected adult, role purpose, boundary, current state, and exact consequences.

## Actions and states

**Primary:** `Review assignment`; confirmation primary `Assign role`. **Secondary:** `Cancel`. Loading withholds identity and options. Empty says no assignable roles only after authorization. Validation requires one role; stale/self-expanding/last-head/system failures retain safe input and use an error summary. Denial is neutral. Success names only authorized changed values. Cancel after selection opens `Discard role changes?`; safe `Keep editing` is initially focused.

**Neutral denied state:** `Information unavailable`, without the adult, role, or attempted value. **Screen-reader semantics:** expose the form heading, error summary, role-group name, selection state, confirmation dialog, and result status programmatically.

## Accessibility, privacy, and lifecycle

Role choices are a labeled radio group with full definitions; selection uses mark, boundary, and text. Focus enters heading, error summary, confirmation safe action, or result and restores to the initiator on cancel. At narrow and 200%, roles and confirmation content expand vertically; actions stack and retain 48 px targets. Circle-wide role assignment never grants recipient ownership, medical access, management, delegation, or legal authority. Reauthorize every write and reject stale state. Last-active-Circle-Head protection remains enforced. Excludes inferred spouse/family authority and medical/document features. Runtime authorization, concurrency, audit fields, focus, and announcements remain implementation-only.
