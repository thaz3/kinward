# Kinward Milestone One High-Fidelity Design

> **Visual source of truth for Milestone One implementation (D-18).**
>
> **Status:** Thirty-nine-screen high-fidelity package is the approved visual source of truth for Milestone One application coding under D-18; medical features, uploads, real-family beta, and production release remain unauthorized.
> **Last updated:** 2026-07-17
> **Behavioral baseline:** Verified 39-screen low-fidelity package; D-1 through D-18

## Purpose and boundary

This package is the visual source of truth for implementing the approved Milestone One flows. It changes no behavior relative to governing product documentation. Runtime authorization, focus restoration, audit policy, and stale-response disposal are enforced in application code per D-18 and the implementation plan.

The package contains 39 static screen specifications. It uses only obviously fictional Harbor Circle examples and contains no real family or health information.

## Review order

1. `DESIGN_SYSTEM.md`
2. `COLOR_AND_CONTRAST.md`
3. `TYPOGRAPHY_AND_SPACING.md`
4. `COMPONENT_SPEC.md`
5. `HIGH_FIDELITY_INDEX.md`
6. `previews/representative-screens.svg`
7. Individual specifications in `screens/`

## Direction in one sentence

Warm off-white space, deep evergreen structure, familiar system typography, rounded but adult surfaces, explicit context, and text-first status treatments create a calm coordination tool rather than a clinical dashboard.

## Verified design direction

| ID | Decision | Proposed direction | Alternatives / tradeoff |
|---|---|---|---|
| HF-Q1 | Color direction | Warm mineral + evergreen + restrained blue | A cooler blue-led palette feels more clinical; a warmer palette risks lower status differentiation. |
| HF-Q2 | Type direction | Native system sans stack | A licensed family could be more distinctive but adds platform/loading and scaling risk. |
| HF-Q3 | Wordmark/icon direction | Text wordmark; abstract two-path `K`/embrace icon | Requires brand review; do not alter the First & 8th parent identity. |
| HF-Q4 | Navigation appearance | Labeled bottom bar on narrow mobile; sidebar at desktop | Bottom bar is familiar but limits destinations, so only permitted primary destinations appear. |
| HF-Q5 | Card density | Comfortable by default; compact only for audit/history | Comfortable improves stressful-use scanning; compact shows more rows but raises fatigue risk. |
| HF-Q6 | Status presentation | Icon + full text label + lightly tinted badge | Text is safest; icons remain supportive and need final semantic review. |
| HF-Q7 | Mobile/desktop treatment | Single-column phone; centered 720 px reading column; optional 240 px desktop nav | Wider multi-column layouts increase scan complexity and context-loss risk. |
| HF-Q8 | Enlarged-text navigation | Bottom navigation becomes a vertical menu sheet when labels no longer fit | Preserves complete labels and 48 px targets but adds one navigation step. |
| HF-Q9 | Focus treatment | 3 px violet outer ring plus 2 px light separation | Highly visible and color-distinct; owner should approve its prominence. |
| HF-Q10 | Destructive styling | Red outline/text, not a dominant filled red | Red remains recognizable while avoiding medical-alarm dominance. |

The product owner approved this visual direction as the Milestone One visual source of truth. Application implementation of matching screens is authorized under D-18 within foundation scope only.

## Contents

- `DESIGN_SYSTEM.md` — brand application, foundations, interaction principles
- `COLOR_AND_CONTRAST.md` — palette, statuses, contrast evidence
- `TYPOGRAPHY_AND_SPACING.md` — type, scale, spacing, reflow, density
- `COMPONENT_SPEC.md` — appearance and state specifications
- `HIGH_FIDELITY_INDEX.md` — artifact and traceability index
- `screens/` — thirty-nine screen specifications total: eleven verified representative specifications, seven verified Batch One specifications, and twenty-one repaired draft specifications pending targeted final re-audit
- `previews/representative-screens.svg` — static overview board for the eleven representative screens
- `previews/enlarged-text-examples.svg` — calibrated static 200% text-resize evidence for representative Screens 3, 13, 32, 38, and 39, using exact 2× roles (36/32/44/56 px) on narrow frames; primary Evergreen labels use explicit white fills
- `previews/rendered-evidence/` — locally rendered full-height PNG review copies plus regional and targeted inspection crops; exact active filenames are listed in `FINAL_AUDIT_PREPARATION.md` (Active rendered-evidence inventory), including `screen-15-calibrated-containment-crop.png` and `screen-36-calibrated-containment-crop.png`; audit evidence only, generated without an application dependency
- `previews/batch-01-screens-02-10.svg` — draft standard-mobile expansion evidence for Screens 2, 4, 6, 7, 8, 9, and 10
- `previews/batch-01-enlarged-text.svg` — calibrated static 200% text-resize evidence for all seven Batch One screens, using 36/32/32/44/56 px roles on narrow frames
- `previews/batch-01-state-evidence.svg` — organized loading, error, neutral-denial, focus, and confirmation evidence for Batch One
- `previews/draft-group-01-screens-11-18.svg` and `draft-group-01-calibrated-200.svg` — standard and calibrated evidence for Screens 11, 12, and 14–18
- `previews/draft-group-02-screens-19-26.svg` and `draft-group-02-calibrated-200.svg` — standard and calibrated evidence for Screens 19–23, 25, and 26
- `previews/draft-group-03-screens-28-37.svg` and `draft-group-03-calibrated-200.svg` — standard and calibrated evidence for Screens 28–30, 33, 34, 36, and 37
- `previews/draft-g1-g3-state-evidence.svg` — dedicated screen-specific state evidence for all twenty-one repaired screens
- `previews/rendered-evidence/draft-group-*.png` and `draft-g1-g3-state-evidence.png` — seven full-resolution repaired-board renders; see `FINAL_AUDIT_PREPARATION.md` for the exact active regional and targeted crop filename lists

Batch One and the full package demonstrate only invitation configurations already supported by the governing sources. The unresolved membership-only adult invitation path is excluded under GOV-005 and `DEFERRED_BACKLOG.md`; the exclusion is temporary and does not decide future policy.

## Explicit exclusions

This design package itself remains static Markdown, SVG, and PNG evidence. Application code is authorized separately under D-18 and must not introduce medical workflows, document uploads, real data, production release, or beta activity.
