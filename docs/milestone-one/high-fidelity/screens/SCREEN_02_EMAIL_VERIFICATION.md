# Screen 2 — Email verification

> **Draft high-fidelity expansion — not product-owner approved and not approved for implementation.**

**Purpose:** Verify the only Milestone One adult identity channel without exposing Circle information.

**Entry conditions:** The adult submitted a verified email address on Screen 1 or followed an identity-bound invitation link. **Audience:** The authenticating adult only. **Context:** Public identity shell; no active Circle or Care Recipient.

## Visible information and actions

Show `Verify your email`, masked synthetic address `a•••@example.test`, persistent `Verification code` label, a grouped code field, and `Waiting for verification` with a clock icon. **Primary:** `Verify email`. **Secondary:** `Resend code`; `Change email`.

## States and behavior

- **Loading:** `Checking verification…`; stable layout; no Circle labels or counts.
- **Empty:** Blank code keeps `Verify email` unavailable with visible reason `Enter the code from your email`.
- **Error:** Generic invalid or expired-code message; retain the masked email and safe code input; do not reveal account or invitation existence.
- **Denied/unauthorized:** Wrong or mismatched identity returns `This verification link is unavailable` and a safe return to Screen 1.
- **Destructive confirmation:** None.
- **Focus:** Initial focus on the named code group; submission error focuses the error summary; success moves to the first authorized Screen 3 heading.

## Responsive and accessibility requirements

At enlarged text and narrow widths, code fields remain one named group, actions stack, labels persist, and content scrolls vertically without horizontal scrolling. Support paste, clear status announcements, 48 px targets, 3 px violet focus plus 2 px white separation, and no timer-only instruction.

## Permission and privacy constraints

Verified email is the sole Milestone One identity channel. No phone, SMS, social login, Circle, Care Recipient, invitation role, or protected metadata appears before successful verification.

## Traceability and exclusions

**Low-fidelity:** `01-identity-and-circle.md`, Screen 2. **Flow:** UF-01. **Tests:** AT-014, AT-028, AT-030. Excludes phone OTP/recovery, SMS delivery, Circle access, medical information, and implementation behavior beyond the documented presentation contract.
