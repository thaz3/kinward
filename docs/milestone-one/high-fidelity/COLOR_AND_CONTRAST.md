# Color and Contrast

> **Verified Milestone One design-system reference — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

## Core palette

| Token | Value | Use |
|---|---:|---|
| Mineral 50 | `#F7F6F2` | Application background |
| White | `#FFFFFF` | Elevated surface |
| Ink 900 | `#20312A` | Primary text |
| Ink 700 | `#4C5F56` | Secondary text and interactive-control boundaries |
| Mineral 300 | `#C9D2CD` | Borders/dividers |
| Evergreen 700 | `#17634D` | Primary action, active structure |
| Evergreen 800 | `#124E3D` | Primary hover/pressed |
| Evergreen 100 | `#DCECE6` | Soft selected/active surface |
| Blue 700 | `#155E8A` | Links/informational emphasis |
| Blue 100 | `#E2F0F8` | Information surface |
| Violet 600 | `#7047B6` | Focus indicator |
| Gold 800 | `#6A4B00` | Warning/pending text |
| Gold 100 | `#FFF1C7` | Warning/pending surface |
| Red 700 | `#A33A3A` | Error/destructive text and border |
| Red 100 | `#FBE7E5` | Error surface |
| Green 800 | `#245B3A` | Success text |
| Green 100 | `#E2F1E6` | Success surface |
| Slate 700 | `#44545D` | Dormant/neutral status text |
| Slate 100 | `#E9EEF0` | Dormant/neutral surface |

## Major contrast verification

Ratios are sRGB WCAG contrast calculations, rounded down to two decimals. Normal text requires 4.5:1; large text 3:1; meaningful control boundaries and focus indicators 3:1 against adjacent colors.

| Foreground / background | Ratio | Result |
|---|---:|---|
| Ink 900 / Mineral 50 | 12.66:1 | AA/AAA text |
| Ink 900 / White | 13.69:1 | AA/AAA text |
| Ink 700 / White | 6.82:1 | AA text; AAA for large text |
| White / Evergreen 700 | 7.17:1 | AA/AAA text and controls |
| White / Evergreen 800 | 9.62:1 | AA/AAA text and controls |
| Blue 700 / White | 7.00:1 | AA text; AAA at unrounded precision must be rechecked |
| Violet 600 / White | 6.43:1 | Visible focus |
| Gold 800 / Gold 100 | 7.12:1 | AA/AAA status text |
| Red 700 / Red 100 | 5.48:1 | AA text |
| Green 800 / Green 100 | 6.82:1 | AA text; AAA for large text |
| Slate 700 / Slate 100 | 6.72:1 | AA text; AAA for large text |

Before implementation, re-run these pairs with the final token values and test forced-colors/high-contrast modes. The static preview is evidence of direction, not a conformance certification.

## Actions and focus

- Primary: White text on Evergreen 700; hover/pressed Evergreen 800.
- Secondary: Ink 900 text on White with Ink 700 border (not Mineral 300 alone).
- Link: Blue 700, underlined on hover and always underlined in paragraphs.
- Destructive: Red 700 text and 2 px border on White; filled red is reserved for final destructive confirmation only if separately approved.
- Focus: 3 px Violet 600 outer ring with 2 px White separation. Shape and thickness—not hue alone—distinguish focus.
- Disabled: Ink 700 text on Mineral 50 with a 2 px dashed Mineral 300 border plus adjacent reason text. Do not lower opacity below readable contrast.

Mineral 300 is limited to decorative card edges, dividers, and grouping surfaces; its 1.55:1 contrast against white is not sufficient to define an interactive control. Interactive inputs, buttons, radio cards, navigation controls, filter controls, and disclosure actions use a 2 px Ink 700 boundary or another independently verified 3:1 treatment. Disabled controls retain adjacent reason text and use a shape/dash treatment in addition to color; final implementation must verify any disabled boundary that conveys state.

## Status mapping

Every status includes an icon and the full text label. The same word appears in accessible text.

| State | Surface/text | Icon | Plain-language treatment |
|---|---|---|---|
| Success | Green 100 / Green 800 | check | `Success` plus outcome |
| Informational | Blue 100 / Blue 700 | information circle | `Information` plus fact |
| Warning | Gold 100 / Gold 800 | warning triangle | `Warning` plus consequence |
| Error | Red 100 / Red 700 | x-circle | `Error` plus recovery |
| Pending | Gold 100 / Gold 800 | clock | `Pending` plus what happens next |
| Active | Evergreen 100 / Evergreen 700 | check-circle | `Active` |
| Suspended | Gold 100 / Gold 800 | pause-circle | `Suspended` plus access effect |
| Revoked | Red 100 / Red 700 | slash-circle | `Revoked` plus permanence |
| Dormant | Slate 100 / Slate 700 | moon | `Dormant — no permissions` |
| Denied | Slate 100 / Ink 900 | lock | `Denied` with non-leaking recovery |
| Blocked | Gold 100 / Ink 900 | lock | `Blocked` plus invariant and safe next step |

Red is not used for routine warnings, review-due, pending, blocked, or dormant states. Blue/green, gold, red, and slate also differ in icon and wording to remain understandable with common color-vision differences.
