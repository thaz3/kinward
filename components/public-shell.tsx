import Link from "next/link";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="public-header">
        <Link className="wordmark" href="/sign-in" aria-label="Kinward sign in">
          Kinward
        </Link>
        <span className="environment-label">Synthetic preview</span>
      </header>
      <main id="main-content" className="public-content" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}
