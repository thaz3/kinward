"use client";

import { UnavailableState } from "@/components/system-states";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="standalone-state" id="main-content">
      <UnavailableState onRetry={reset} />
    </main>
  );
}
