# Screen 13 — Care Recipient switcher

> **Draft high-fidelity design — not approved for implementation.**

**Viewports:** 320 px narrow and enlarged-text example; 390 × 844 standard. **Source:** `02-care-recipient-ownership.md`, Screen 13. **Flows:** UF-02, UF-05. **Tests:** AT-002, AT-003.

## Composition

Full-page selection view, not a small dropdown. Context header reads `Circle — Harbor Circle`. Heading `Choose context`; radio-card options `Circle-wide`, `Dad`, and `Mom` in this authorized synthetic example; helper text `Only contexts you can access are listed.` Primary `Switch context`; secondary `Cancel`.

**State label:** Selected — Circle-wide. **Primary action:** Switch context.

**Enlarged/narrow treatment:** Radio cards grow with the full label and scope explanation. The action remains below the list rather than fixed over content. At 200%, every option remains at least 48 px high and the page scrolls vertically.

**Privacy/accessibility annotations:** Server-filtered list; inaccessible people leave no placeholder or count. Radio group has a visible legend; selected state uses radio mark, border, and explicit screen-reader state. Confirmed switching invokes Screen 39 reset behavior.
