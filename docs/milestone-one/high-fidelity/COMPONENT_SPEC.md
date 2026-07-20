# Component Appearance Specification

> **Verified Milestone One design-system reference — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

All interactive controls have a minimum 48 × 48 CSS-pixel target. Content may wrap and increase target height. Interactive boundaries use Ink 700 (or another verified 3:1 treatment); Mineral 300 is decorative only. Focus uses the 3 px violet outer ring plus an uninterrupted 2 px white separation defined in `COLOR_AND_CONTRAST.md`, including around filled controls.

## Actions

| Component | Appearance | Key states / accessibility |
|---|---|---|
| Primary button | Evergreen fill, white 17 px bold label, 12 px radius, min 48 px high | Hover/pressed darken; loading keeps label plus `Working…`; disabled remains readable with reason. Static SVG review boards that are rendered with `sips` must place an explicit `fill="#FFFFFF"` on primary-action label text; multi-class CSS `.white` overrides are not reliable in that renderer. |
| Secondary button | White, 2 px Ink 700 border, Ink 900 label | Selected adds check icon and Evergreen 100 inset surface |
| Tertiary/text button | Blue 700 label; transparent 48 px target | Underline on hover/focus; not used as low-emphasis destructive action |
| Destructive button | White, 2 px Red 700 border, Red 700 label, destructive icon | Confirmation repeats object/scope; final action named specifically, never `Yes` |

## Form controls

| Component | Appearance | Key states / accessibility |
|---|---|---|
| Form/email input | Persistent 16 px bold label; white 56 px+ field; 2 px Ink 700 border; 12 px radius; supporting text below | Email keyboard hint where available; error border + icon + text; value retained; no placeholder-only label |
| Selection control | Full-width 56 px+ button with current value and chevron | `aria-expanded` equivalent; selected value repeated in text; menu returns focus |
| Radio option | Entire card is target; 24 px radio + heading + consequence | Native semantics; selected has filled dot, check text, and 2 px Evergreen border |
| Checkbox | 24 px box within 48 px target; label and optional description | Native semantics; indeterminate named in text; errors associate to group |
| Switch | 48 × 28 px visual inside at least 48 × 48 target, visible `On`/`Off` text | Use only for immediate reversible settings; not for consent or authority changes |

## Feedback and state

| Component | Appearance | Key states / accessibility |
|---|---|---|
| Status badge | Icon + full status text on tinted surface; 16 px bold | Never color-only; may wrap; lifecycle effect follows when needed |
| Alert | 4 px leading rule, icon, heading, body, optional action | `Information`, `Warning`, `Error`, or `Success` named; calm copy |
| Error summary | Top-of-form Red 100 panel; heading `Check the highlighted fields`; linked field list | Receives focus after submit; each field has inline text and programmatic association |
| Empty state | Plain heading, one sentence, one permitted action; optional quiet icon | Never exposes hidden counts or inaccessible records |
| Loading state | Stable neutral skeleton blocks + visible `Loading authorized information…` | Busy/status announcement; no spinner-only state; no monitoring implication; motion removed when preferred |
| Permission denied | Lock icon, `This information is unavailable`, generic explanation, safe return | No names, counts, existence clues, reasons, or retry that broadens scope |
| Confirmation dialog | Centered or mobile bottom sheet; heading, consequences, primary named action, cancel | Focus trapped/returned; Escape/cancel safe; destructive action not default-focused |

## Domain cards and rows

| Component | Appearance | Required content |
|---|---|---|
| Member card | Name, Circle-wide role label, status, permitted actions | Recipient-specific access never inferred or displayed as a Circle-wide consequence |
| Care Recipient card | Display label, owner/relationship only when authorized, explicit scope, open/switch action | No hidden-recipient placeholders or counts |
| Role card | Role name, `Circle-wide` or exact Care Recipient label, boundary sentence, lifecycle | Scope repeated in heading/confirmation |
| Delegation card | Care Recipient, representative, `on behalf of`, exact scopes, lifecycle, dates/review | Relationship never shown as authority; review due is explicit |
| Audit row | Date/time, safe event text, authorized context, result; expandable authorized details | Row and each field independently filtered; omitted content leaves no clue/count |
| Navigation item | 24 px icon + full text; min 48 px; current page uses bar + `Current` text for assistive tech | Only permitted destinations appear; order stable |
| Context header | Labeled Circle and Care Recipient lines; switch control | Announces context; Circle-wide explicitly stated |
| Access review due item | Clock icon, heading, Care Recipient + representative, consequence, due date, `Review access` | Viewing does not clear; does not imply external reminder or automatic lifecycle change |

## Interaction-state matrix

| State | Visual treatment | Nonvisual/presentation rule |
|---|---|---|
| Default | Token-defined surface/border/text | Clear accessible name |
| Hover | Stronger border or darker fill; optional underline | Enhancement only; no hover-only content |
| Keyboard focus | 3 px violet ring + 2 px separation; shape change | Focus order follows reading order |
| Pressed | Darker fill plus 1 px inset effect | State exposed where applicable |
| Selected | 2 px Evergreen border, check/radio mark, text | Selected state announced |
| Disabled | Readable neutral styling, dashed border, nearby reason | Not focusable unless discoverability requires a read-only explanation control |
| Loading | Label retained, progress text, stable geometry | Busy/status announcement; repeat activation prevented |
| Error | Error icon, border, text, summary link | Error associated to field/group; input retained |
| Success | Check icon, explicit outcome, next safe focus | Polite status announcement |
| Pending | Clock icon + `Pending` + next step | No countdown pressure |
| Destructive confirmation | Specific object, effect, reversibility, recent-auth note | Cancel first in reading order; destructive action explicitly named |

## Screen-reader-only support

Use hidden supporting text for `Current page`, context-change announcements, expanded/collapsed state, loading completion, and clarified icon meaning when no visible text already provides it. Avoid duplicating visible labels, which can make announcements noisy.
