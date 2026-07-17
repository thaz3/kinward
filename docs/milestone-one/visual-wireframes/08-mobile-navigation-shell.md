# Flow 08 — Mobile Navigation Shell

**Low-fidelity planning wireframe — not final interface design.**

```text
┌──────────────────────────┐
│ 38. Protected shell      │
│ Kinward     [My Kinward] │
│ ┌──────────────────────┐ │
│ │ Circle: Harbor       │ │
│ │ Context: Dad         │ │
│ │ [ Switch context ]   │ │
│ └──────────────────────┘ │
│                          │
│ Page heading             │
│ Page content uses only   │
│ the displayed context.   │
│                          │
│                          │
│ ──────────────────────── │
│ Overview  Members  Roles │
│ Audit     Settings       │
│ Current page: Overview   │
└──────────────────────────┘

NARROW / 200% TEXT REFLOW
┌──────────────────┐
│ Harbor           │
│ Dad              │
│ [Switch context] │
│                  │
│ Page heading     │
│ Content stacks;  │
│ no horizontal    │
│ scrolling.       │
│                  │
│ [ Overview ]     │
│ [ Members ]      │
│ [ Roles ]        │
│ [ Audit ]        │
│ [ Settings ]     │
└──────────────────┘
```

Navigation destinations appear only when permitted, but hiding is never the authorization control. Switching Care Recipient enters Screen 39 before destination content renders; switching Circle uses the same clear-before-query principle. Protected prior context, drafts, filters, cached labels, counts, badges, deep links, and permission results are cleared. Every destination has a programmatic name, current-page text, logical focus order, visible focus, and an interactive target of at least 48 × 48 CSS pixels.
