# Screen 10 — Pending Care Recipient ownership

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Show an authorized proposer the inactive ownership proposal without implying an active Care Recipient record.

**Entry conditions:** Screen 8 successfully creates the pending shell and dedicated invitation. **Audience:** Authorized Circle administrator/proposer. **Context:** `Circle — Harbor Circle`; `Care Recipient — Pending “Dad”`, explicitly inactive.

## Visible information and actions

Clock plus `Awaiting decision`; masked proposed-owner email; sent/expiry information; `Private record — Inactive`; boundary copy `No private information can be added before acceptance`. **Primary:** `Resend ownership invitation`. **Secondary:** `Back to Circle`. **Destructive:** `Cancel proposal`.

## States and behavior

- **Loading:** `Loading proposal status…`; no private record query or placeholder.
- **Empty:** If no pending shell is authorized, show generic unavailable rather than a revealing empty result.
- **Error:** Safe resend/cancel failure; retain authorized masked metadata; no duplicate shell or invitation.
- **Denied/unauthorized:** No proposal label, owner, dates, Circle, count, or reason; offer safe return.
- **Destructive confirmation:** `Cancel this ownership proposal?` states that cancellation invalidates the ownership invitation and creates no Care Recipient, ownership, authority, or membership. Safe `Keep proposal` is first, visually primary, and initially focused; destructive `Cancel proposal` is second.
- **Focus:** Pending status after load/update; confirmation starts on `Keep proposal`, closing restores focus to the initiating `Cancel proposal`, and a cancelled result focuses the generic outcome.

## Responsive and accessibility requirements

Metadata becomes stacked label/value rows at enlarged text. Status uses clock and full wording; controls stack and remain 48 px; pending label is never truncated.

## Permission and privacy constraints

No active Care Recipient, private data, owner permission, membership, management mode, delegation, or medical access exists before acceptance. Relationship and Circle administration do not create recipient authority.

## Traceability and exclusions

**Low-fidelity:** `02-care-recipient-ownership.md`, Screen 10. **Canonical flow:** UF-03. **Tests:** AT-027, AT-028, AT-029. **Traceability:** GOV-004 records and corrects the former Screen 10 → UF-04 index mapping. Excludes private record entry, automatic activation, ordinary second invitation, phone identity, and medical/document features.
