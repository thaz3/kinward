# Typography and Spacing

> **Draft high-fidelity design — not approved for implementation.**

## Typeface

Use the native system sans stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`. This keeps Dynamic Type and Android font-scaling behavior familiar and avoids a webfont dependency. The product owner must approve this direction before implementation.

## Type roles

| Role | Base size / line height | Weight | Notes |
|---|---|---:|---|
| Display heading | 36 / 44 px | 700 | Welcome only; scales without fixed height |
| Page heading | 28 / 36 px | 700 | One per page |
| Section heading | 22 / 30 px | 700 | Clear nested hierarchy |
| Body | 18 / 27 px | 400 | Default reading text |
| Supporting text | 16 / 24 px | 400 | Never required below 16 px |
| Label | 16 / 22 px | 600 | Persistent; never placeholder-only |
| Button | 17 / 22 px | 700 | Can wrap to two lines; target grows |
| Status label | 16 / 22 px | 700 | Full word, icon-supported |
| Audit history | 16 / 24 px | 400 | Event summary; metadata also 16 px |

Use relative platform units in any future implementation. Never clamp container height around scaled text.

## Enlarged text and reflow

- At 200% browser text resize, primary content remains single-column with no horizontal scrolling.
- Calibrated static evidence uses a direct 2× relationship to the standard text roles: 36 px body, 32 px supporting text, 32 px labels, 44 px section headings, and 56 px page headings. Values are not reduced to make a frame fit.
- `previews/enlarged-text-examples.svg` provides that calibrated evidence for representative Screens 3, 13, 32, 38, and 39. It is static design evidence representing a calibrated 200% text-size relationship. Runtime conformance requires later implementation testing.
- `previews/batch-01-enlarged-text.svg` documents the same exact roles for Batch One Screens 2, 4, 6, 7, 8, 9, and 10, with vertical growth, stacked controls, complete labels, and no horizontal scrolling.
- Because the local `sips` SVG renderer does not reliably apply multi-class CSS fill overrides such as `.white` against the default Ink text rule, primary Evergreen action labels in calibrated boards use an explicit `fill="#FFFFFF"` attribute on the text element.
- The same renderer does not reliably interpret CSS `font:` shorthand. Active Draft G1–G3 and state-evidence boards declare typography with explicit `font-family`, `font-size`, and `font-weight` using the verified native sans stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`). SVG presentation attributes that carry the stack use single quotes around `Segoe UI` so XML attribute quoting remains valid.
- Static SVGs do not certify browser zoom, iOS Dynamic Type, Android font scaling, or assistive-technology runtime behavior.
- Dynamic Type/Android scaling may move trailing actions below titles and transform segmented/bottom navigation into a vertical labeled menu.
- Cards, badges, buttons, and context headers grow in height; text is never truncated or ellipsized where meaning changes.
- Tables become labeled event cards below 600 px or whenever enlarged text cannot preserve readable columns.
- Keep line length near 45–70 characters on desktop; phone width determines natural wrapping.
- Screen-reader-only text uses the standard visually-hidden pattern in any future implementation; it remains in the accessibility tree and does not use `display:none`, `visibility:hidden`, or zero-size text.

## Spacing scale

Use a 4 px base with deliberate larger gaps: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64` px.

| Use | Comfortable | Compact |
|---|---:|---:|
| Mobile edge margin | 20 px | 16 px |
| Card padding | 20–24 px | 16 px |
| Related control gap | 12 px | 8 px |
| Form field gap | 20 px | 16 px |
| Section gap | 32–40 px | 24 px |
| Major page gap | 48–64 px | 40 px |
| List row vertical padding | 16 px | 12 px |

Comfortable is the default. Compact is limited to repeatable history/audit lists and must retain 48 × 48 px controls and the 16 px minimum text size.

## Layout

- Narrow phone reference: 320 px wide, 16 px margins.
- Standard mobile reference: 390 × 844 px, 20 px margins.
- Large mobile/tablet: keep the primary reading column at max 720 px.
- Desktop: max primary content 720 px; optional 240 px navigation rail; total shell max 1040 px.
- Forms use one column until adjacent fields remain at least 240 px wide under text scaling.
- Bottom actions respect `env(safe-area-inset-bottom)` in a future implementation; preview uses 16 px plus safe area.
- Top context respects status-bar/notch safe area without putting essential text under system chrome.

## Density decision

Default to comfortable density on welcome, dashboard, forms, permission, delegation, and blocked states. Audit history may use compact density only after user testing confirms scanning remains comfortable for older adults and caregivers under stress (HF-Q5).
