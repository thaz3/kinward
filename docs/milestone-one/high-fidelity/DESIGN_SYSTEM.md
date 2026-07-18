# Kinward Visual Design System

> **Draft high-fidelity design — not approved for implementation.**

## Product character

The interface should feel steady before it feels clever: quiet surfaces, direct language, obvious actions, and persistent context. Warmth comes from spacing, rounded geometry, and a restrained mineral palette—not illustration, playful decoration, or family stereotypes.

## Brand application

### Product-name treatment and wordmark

Use **Kinward** as a text wordmark in the selected system sans, 700 weight, with normal letter spacing. Never typeset it in all caps. The proposed icon may sit to the left; the wordmark must also work alone. Do not combine or visually merge it with the First & 8th parent mark.

### Tagline

“Care moves better together” uses sentence case, supporting-text size, and regular weight. Keep it on one line when space permits; otherwise break after “better.” It is descriptive, never an action or heading substitute.

### Application-icon direction

Proposed direction: two soft paths forming an abstract `K` and an embracing/forward motion gesture within a rounded-square evergreen field. It must remain abstract—no heart, cross, ribbon, hospital, family silhouette, or medical symbol. This is a direction for brand review, not a finished logo.

### Background use

- Light: evergreen wordmark/icon on Mineral 50 or white.
- Dark: white wordmark on Evergreen 900; use a white keyline icon if necessary.
- Do not place the mark on status colors, photography, gradients, or low-contrast textures.

### Clear space and minimum size

Use the cap height of the `K` as clear space on all sides. Minimum digital wordmark width: 96 CSS px. Minimum icon size: 24 CSS px for passive display and 48 CSS px when interactive. Tagline may be omitted below 160 CSS px of available brand width.

## Shape and elevation

- Cards: 16 px radius; 1 px border; no shadow by default.
- Elevated overlays/dialogs: 20 px radius; restrained shadow `0 12px 32px rgba(24,42,34,.18)`.
- Inputs/buttons: 12 px radius.
- Badges: full pill only for short status text; do not pill-wrap paragraphs.
- Avoid stacked shadows and glass effects; boundaries must remain clear in high contrast and fatigue conditions.

## Icon direction

Use simple 20–24 px outline icons with 2 px strokes, always paired with visible text for status, context, and consequential actions. Decorative icons are hidden from assistive technology. Meaningful icons receive an accessible name only when visible text does not already name the same control.

Suggested semantics: check = success/active; clock = pending/review due; pause = suspended; slash = revoked/denied; moon = dormant; lock = blocked/private; information circle = neutral information; warning triangle = warning; x-circle = error.

## Context presentation

Every protected screen begins with a context header above the page heading:

- line 1: active Circle, labeled `Circle`;
- line 2 when applicable: active Care Recipient, labeled `Care Recipient`;
- switch action, if permitted, is a full 48 px control;
- Circle-wide is written explicitly, never inferred from omission.

Context changes announce the destination. Recipient switching follows Screen 39: old scoped state clears before the new authorization request, and focus moves only after confirmed destination content is safe to show.

## Interaction principles

- One visually dominant primary action per decision surface.
- Secondary lifecycle actions are grouped and labeled, never disguised as links in body copy.
- Consequential actions state scope and outcome before confirmation.
- Disabled controls are not the sole explanation; adjacent text names why the action is unavailable.
- Loading uses text plus stable skeletons; never a spinner alone and never implies continuous monitoring.
- Status never relies on color alone.
- Motion is optional enhancement. Reduced-motion presentation uses instant state change and a text status announcement.

## Brand review boundary

HF-Q1 through HF-Q3 in `README.md` require product-owner approval. This proposal does not redesign the First & 8th parent brand and must not be represented as final brand work.
