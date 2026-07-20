"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { DotIcon, MenuIcon } from "@/components/icons";
import type { SafeDestination } from "@/lib/shell-context";

export function MobileNavigation({
  destinations,
  currentPath,
  variant,
}: {
  destinations: readonly SafeDestination[];
  currentPath: string;
  variant: "desktop" | "mobile";
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const openerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const close = () => {
    setOpen(false);
    requestAnimationFrame(() => openerRef.current?.focus());
  };

  if (variant === "desktop") {
    return (
      <NavList
        destinations={destinations}
        currentPath={currentPath}
        className="desktop-navigation"
      />
    );
  }

  return (
    <>
      <div className="mobile-navigation">
        <NavList
          destinations={destinations}
          currentPath={currentPath}
          className="bottom-navigation"
        />
        <button
          ref={openerRef}
          className="navigation-menu-button"
          type="button"
          onClick={() => setOpen(true)}
        >
          <MenuIcon /> Open navigation
        </button>
      </div>
      <dialog
        ref={dialogRef}
        className="navigation-dialog"
        onClose={() => setOpen(false)}
      >
        <div className="navigation-sheet">
          <h2>Navigation</h2>
          <NavList
            destinations={destinations}
            currentPath={currentPath}
            className="sheet-navigation"
            onNavigate={close}
          />
          <button className="button secondary" type="button" onClick={close}>
            Close navigation
          </button>
        </div>
      </dialog>
    </>
  );
}

function NavList({
  destinations,
  currentPath,
  className,
  onNavigate,
}: {
  destinations: readonly SafeDestination[];
  currentPath: string;
  className: string;
  onNavigate?: () => void;
}) {
  const navigationLabel =
    className === "desktop-navigation"
      ? "Primary navigation, desktop"
      : className === "sheet-navigation"
        ? "Primary navigation menu"
        : "Primary navigation, mobile";

  return (
    <nav className={className} aria-label={navigationLabel}>
      <ul>
        {destinations.map((destination) => {
          const current = destination.href === currentPath;
          return (
            <li key={destination.href}>
              <Link
                href={destination.href}
                aria-current={current ? "page" : undefined}
                onClick={onNavigate}
              >
                <DotIcon />
                <span>{destination.label}</span>
                {current && (
                  <span className="visually-hidden">Current page</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
