# Screen 39 — Care Recipient context reset

> **Draft high-fidelity design — not approved for implementation.**

**Viewports:** 320 px narrow and enlarged-text example; 390 × 844 standard. **Source:** `09-care-recipient-context-reset.md`, Screen 39. **Flow:** UF-25. **Test:** AT-041.

## Composition

The artifact shows the approved transition sequence: (1) switch initiated from Dad; (2) `Dad · Unsaved changes` confirmation with primary `Keep working in Dad`; (3) cancellation remains in Dad; (4) `Discard and switch` invalidates the Dad draft/request before clear; (5) neutral reset `Switching context… Checking access for the selected context`; (6) a late Dad response is explicitly discarded without rendering; (7) authorized `Harbor Circle · Mom` appears only after permission confirmation; and (8) a separate denied-destination example uses the generic non-leaking `Information unavailable` component.

**Primary action:** Keep working in Dad (safe default). **Secondary:** Discard and switch. **State labels:** Unsaved changes; Resetting context; Context ready or Information unavailable.

**Enlarged/narrow treatment:** Dialog becomes a full-height sheet; actions stack with the safe action first; transition panels reflow as a vertical sequence; no status relies on animation.

**Accessibility/privacy annotations:** Prompt and consequence announced; cancel preserves Dad draft/request; confirmed discard invalidates draft/request before clear; late Dad success/error is discarded; neutral state has text status plus stable skeleton; no Dad heading, draft, field, count, badge, cache, deep link, error, or permission result appears; focus moves only to confirmed Mom heading; denied Mom reveals nothing and offers a safe return.
