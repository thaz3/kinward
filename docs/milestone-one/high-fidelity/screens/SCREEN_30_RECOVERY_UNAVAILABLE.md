# Screen 30 — Recovery unavailable

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Give the terminal Milestone One outcome when backup activation cannot be authorized. **Decisions:** D-6, D-7, D-15. **Low fidelity:** `06-minor-backup-and-continuity.md`, Screen 30. **Flow/tests:** UF-18, UF-22; AT-033, AT-042, AT-044.

## Audience, entry, and context

Audience is the verified backup/requester, with details masked or omitted by field authorization. Entry follows Screen 29 failure. Active Circle and recipient context are omitted unless independently authorized. Before authorization show only a neutral shell. After authorization state `This request cannot currently be completed`, `No authority was granted`, and a safe next step without exposing missing approvers or hidden reasons.

## Actions and states

**Primary safe action:** `Return to My Kinward`. There is no alternate recovery, retry-to-escalate, destructive action, or empty state. Loading is a brief non-identifying status. System error preserves the same zero-authority boundary. Denial and terminal completion are neutral and non-leaking. Focus moves to the outcome then the safe action in reading order.

**Secondary action:** none. **Neutral denied state:** the terminal completion itself is the neutral, non-leaking state; it exposes no missing approver, Circle, designation, or hidden reason. **Screen-reader semantics:** expose the outcome heading and message as a named status region without repeated announcement.

## Accessibility, privacy, and lifecycle

Use a status heading, plain outcome text, icon plus text, live announcement once, and verified focus. At narrow and calibrated 200%, the full message wraps and action remains 48 px. Screen 30 grants zero authority; the last-head block remains; backup remains dormant; no succession or identity details leak. Clear all prior protected state and discard late activation responses. Excludes support impersonation, alternate recovery, medical features, and uploads. Runtime terminal-state authorization, audit filtering, focus, and stale-response disposal remain implementation-only.
