export type SafeDestination = Readonly<{ href: string; label: string }>;

export type SafeShellContext = Readonly<{
  circleLabel: string;
  careRecipientLabel: string;
  destinations: readonly SafeDestination[];
}>;

export const SYNTHETIC_SHELL: SafeShellContext = {
  circleLabel: "Synthetic Circle",
  careRecipientLabel: "Circle-wide",
  destinations: [{ href: "/", label: "Overview" }],
};

export function createDeniedShell(): SafeShellContext {
  return {
    circleLabel: "Unavailable",
    careRecipientLabel: "Unavailable",
    destinations: [],
  };
}
