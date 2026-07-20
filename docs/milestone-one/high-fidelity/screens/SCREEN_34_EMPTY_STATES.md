# Screen 34 — Empty states

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Purpose:** Provide a safe next step when an authorized collection is truly empty. **Decisions:** D-1–D-3, D-14. **Low fidelity:** `07-audit-and-system-states.md`, Screen 34. **Flow/tests:** All applicable; AT-001–AT-030.

## Audience, entry, and context

Audience varies by protected destination and must already be authorized for that collection. Active Circle and Care Recipient are explicit where applicable. Before authorization, never show an empty state because emptiness could reveal existence or filtering. After authorization, show a context-specific heading, one sentence, and at most one permitted next action.

## Actions and states

**Primary:** the single authorized next step, such as `Invite an adult`, or no action. Loading remains distinct from empty. Empty appears only after an authorized complete response. System error says unavailable/retry and is never mislabeled empty. Denial is neutral and never includes filtered counts. Success after an action returns to the collection heading. No generic destructive/discard confirmation applies.

**Secondary action:** none in the shared empty-state pattern. **Neutral denied state:** `Information unavailable`; it replaces rather than resembles an empty collection and reveals no filtered count. **Screen-reader semantics:** expose the empty heading, context, sentence, and permitted action; decorative imagery has no accessible name.

## Accessibility, privacy, and lifecycle

Use a heading, concise sentence, meaningful icon marked decorative where appropriate, explicit button, and focus on the empty-state heading. At narrow and calibrated 200%, text and the 48 px action wrap vertically. Do not reveal hidden counts, records, roles, recipients, invitations, audit events, or reasons. Context switches clear old empty/results state before querying and late responses are discarded. Excludes medical empty-state prompts and recommendation language. Runtime authorization, complete-response detection, focus, and stale-response handling remain implementation-only.
