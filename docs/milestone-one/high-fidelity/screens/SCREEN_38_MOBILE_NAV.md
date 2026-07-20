# Screen 38 — Mobile navigation shell

> **Verified Milestone One high-fidelity screen — coding authorized (D-18 / GOV-006); non-medical foundation only. Part of the verified thirty-nine-screen baseline (GOV-007 Closed — PASS).**

**Viewports:** 320 px narrow and enlarged-text example; 390 × 844 standard. **Source:** `08-mobile-navigation-shell.md`, Screen 38. **Flow:** applies across approved flows. **Tests:** AT-001–AT-004, AT-026.

## Composition

Protected shell shows context header first, then page content, then a safe-area-aware labeled bottom navigation: `Overview`, `Members`, `Roles`, `Audit`, `Settings`, limited to permitted destinations. Current item uses icon, evergreen indicator bar, bold text, and assistive `Current page` text. `My Kinward` and context switching remain explicit controls outside the destination set.

**Primary action:** The page’s own action; navigation never competes visually. **State label:** Current page — Overview.

**Enlarged/narrow treatment:** When full labels no longer fit comfortably, the bottom bar becomes one 48 px `Open navigation` control. The enlarged-text preview shows the complete vertical labeled sheet with individual 48 px Overview, Members, Roles, Audit, and Settings destinations; Overview includes a bar/check and `Current`; a 48 px `Close navigation` control is present. Labels wrap without abbreviation or horizontal scrolling.

**Accessibility/privacy annotations:** `nav` landmark and label; predictable keyboard order; 48 px targets; only permitted destinations shown; active context announced; context loss resets safely; safe-area padding; reduced motion.
