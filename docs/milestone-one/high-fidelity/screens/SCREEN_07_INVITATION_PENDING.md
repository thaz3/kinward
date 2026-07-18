# Screen 7 — Pending invitation

> **Draft high-fidelity expansion — not product-owner approved and not approved for implementation.**

**Purpose:** Let an authorized inviter review the safe lifecycle and proposed scopes of a pending invitation.

**Entry conditions:** Screen 6 succeeds or an authorized member opens a pending invitation row. **Audience:** Adults authorized to view/manage that Circle invitation. **Context:** `Circle — Harbor Circle`; `Care Recipient — Circle-wide` unless a displayed proposed scope names an authorized recipient.

## Visible information and actions

Masked email `j•••@example.test`; clock plus `Pending`; `Created — July 16, 2026`; `Expires — July 23, 2026`; offered access summary `Harbor Circle — Family Coordinator · Circle-wide`; explicit `No Care Recipient access offered` and `No active authority before acceptance`. **Primary:** `Resend invitation` creates a new invitation under the approved lifecycle. **Secondary:** `Back to members`. **Destructive:** `Cancel invitation`.

## States and behavior

- **Loading:** `Loading invitation status…`; no hidden recipient labels.
- **Empty:** If no pending invitation remains, show `This invitation is no longer pending` without exposing its outcome to an unauthorized viewer.
- **Error:** Generic resend/cancel failure such as `We could not update this invitation. Try again.` Retain only metadata the current authorized viewer may already see; never expose account existence, delivery details, hidden recipients, or protected reasons. Retry is idempotent and does not duplicate membership.
- **Denied/unauthorized:** `This invitation is unavailable`; no email, Circle, role, state, or reason.
- **Destructive confirmation:** `Cancel this invitation?` names only the masked email and authorized offered scope, states `The invitation link will stop working and no membership or authority will be created`, offers safe `Keep invitation` first and destructive `Cancel invitation` second.
- **Focus:** Status heading after updates; the confirmation initially focuses the visually primary `Keep invitation` action with the verified ring; closing restores focus to the initiating `Cancel invitation`; outcome focuses safe status.

## Responsive and accessibility requirements

Definition rows stack at enlarged text. Status uses clock plus full text. All actions are 48 px; destructive styling is outlined red; dates and role labels wrap without truncation.

## Permission and privacy constraints

Pending creates no membership or access. Resend uses a new invitation; cancelled, declined, expired, mismatched, or used links never grant access.

## Traceability and exclusions

**Low-fidelity:** `01-identity-and-circle.md`, Screen 7. **Canonical flows:** UF-04 and UF-05. **Tests:** AT-015, AT-016. **Traceability:** GOV-004 records and corrects the former Screen 7 → UF-03 index mapping. Excludes delivery-channel promises, SMS, recipient access, and automatic role activation before acceptance.
