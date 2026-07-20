# Screen 36 — Loading states

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Show bounded progress without exposing protected content or implying continuous monitoring. **Decisions:** D-1–D-3, D-14. **Low fidelity:** `07-audit-and-system-states.md`, Screen 36. **Flow/tests:** All applicable; AT-001–AT-030.

## Audience, entry, and context

Audience varies. The public shell or independently authorized context may remain; protected labels, counts, identities, metadata, and content do not appear before the matching authorization envelope. After authorization, loading may preserve only safe already-authorized context.

## Actions and states

Loading uses `Loading…` or a page-specific safe label, anonymous skeleton shapes, and `Cancel`/`Back` only when safe. It is distinct from empty, error, denial, and success. A system error replaces progress with a safe retry. A denied response clears the loading shell before neutral denial. Context clearing shows a neutral reset, and stale success/error is disposed without repaint. No destructive confirmation applies; abandoning a dirty draft uses the governing screen’s discard pattern.

**Primary action:** none in the shared loading pattern. **Secondary actions:** `Cancel` or `Back` only when independently safe and authorized. **Screen-reader semantics:** expose the region as busy, announce one concise status, keep skeletons decorative, and remove the busy state before announcing success, error, empty, or neutral denial.

## Accessibility, privacy, and lifecycle

Use `aria-busy`, one polite status announcement, reduced-motion behavior, no spinner-only meaning, and stable logical focus. At narrow and calibrated 200%, labels wrap, safe actions remain 48 px, and no horizontal movement is required. Loading never implies Kinward, a caregiver, or clinician is continuously monitoring or has seen an entry. Clear protected context before new queries. Excludes medical monitoring and background-status claims. Runtime timing, announcements, cancellation, authorization envelope, and stale-response disposal require implementation testing.
