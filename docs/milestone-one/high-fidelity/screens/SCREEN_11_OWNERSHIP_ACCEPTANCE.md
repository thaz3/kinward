# Screen 11 — Ownership acceptance

> **Draft pending final package audit — not approved for implementation.**

**Purpose:** Record the invited adult’s explicit consent and activate their sole ownership. **Decisions:** D-8, D-9, D-12. **Low fidelity:** `02-care-recipient-ownership.md`, Screen 11. **Flow/tests:** UF-03; AT-027, AT-030.

## Audience, entry, and context

Authorized audience is the adult whose verified email matches the dedicated ownership invitation. Entry requires a valid, unused invitation and recent verified-email identity. Active context is `Circle — Harbor Circle`; the Care Recipient is an inactive proposal until success. Before authorization, show only the public identity shell and a neutral unavailable message. After authorization, show the Circle, proposer, sole-owner effect, membership effect, permissions, and consent consequences.

## Actions and states

**Primary:** `Accept ownership`. **Secondary:** `Back`. Loading says `Checking invitation…` without Circle or recipient data. There is no applicable empty state. Validation requires the explicit consent control. System error retains the authorized summary without duplicate acceptance. Invalid, expired, used, revoked, mismatched, or denied invitations use a neutral result with no identifiers. Success says `Ownership accepted` and only then establishes the adult as sole owner and Circle member. Leaving after changing consent opens an unsaved-changes prompt; `Keep reviewing` is default and `Discard response` is deliberate.

## Accessibility, privacy, and lifecycle

Focus enters the heading, moves to the error summary or success heading, and returns to the initiating control when a prompt closes. At narrow widths actions stack. Calibrated 200% evidence uses 56/44/36/32 px roles, complete wrapping, and 48 px minimum targets. Use a semantic form, named consent group, persistent labels, announced status, and explicit button names. Deny by default; no relationship, marriage, caregiving, or Circle role creates ownership. Discard stale responses after identity, Circle, or invitation context changes. Excludes private-data entry, joint ownership, automatic acceptance, phone identity, medical features, and uploads. Runtime identity binding, authorization, idempotency, audit creation, focus, reflow, and stale-response disposal require implementation testing.
