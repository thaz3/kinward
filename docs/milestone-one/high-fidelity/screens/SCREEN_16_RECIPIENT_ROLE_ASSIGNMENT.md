# Screen 16 — Care Recipient-specific role assignment

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Assign one approved role for exactly one Care Recipient. **Decisions:** D-1, D-2, D-3, D-10. **Low fidelity:** `03-roles-and-management-modes.md`, Screen 16. **Flow/tests:** UF-05; AT-002–AT-004, AT-017.

## Audience, entry, and context

Audience is the adult Care Recipient owner or an adult with an explicit matching management grant. Entry is from that recipient’s permissions. Context repeats `Circle — Harbor Circle`, `Care Recipient — Dad`, and adult `Jordan Lee`. Before authorization, disclose none of these identifiers. After authorization, show only assignable roles and their exact permitted actions for Dad.

## Actions and states

**Primary:** `Review role`; confirmation `Assign for Dad`. **Secondary:** `Cancel`. Loading clears prior recipient content first. Empty states that no roles are available only within the authorized envelope. Validation, catalog-change, stale authority, wrong-context, and system errors focus a summary and preserve only safe input. Denial is neutral and identifier-free. Success announces the scoped role. Dirty cancel uses `Discard changes?` with `Keep editing` default.

**Neutral denied state:** `Information unavailable`; it omits the Circle, Care Recipient, adult, role, attempted value, and denial reason unless each field is independently authorized.

## Accessibility, privacy, and lifecycle

Use semantic context, labeled selection controls, persistent labels, complete permission descriptions, visible selected marks, and verified focus treatment. At narrow and calibrated 200%, all cards and actions stack without horizontal scroll. Recipient scope never becomes Circle-wide, cross-recipient, ownership, delegation, or legal authority. Clear Dad content before switching and discard late Dad success/error responses. Per-field audit values are filtered. Excludes relationship inference, automatic access, medical interpretation, and uploads. Runtime authorization, race handling, audit filtering, focus, and reflow require implementation testing.
