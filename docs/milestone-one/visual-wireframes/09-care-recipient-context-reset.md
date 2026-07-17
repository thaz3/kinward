# Flow 09 — Care Recipient Context Reset

**Low-fidelity planning wireframe — not final interface design.**

```text
START: DAD                   RESET / AUTHORIZE            CONFIRMED: MOM
┌──────────────────────────┐ ┌──────────────────────────┐ ┌──────────────────────────┐
│ Harbor · Dad             │ │ 39. Changing context     │ │ Harbor · Mom             │
│ Dad permissions          │ │ Harbor Circle            │ │ Mom permissions          │
│ Request: Saving…         │ │ Changing Care Recipient… │ │ Authorization confirmed  │
│ Draft: role assignment   │ │ Cancel request if supported││ Late Dad result discarded │
│ Filter: Active roles     │ │                          │ │ FOCUS → Mom context      │
│ Count: 3                 │ │ Dad draft/filter/count/  │ │ heading                  │
│ [ Switch to Mom ]        │ │ heading/cache/deep link/ │ │                          │
│                          │ │ permission result cleared│ │ [ Continue ]             │
└──────────────────────────┘ │ before Mom query.        │ └──────────────────────────┘
                             │ Mom protected content is │
                             │ not rendered yet.        │
                             └──────────────────────────┘

UNSAVED DAD DRAFT
┌──────────────────────────┐  ┌──────────────────────────┐
│ Discard Dad draft?       │  │ Switch cancelled         │
│ Switching will discard   │  │ Harbor · Dad remains     │
│ this Dad-scoped draft and│  │ Draft and in-flight      │
│ invalidate its request.  │  │ request remain Dad-scoped│
│ Primary: [ Discard and   │  │ FOCUS → Dad heading      │
│ switch ]                 │  │                          │
│ [ Keep editing Dad ]     │  │ [ Continue editing ]     │
└──────────────────────────┘  └──────────────────────────┘

UNAUTHORIZED DESTINATION
┌──────────────────────────┐
│ Harbor Circle            │
│ ! Information unavailable│
│ This Care Recipient      │
│ context is not available │
│ to you. No name, count,  │
│ record, or existence clue│
│ is shown.                │
│ FOCUS → [ Return safely ]│
└──────────────────────────┘
```

The discard confirmation occurs before Dad context is cleared. “Keep editing Dad” cancels the switch and preserves Dad context. “Discard and switch” permanently invalidates the old request and draft before clearing Dad state and beginning Mom authorization.

Where cancellation is supported, the Dad request is cancelled; otherwise it is marked stale and every late success or error is discarded. A Dad response arriving during reset or after Mom authorization cannot repaint a Dad heading, count, badge, draft, field label, permission result, or error. Mom content renders only after server-confirmed Mom authorization.

The switch and consequential outcomes are announced to screen readers. Neutral loading uses text plus reduced-motion-safe feedback, never a spinner alone. After authorization, focus moves to the Mom context heading. At 200% text, primary content reflows without horizontal scrolling. Every interactive target uses Kinward's 48 × 48 CSS-pixel baseline.
