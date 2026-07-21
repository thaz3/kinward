"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LoadingState } from "@/components/system-states";
import { ContextRequestGuard } from "@/lib/protected-state";

const CLEAR_RECIPIENT_CONTEXT_EVENT = "kinward:clear-recipient-context";
const CLEAR_CIRCLE_CONTEXT_EVENT = "kinward:clear-circle-context";

export function RecipientSwitchLink({ circleId }: { circleId: string }) {
  const guard = useRef(new ContextRequestGuard());
  return (
    <Link
      href={`/circles/${circleId}/switch-recipient`}
      onClick={() => {
        guard.current.clear();
        window.dispatchEvent(new Event(CLEAR_RECIPIENT_CONTEXT_EVENT));
      }}
    >
      Switch Care Recipient
    </Link>
  );
}

export function ProtectedRecipientContent({
  children,
}: {
  children: ReactNode;
}) {
  const [clearing, setClearing] = useState(false);
  useEffect(() => {
    const clear = () => setClearing(true);
    window.addEventListener(CLEAR_RECIPIENT_CONTEXT_EVENT, clear);
    window.addEventListener(CLEAR_CIRCLE_CONTEXT_EVENT, clear);
    return () => {
      window.removeEventListener(CLEAR_RECIPIENT_CONTEXT_EVENT, clear);
      window.removeEventListener(CLEAR_CIRCLE_CONTEXT_EVENT, clear);
    };
  }, []);
  return clearing ? (
    <LoadingState label="Clearing the previous Care Recipient context…" />
  ) : (
    children
  );
}
