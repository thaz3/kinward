# Screen 24 — Delegation access review due

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Primary implementation slice:** Slice 10. **Governing milestone decision:** 6; D-16 review-due behavior. **Viewport:** 390 × 844 mobile. **Source:** `05-delegation-lifecycle.md`, Screen 24. **Flow:** UF-23. **Tests:** AT-011, AT-036.

## Composition

Context header: `Circle — Harbor Circle`, `Care Recipient — Dad`. Heading `Review Riley’s access`. Gold review panel reads `Access review due · July 16`; active-scope card lists `Manage roles` and `Review permissions`; plain copy states `Access remains active while you decide. Viewing this page changes nothing.` Primary `Keep access` (the same continue decision described by UF-23). A separate `Other access decisions` section holds explicit target-sized secondary `Modify access`, `Suspend access`, and destructive-outline `Revoke access` controls.

**State labels:** Access review due; Active. **Primary action:** Keep access / continue access.

**Accessibility annotations:** One dominant action; scope list is semantic; due announcement occurs once; actions name their consequence; focus goes to outcome after success; cancel/failed writes retain the due state; no email, SMS, push, or automatic lifecycle implication.
