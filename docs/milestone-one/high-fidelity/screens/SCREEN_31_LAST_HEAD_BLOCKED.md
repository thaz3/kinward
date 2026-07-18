# Screen 31 — Last active Circle Head blocked state

> **Draft high-fidelity design — not approved for implementation.**

**Viewport:** 390 × 844 mobile. **Source:** `06-minor-backup-and-continuity.md`, Screen 31. **Flow:** UF-22. **Tests:** AT-034, AT-042, AT-044.

## Composition

Context: `Harbor Circle · Circle-wide`. Gold/Ink blocked panel with lock icon and explicit `Blocked`. Heading `You can’t leave Harbor Circle yet`. Body: `Another verified adult must accept Circle Head before you can leave or lose this role.` Separate boundary card: `A backup designation or activation does not replace a Circle Head and cannot bypass this step.` Primary `Invite a replacement`; secondary `Return to settings`.

**State label:** Blocked. **Primary action:** Invite a replacement.

**Accessibility/privacy annotations:** Outcome announced calmly; focus lands on the blocked heading, not a destructive control; visible attempted/blocked values only when field-authorized; backup remains dormant/unactivated with zero authority; no alternate recovery, succession, incapacity, death, or legal-authority determination.
