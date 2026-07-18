# Screen 32 — Permission-filtered audit history

> **Draft high-fidelity design — not approved for implementation.**

**Viewports:** 320 px narrow and enlarged-text example; 390 × 844 standard. **Source:** `07-audit-and-system-states.md`, Screen 32. **Flow:** UF-26. **Tests:** AT-024, AT-035, AT-044.

## Composition

Context header: `Harbor Circle · Dad`. Heading `Audit history`; privacy note `Each event and detail is shown only when you are allowed to see it.` Filter control with full label. Event cards—not a compressed table—show a Circle-wide event and a Dad-specific event, long wrapping actor/metadata examples, authorized actor/approver/context fields, result badge, and a bordered 48 px `View permitted details` action. A masked-field example says `Actor unavailable in your scope`; unauthorized fields are omitted without counts. Filtered-result and empty-filter examples use neutral text and disclose no hidden totals.

**Primary action:** View permitted details on the chosen row. **Secondary:** Filter events. **State labels:** Active and other authorized event results.

**Enlarged/narrow treatment:** Every metadata pair stacks label over value. Filters open as a full-page sheet. No horizontal table scroll; event cards preserve 16 px audit text.

**Privacy/accessibility annotations:** Row and field authorization are independent. Unauthorized events and fields are omitted without counts, gaps, filtered hints, placeholders, names, roles, reasons, attempted values, or result clues. Expand controls expose state and remain keyboard operable. Routine denied reads remain outside family audit.
