import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/app/actions/auth";

export function AccountShell({
  email,
  children,
  title = "My Kinward",
}: {
  email: string;
  children: ReactNode;
  title?: string;
}) {
  return (
    <div className="account-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <header className="brand-header">
        <Link className="wordmark" href="/my-kinward">
          Kinward
        </Link>
        <form action={signOut}>
          <button className="button secondary compact-button" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <main id="main-content" className="account-content" tabIndex={-1}>
        <h1 id="page-heading" tabIndex={-1}>
          {title}
        </h1>
        <p className="signed-in-copy">Signed in as {maskAccountEmail(email)}</p>
        {children}
      </main>
    </div>
  );
}

function maskAccountEmail(email: string) {
  const [local = "", domain = ""] = email.split("@");
  return local && domain
    ? `${local.slice(0, 2)}•••@${domain}`
    : "verified account";
}
