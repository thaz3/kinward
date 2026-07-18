# Screen 4 — Create a Family Circle

> **Draft high-fidelity expansion — not product-owner approved and not approved for implementation.**

**Purpose:** Let an authenticated adult create a Circle and become its first Circle Head without implying Care Recipient authority.

**Entry conditions:** Verified adult chooses `Create a Circle` from Screen 3. **Audience:** Authenticated adult. **Context:** Account-level until creation; context preview reads `New Circle · Not created` and no Care Recipient.

## Visible information and actions

Persistent `Circle name` label with synthetic value `Harbor Circle`; information panel: `You become the first Circle Head. This grants no Care Recipient access.` **Primary:** `Create Circle`. **Secondary:** `Cancel`.

## States and behavior

- **Loading:** `Creating Circle…`; retain the entered name; prevent repeat submission.
- **Empty:** Blank name receives inline guidance and an error summary after submission.
- **Error:** Safe retry preserves the non-sensitive name and must not duplicate creation.
- **Denied/unauthorized:** Expired authentication requests sign-in without exposing other account information.
- **Unsaved-input confirmation:** `Cancel` with no entered or modified data leaves directly. After a Circle name is entered or any setting changes, `Cancel` opens `Discard this unsubmitted Circle?` with `The Circle name and any settings you entered will be lost. No Circle has been created.` The safe `Keep editing` action is first, visually primary, and initially focused; `Discard draft` is the deliberate discard action. This is not deletion of data from Kinward.
- **Focus:** Page heading on entry; invalid submission focuses the error summary; the confirmation initially focuses `Keep editing`; closing it returns focus to `Cancel`; success focuses the new Circle heading.

## Responsive and accessibility requirements

The single-column form grows vertically; labels persist; boundary copy remains adjacent to the action; buttons stack at enlarged text and remain at least 48 px. The unsaved-input confirmation wraps its complete title, consequence, and action names at 200% without horizontal scrolling.

## Permission and privacy constraints

Creation grants Circle membership and Circle Head only. It creates no Care Recipient, ownership, management, delegation, medical, or relationship-based authority.

## Traceability and exclusions

**Low-fidelity:** `01-identity-and-circle.md`, Screen 4. **Flow:** UF-01. **Tests:** AT-001, AT-025. **Traceability:** GOV-004 corrects the former Screen 4 → UF-02 index mapping without changing behavior. Excludes Care Recipient creation, medical access, automatic family roles, and application/database implementation.
