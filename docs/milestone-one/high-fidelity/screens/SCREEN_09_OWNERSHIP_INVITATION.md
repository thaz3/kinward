# Screen 9 — Dedicated ownership invitation

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Explain the dedicated adult Care Recipient ownership proposal before the verified proposed owner accepts or declines.

**Entry conditions:** The proposed owner opens an active invitation while signed in with the matching verified email. **Audience:** Proposed adult owner only. **Context:** Invitation shell identifies `Harbor Circle`; pending label `Dad` is a synthetic proposed display label, not an active private record.

## Visible information and actions

`Email verified` status with check icon; `Avery proposed you as the sole owner of “Dad”`; Circle and proposer; right to decline; and a readable consequence list:

- `You become the sole owner of this Care Recipient profile. Avery does not remain an owner.`
- `You control who receives access and may manage or revoke access under Kinward’s approved permission model.`
- `Family relationship alone grants no authority.`
- `Your consent is required before private Care Recipient information becomes available. No private information is shown before acceptance.`
- `Acceptance activates sole ownership and any required Harbor Circle membership together. It does not use a second ordinary invitation.`

**Primary:** `Review and accept`. **Secondary:** `Decline` and `Return safely`. The screen never presents joint ownership.

## States and behavior

- **Loading:** Verify identity/token before showing Circle/proposal details; neutral `Checking invitation…` first.
- **Empty:** Not applicable for an active bound invitation.
- **Error:** Used, expired, cancelled, or mismatched invitation returns `This ownership invitation is unavailable` with no Circle, proposer, pending label, owner effect, or reason.
- **Denied/unauthorized:** Same neutral non-leaking unavailable component.
- **Destructive confirmation:** Decline routes to Screen 12; no decline occurs on this screen.
- **Focus:** Heading after safe authorization; unavailable heading on denial; return focus after cancelled review.

## Responsive and accessibility requirements

Consequence list remains complete at enlarged text; actions stack; no countdown pressure; status is icon plus text; headings and lists use a logical order.

## Permission and privacy constraints

Possession of the link creates no access. Acceptance requires matching verified email and creates sole ownership and any required Circle membership atomically later on Screen 11. The sender does not remain an owner. No second ordinary invitation and no access to another Care Recipient.

## Traceability and exclusions

**Low-fidelity:** `02-care-recipient-ownership.md`, Screen 9. **Canonical flow:** UF-03. **Tests:** AT-027–AT-030. **Traceability:** GOV-004 records and corrects the former Screen 9 → UF-04 index mapping. Excludes joint ownership, relationship authority, private data, medical access, phone identity, and automatic acceptance.
