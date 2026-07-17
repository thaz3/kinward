# Flow 05 — Delegation Lifecycle

**Low-fidelity planning wireframe — not final interface design.**

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│ 23. Delegation detail    │  │ 24. Access review due    │
│ Harbor · Dad             │  │ Harbor · Dad             │
│ Riley · Active           │  │ ! Review due July 16     │
│ Until revoked            │  │ Riley currently has:     │
│ Scope: roles, permissions│  │ • Manage roles           │
│ Last review: Apr 17      │  │ • Review permissions     │
│ Next review: Jul 16      │  │ [ Continue access ]      │
│ [ Review ] [ Suspend ]   │  │ [ Modify ] [ Suspend ]   │
│ [ Revoke ]               │  │ [ Revoke ]               │
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

Suspended and revoked are written states, not color treatments. Revocation is irreversible; suspension does not erase history or unrelated roles.
