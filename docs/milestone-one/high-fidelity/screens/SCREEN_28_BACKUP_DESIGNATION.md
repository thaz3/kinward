# Screen 28 — Backup designation

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Designate a dormant Backup Circle Administrator with zero current authority. **Decisions:** D-6, D-7, D-15. **Low fidelity:** `06-minor-backup-and-continuity.md`, Screen 28. **Flow/tests:** UF-10; AT-018.

## Audience, entry, and context

Audience is an authorized Circle Head. Entry is from Circle settings. Context is `Circle — Harbor Circle`; `Care Recipient — Circle-wide`. Before authorization show no Circle, adults, backup status, or current designation. After authorization show eligible verified adults, `Dormant — no current permissions`, and the fixed future activation boundary.

## Actions and states

**Primary:** `Review designation`; confirmation `Designate backup`. **Secondary:** `Cancel`. Loading uses anonymous choices. Empty says no eligible adult is available without exposing hidden membership. Self/duplicate/ineligible/stale/system errors grant nothing. Denial is neutral. Confirmation names the adult and repeats zero authority; success records only the dormant designation. Dirty cancel asks to discard changes with `Keep editing` focused.

**Neutral denied state:** `Information unavailable`, without Circle, adult, designation, or eligibility details. **Screen-reader semantics:** expose the adult group, dormant status, zero-authority consequence, confirmation, error summary, and result programmatically.

## Accessibility, privacy, and lifecycle

Use a labeled adult group, full-text dormant status plus icon/shape, consequence summary, announced result, and verified focus. At narrow and calibrated 200%, long identities and actions stack with 48 px targets. Designation creates no Circle Head, medical, recipient, management, delegation, succession, self-activation, or legal authority. Per-field audit filtering and Circle isolation apply. Clear context and reject stale writes. Excludes automatic activation/recovery and medical/uploads. Runtime eligibility, authorization, audit, focus, and concurrency remain implementation-only.
