# Flow 05 — Delegation Lifecycle

**Low-fidelity planning wireframe — not final interface design.**

**Implementation boundary:** Screens 23–26 and the complete delegated lifecycle are Slice 10.

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│ 23. Delegation detail    │  │ 24. Access review due    │
│ Harbor · Dad             │  │ Harbor · Dad             │
│ Riley · Active           │  │ ! Review due July 16     │
│ Until revoked            │  │ Riley currently has:     │
│ Scope: roles, permissions│  │ • Manage roles           │
│ Last review: Apr 17      │  │ • Review permissions     │
│ Next review: Jul 16      │  │ [ Continue access ]      │
│ [ Review access ]        │  │ Primary: Continue access │
│ [ Suspend ] [ Revoke ]   │  │ More: Modify · Suspend · │
│                          │  │ Revoke                   │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 25. Suspend delegation   │  │ 26. Revoke delegation    │
│ Harbor · Dad · Riley     │  │ Harbor · Dad · Riley     │
│ Access ends immediately  │  │ Access ends permanently. │
│ but history remains.     │  │ This grant cannot be     │
│ Reason (optional)        │  │ restored. History remains│
│ [                      ] │  │ available in your scope. │
│ Recent sign-in required. │  │ Recent sign-in required. │
│ [ Confirm suspension ]   │  │ [ Confirm revocation ]   │
│ [ Keep active ]          │  │ [ Keep delegation ]      │
└──────────────────────────┘  └──────────────────────────┘
```

Screen 24 has one primary action: “Continue access.” Modify, Suspend, and Revoke are clearly labeled secondary lifecycle actions in a separate group, not competing primary buttons. The due state is shared with My Kinward and the relevant Care Recipient permission summary; viewing does not clear it, and all three placements clear together only after an authorized decision succeeds. A continued or modified grant receives its next 90-day review date.

Pending, Active, Suspended, Revoked, Dormant, Denied, and Blocked are written states, not color treatments. Revocation is irreversible; suspension does not erase history or unrelated roles.
