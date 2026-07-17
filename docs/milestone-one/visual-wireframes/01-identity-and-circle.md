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
│ Your Circles             │  │ Head. This grants no Care│
│ Harbor — Circle Head     │  │ Recipient access.        │
│ [ Open Harbor ]          │  │ [ Create Circle ]        │
│ [ Create a Circle ]      │  │ [ Cancel ]               │
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
