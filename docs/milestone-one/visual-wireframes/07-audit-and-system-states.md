# Flow 07 — Audit and System States

**Low-fidelity planning wireframe — not final interface design.**

```text
┌──────────────────────────┐  ┌──────────────────────────┐
│ 32. Audit history        │  │ 33. Action not allowed   │
│ Harbor · Dad             │  │ Harbor · Dad             │
│ Jul 16 · Dad             │  │ ! Permission unchanged   │
│ continued Riley access   │  │ You do not have permission│
│ Result: Completed        │  │ for this role change.     │
│ Jul 15 · Jordan          │  │ No private details are    │
│ role change denied       │  │ shown. This consequential │
│ Result: Denied           │  │ attempt may be audited.   │
│ [ Open safe details ]    │  │ [ Return to roles ]      │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 34. Empty                │  │ 35. Could not complete   │
│ Harbor · Dad             │  │ Harbor · Circle-wide     │
│ No recipient-specific    │  │ Your change was not saved│
│ roles are assigned.      │  │ Review the marked field. │
│ [ Assign a permitted role│  │ Error summary            │
│ ]                        │  │ • Verified email required│
│ Hidden people/counts are │  │ [ Go to email field ]    │
│ never represented here.  │  │ [ Try again ] [ Back ]   │
└──────────────────────────┘  └──────────────────────────┘

┌──────────────────────────┐  ┌──────────────────────────┐
│ 36. Loading              │  │ 37. Permission denied    │
│ Harbor · Circle-wide     │  │ Harbor Circle            │
│ Loading permitted Circle │  │ ! This information is not│
│ information…             │  │ available to you.        │
│ [ progress placeholder ] │  │ No record name, count, or│
│ No recipient names/counts│  │ existence clue is shown. │
│ are shown before access  │  │ [ Return to overview ]   │
│ is confirmed.            │  │ [ Switch context ]       │
└──────────────────────────┘  └──────────────────────────┘
```

Routine denied reads never appear in family-visible audit history. Consequential denied authority writes may appear only within the viewer’s authorized audit scope. Security and operational logs remain separate.
