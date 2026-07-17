# Flow 04 — Delegation Setup

**Low-fidelity planning wireframe — not final interface design.**

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│ 19. Delegated Management │  │ 20. Choose exact scope   │
│ Harbor · Dad             │  │ Harbor · Dad · Riley     │
│ Owner remains Dad        │  │ [x] Manage roles         │
│ Representative           │  │ [x] Review permissions   │
│ [ Riley                ] │  │ [ ] Change ownership     │
│ This is a Kinward grant, │  │     Never included       │
│ not legal authority.     │  │ Actions show “Riley for  │
│ [ Choose scope ]         │  │ Dad” in audit history.   │
└──────────────────────────┘  │ [ Continue ]             │
                              └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 21. Choose duration      │  │ 22. Until revoked        │
│ Harbor · Dad · Riley     │  │ Harbor · Dad · Riley     │
│ (x) Suggested: 90 days   │  │ (x) No expiration        │
│ ( ) Custom date          │  │ Access review every 90   │
│ ( ) Until revoked        │  │ days. A missed review does│
│ Expiration is optional.  │  │ not automatically revoke │
│ [ Review delegation ]    │  │ or extend authority.     │
│ [ Back ]                 │  │ [ Confirm this choice ]  │
└──────────────────────────┘  └──────────────────────────┘
```

The representative cannot expand scope. Confirmation requires recent authentication and records explicit consent, scope, lifecycle choice, actor, and Care Recipient.
