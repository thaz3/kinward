# Flow 01 — Identity and Circle

**Low-fidelity planning wireframe — not final interface design.**

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│ 1. Welcome               │  │ 2. Verify your email     │
│ Kinward                  │  │ We sent a link/code to   │
│ Private family planning  │  │ a•••@example.test        │
│                          │  │ [ Verification code    ] │
│ Verified email address   │  │ FOCUS → [ Verify email ] │
│ [                      ] │  │ [ Resend ] [Change email]│
│ FOCUS → [ Continue ]     │  │ No Circle details shown  │
│ Sign in / Create account │  │ Status: waiting          │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 3. My Kinward            │  │ 4. Create Family Circle  │
│ Signed in: a•••@…        │  │ Circle name              │
│ Pending invitation (1)   │  │ [ Harbor Circle        ] │
│ [ Review invitation ]    │  │ You become first Circle  │
│ Access review due        │  │ Head. This grants no Care│
│ Dad · Riley access       │  │ Recipient access.        │
│ Review is due; access is │  │ [ Create Circle ]        │
│ not changed automatically│  │ [ Cancel ]               │
│ FOCUS → [ Review access ]│  │                          │
│ Your Circles             │  │                          │
│ Harbor — Circle Head     │  │                          │
│ [ Open Harbor ]          │  │                          │
│ [ Create a Circle ]      │  │                          │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 5. Harbor Circle         │  │ 6. Invite adult          │
│ Context: Circle-wide     │  │ Harbor · Circle-wide     │
│ Members 3 · Pending 1    │  │ Verified email address   │
│ Care Recipients          │  │ [                      ] │
│ Dad [Open]  Mom [Open]   │  │ Circle-wide roles        │
│ [ Switch recipient ]     │  │ [ ] Family Coordinator   │
│ [ Members ] [ Roles ]    │  │ Recipient-specific roles │
│ [ Invite adult ]         │  │ [ ] Dad · Care Lead      │
│ [ Add Care Recipient ]   │  │ [ Review invitation ]    │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐
│ 7. Invitation pending    │
│ Harbor · Circle-wide     │
│ Email: j•••@example.test │
│ Status: Pending          │
│ Expires: July 23         │
│ Role: Family Coordinator │
│ [ Resend ] [ Cancel ]    │
│ No access before accept. │
└──────────────────────────┘
```

Phone authentication, phone invitation binding, phone recovery, phone OTP, and SMS invitation delivery are absent and deferred.

For Screen 4, `Cancel` leaves directly only before the Circle name or any setting is changed. After input, `Cancel` opens the governing unsaved-changes confirmation: `Keep editing` is the safe/default action and `Discard draft` deliberately leaves without creating a Circle. The prompt describes loss of unsubmitted input, not deletion of Kinward data.

Screen 3's “Access review due” item is the same underlying D-16 state shown in the relevant Care Recipient permission summary and Screens 23–24. Opening or viewing any placement does not clear it. All three remain visible until an authorized continue, modify, suspend, or revoke decision completes successfully; they then clear together, and a continued or modified grant receives its next 90-day review date. No email, SMS, push, renewal, suspension, revocation, or extension is implied by the due item itself.
