# Screen 35 — Form error and recovery state

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Viewport:** 390 × 844 mobile. **Source:** `07-audit-and-system-states.md`, Screen 35. **Flow:** applicable approved form flow; no new flow. **Tests:** AT-003, AT-015, AT-029, AT-030.

## Composition

Context-safe example uses the adult invitation form: `Harbor Circle · Circle-wide`. Heading `Invite an adult`. The error summary visibly carries the standard 3 px violet ring and 2 px white separation and reads `Check the highlighted fields` with linked item `Email — enter a valid verified email address`. Email input retains synthetic value `jordan.example.test`; persistent label and inline error repeat recovery. Primary `Review invitation`; secondary `Cancel`. Generic operation alert includes a safe correlation reference only when useful.

**State label:** Error — input needs attention. **Primary action:** Review invitation.

**Accessibility/privacy annotations:** Summary receives focus after submit; link moves focus to the field; error is icon + text + border, not red alone; field keeps authorized input; retry does not duplicate creation or broaden a query; invalid/invitation errors reveal no Circle or account existence information.
