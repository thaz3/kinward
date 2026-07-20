"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { LockIcon } from "@/components/icons";

function StateHeading({
  children,
  focus = false,
}: {
  children: string;
  focus?: boolean;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus) ref.current?.focus();
  }, [focus]);
  return (
    <h2 ref={ref} tabIndex={focus ? -1 : undefined}>
      {children}
    </h2>
  );
}

export function EmptyState({
  heading,
  message,
  action,
}: {
  heading: string;
  message: string;
  action?: { href: string; label: string };
}) {
  return (
    <section className="system-state" aria-labelledby="empty-state-heading">
      <StateHeading focus>{heading}</StateHeading>
      <p>{message}</p>
      {action && (
        <Link className="button primary" href={action.href}>
          {action.label}
        </Link>
      )}
    </section>
  );
}

export function LoadingState({
  label = "Loading authorized information…",
}: {
  label?: string;
}) {
  return (
    <section
      className="system-state loading-state"
      aria-labelledby="loading-state-heading"
      aria-busy="true"
    >
      <StateHeading>Loading…</StateHeading>
      <p
        id="loading-state-heading"
        className="status-copy"
        role="status"
        aria-live="polite"
      >
        {label}
      </p>
      <div className="skeleton" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </section>
  );
}

export function UnavailableState({ onRetry }: { onRetry?: () => void }) {
  return (
    <section
      className="system-state neutral-state"
      role="alert"
      aria-labelledby="unavailable-state-heading"
    >
      <LockIcon />
      <StateHeading focus>Information unavailable</StateHeading>
      <p id="unavailable-state-heading">
        We couldn’t complete this request. No protected information is shown.
      </p>
      {onRetry ? (
        <button className="button secondary" type="button" onClick={onRetry}>
          Try again
        </button>
      ) : (
        <Link className="button secondary" href="/my-kinward">
          Return to My Kinward
        </Link>
      )}
    </section>
  );
}

export function PermissionDeniedState() {
  return (
    <section
      className="system-state neutral-state"
      role="alert"
      aria-labelledby="denied-state-heading"
    >
      <LockIcon />
      <StateHeading focus>This information isn’t available to you</StateHeading>
      <p id="denied-state-heading">
        Nothing changed. Return to a page you can access.
      </p>
      <Link className="button primary" href="/my-kinward">
        Return to My Kinward
      </Link>
    </section>
  );
}
