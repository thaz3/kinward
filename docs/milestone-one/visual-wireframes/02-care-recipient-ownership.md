# Flow 02 — Adult Care Recipient Ownership

**Low-fidelity planning wireframe — not final interface design.**

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│ 8. Propose recipient     │  │ 9. Ownership invitation  │
│ Harbor · Circle-wide     │  │ Email verified           │
│ ( ) Add myself           │  │ Harbor Circle            │
│ (x) Propose another adult│  │ Avery proposed you as the│
│ Owner verified email     │  │ sole owner of “Dad.”     │
│ [ r•••@example.test    ] │  │ No private information   │
│ No private information   │  │ exists before acceptance.│
│ before owner accepts.    │  │ [ Review and accept ]     │
│ [ Send ownership invite ]│  │ [ Decline ]              │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 10. Ownership pending    │  │ 11. Accept ownership     │
│ Harbor · Pending “Dad”   │  │ Harbor · “Dad”           │
│ Proposed owner: r•••@…   │  │ You will be sole owner.  │
│ Status: Awaiting decision│  │ Circle membership begins.│
│ Private record: inactive │  │ Consent will be recorded.│
│ [ Resend ] [ Cancel ]    │  │ FOCUS → [ Accept ]       │
│ [ Back to Circle ]       │  │ [ Back ]                 │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 12. Decline ownership    │  │ 13. Choose context       │
│ Harbor · “Dad” proposal  │  │ Harbor Circle            │
│ Declining will not create│  │ (x) Circle-wide          │
│ an active Care Recipient │  │ ( ) Dad                  │
│ record or membership.    │  │ ( ) Mom                  │
│ [ Confirm decline ]      │  │ Only permitted people are│
│ [ Keep reviewing ]       │  │ listed.                  │
│                          │  │ [ Switch context ]       │
└──────────────────────────┘  └──────────────────────────┘
```

Ownership is sole, explicit, and email-bound. Circle Head status, marriage, or family relationship creates no ownership or medical access.
