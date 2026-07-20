"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoadingState } from "@/components/system-states";
import { ContextRequestGuard } from "@/lib/protected-state";

const CLEAR_CONTEXT_EVENT = "kinward:clear-circle-context";

export function CircleSwitchLink() {
  const guard = useRef(new ContextRequestGuard());
  return (
    <Link
      href="/switch-circle"
      onClick={() => {
        guard.current.clear();
        window.dispatchEvent(new Event(CLEAR_CONTEXT_EVENT));
      }}
    >
      Switch Circle
    </Link>
  );
}

export function ProtectedCircleContent({ children }: { children: ReactNode }) {
  const [clearing, setClearing] = useState(false);
  useEffect(() => {
    const clear = () => setClearing(true);
    window.addEventListener(CLEAR_CONTEXT_EVENT, clear);
    return () => window.removeEventListener(CLEAR_CONTEXT_EVENT, clear);
  }, []);
  return clearing ? (
    <LoadingState label="Clearing the previous Circle context…" />
  ) : (
    children
  );
}
