# Screen 8 — Propose an adult Care Recipient

> **Draft high-fidelity expansion — not product-owner approved and not approved for implementation.**

**Purpose:** Start either self-addition or a dedicated adult sole-ownership proposal without creating private Care Recipient information.

**Entry conditions:** Authorized Circle administrator chooses `Add Care Recipient`. **Audience:** Circle Head or explicitly authorized proposer. **Context:** `Circle — Harbor Circle`; `Care Recipient — Circle-wide` because the recipient is not active.

## Visible information and actions

Labeled radio cards `Add myself` and selected `Propose another adult`; persistent `Owner verified email` with synthetic `r•••@example.test`; information alert `No private Care Recipient information may be entered before the owner accepts`; sole-owner explanation. **Primary:** `Send ownership invitation`. **Secondary:** `Cancel`.

## States and behavior

- **Loading:** `Checking proposal eligibility…`; no existing recipient details render.
- **Empty:** Missing choice/email receives grouped error guidance.
- **Error:** Duplicate proposal, identity mismatch, stale permission, or delivery failure remains generic and preserves only safe input.
- **Denied/unauthorized:** Generic unavailable state with no proposed owner or recipient existence clue.
- **Destructive confirmation:** None; proposal review precedes send.
- **Focus:** Radio legend on entry; summary after error; pending proposal heading after success.

## Responsive and accessibility requirements

Radio cards and their consequences stack and grow; persistent labels remain; masked email wraps safely; 48 px controls and visible focus are required.

## Permission and privacy constraints

The pending shell is inactive. No diagnosis, schedule, care, medical, ownership, management, permission, or relationship information is entered before acceptance. Circle Head status does not grant future private access.

## Traceability and exclusions

**Low-fidelity:** `02-care-recipient-ownership.md`, Screen 8. **Canonical flow:** UF-03. **Tests:** AT-027, AT-028, AT-030. **Traceability:** GOV-004 records and corrects the former Screen 8 → UF-04 index mapping. Excludes joint ownership, private fields, ordinary membership invitation duplication, phone identity, and medical workflows.
