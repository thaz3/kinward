# Screen 6 — Invite an adult member

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Create a verified-email-bound adult invitation with explicit Circle-wide and Care Recipient-specific scope boundaries.

**Entry conditions:** An authorized inviter opens the action from members or roles. **Audience:** Circle Head or another adult with explicit invitation and assignment authority. **Context:** `Circle — Harbor Circle`; `Care Recipient — Circle-wide` while recipient-specific role choices name their exact recipient.

## Visible information and actions

Persistent `Invitation recipient — verified email address` label with `jordan@example.test`; seven-day notice `This invitation expires seven days after it is sent`; Circle-wide role group with `Family Coordinator`; separate recipient-specific group with `Dad · Care Lead`; and an adjacent access preview. The preview states:

- `Circle membership and Circle-wide access offered: Family Coordinator for Harbor Circle`;
- `Care Recipient access offered: Dad — Care Lead only`;
- `Not included: access to any other Care Recipient, ownership, management, delegation, or medical information not included in the Dad Care Lead role`;
- `Family relationship alone grants no authority`; and
- `No access begins before the matching verified-email adult accepts`.

**Primary:** `Review invitation`, which opens a complete review before any send action. **Secondary:** `Cancel`.

## States and behavior

- **Loading:** `Checking permitted role choices…`; no unauthorized recipient names render before authorization.
- **Empty:** This batch does not present or test a membership-only invitation. The unresolved no-assignment branch is excluded under GOV-005; only invitation configurations already supported by governing sources are shown.
- **Error:** Blank/invalid email, duplicate, stale role, and safe delivery errors retain authorized input without revealing account existence.
- **Denied/unauthorized:** Generic `This action is unavailable`; no names, roles, or recipient counts.
- **Destructive confirmation:** None on this review step.
- **Focus:** Email field on entry; summary after error; review summary after successful validation.

## Responsive and accessibility requirements

Role groups use labeled checkboxes/cards, not color alone. At enlarged text, recipient names and role descriptions wrap, groups stack, and actions remain visible below content without horizontal scrolling.

## Permission and privacy constraints

Verified email only. Server-filter role choices. Circle-wide Family Coordinator grants no Dad, Mom, or other Care Recipient access. The Dad-specific Care Lead offer is separately listed and requires exact-recipient assignment authority. No unlisted recipient is implied. Relationship creates no access.

## Traceability and exclusions

**Low-fidelity:** `01-identity-and-circle.md`, Screen 6. **Canonical flow:** UF-04. **Tests:** AT-014–AT-016, AT-030. **Traceability:** GOV-004 records and corrects the former Screen 6 → UF-03 index mapping. **Unresolved exclusion:** GOV-005 and `DEFERRED_BACKLOG.md` record the membership-only invitation path; this batch neither approves nor rejects it and shows only supported assigned-scope configurations. Excludes phone/SMS invitation, hidden roles, documents, medical access, and automatic authority.
