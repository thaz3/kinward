import type { ReactNode } from "react";
import Link from "next/link";
import { MobileNavigation } from "@/components/mobile-navigation";
import { PageFocus } from "@/components/page-focus";
import type { SafeShellContext } from "@/lib/shell-context";
import {
  CircleSwitchLink,
  ProtectedCircleContent,
} from "@/components/circle-context-transition";

export function AppShell({
  children,
  context,
  currentPath,
  pageTitle = "Overview",
}: {
  children: ReactNode;
  context: SafeShellContext;
  currentPath: string;
  pageTitle?: string;
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="brand-header">
        <Link className="wordmark" href="/my-kinward" aria-label="Kinward home">
          Kinward
        </Link>
        <span className="environment-label">Synthetic preview</span>
      </header>
      <div className="shell-grid">
        <MobileNavigation
          destinations={context.destinations}
          currentPath={currentPath}
          variant="desktop"
        />
        <div className="page-column">
          <section className="context-header" aria-label="Current context">
            <dl>
              <div>
                <dt>Circle</dt>
                <dd>{context.circleLabel}</dd>
              </div>
              <div>
                <dt>Care Recipient</dt>
                <dd>{context.careRecipientLabel}</dd>
              </div>
            </dl>
            <p className="context-note">
              <CircleSwitchLink />. Changing Circle clears the previous Circle
              context.
            </p>
          </section>
          <main id="main-content" tabIndex={-1}>
            <PageFocus />
            <h1 id="page-heading" tabIndex={-1}>
              {pageTitle}
            </h1>
            <ProtectedCircleContent>{children}</ProtectedCircleContent>
          </main>
        </div>
      </div>
      <MobileNavigation
        destinations={context.destinations}
        currentPath={currentPath}
        variant="mobile"
      />
    </div>
  );
}
