"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  assignFamilyCoordinator,
  transitionCircleRole,
  type RoleActionState,
} from "@/app/actions/circle-roles";

const INITIAL: RoleActionState = { status: "idle" };

export function ProtectedFinalHeadState({
  assignmentId,
}: {
  assignmentId: string;
}) {
  return (
    <section
      className="neutral-alert"
      aria-labelledby={`protected-head-${assignmentId}`}
    >
      <h4 id={`protected-head-${assignmentId}`}>Protected Circle Head</h4>
      <p>
        This is the final active Circle Head. The Circle must retain at least
        one active Circle Head, so Suspend and Remove are unavailable.
      </p>
      <p>
        New Circle Head assignment remains unavailable until an approved
        verified-adult proposal-and-acceptance flow exists.
      </p>
    </section>
  );
}

export function AssignFamilyCoordinatorForm({
  circleId,
  membershipId,
}: {
  circleId: string;
  membershipId: string;
}) {
  const [state, action, pending] = useActionState(
    assignFamilyCoordinator,
    INITIAL,
  );
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {state.status === "error" ? (
        <div
          ref={errorRef}
          tabIndex={-1}
          role="alert"
          className="error-summary"
        >
          <h2>Role change unavailable</h2>
          <p>{state.message}</p>
        </div>
      ) : null}
      <div className="content-card">
        <h2>Family Coordinator</h2>
        <p>Coordinates approved non-medical Circle organization.</p>
        <p>
          This role cannot assign roles and grants no Care Recipient, medical,
          management, delegation, backup, or legal authority.
        </p>
        <button className="button primary" type="submit" disabled={pending}>
          {pending ? "Assigning role…" : "Assign Family Coordinator"}
        </button>
      </div>
      <div className="content-card" aria-labelledby="head-unavailable-heading">
        <h2 id="head-unavailable-heading">Circle Head</h2>
        <p>
          New Circle Head assignment is unavailable until an approved
          verified-adult proposal-and-acceptance flow exists.
        </p>
      </div>
    </form>
  );
}

export function RoleLifecycleForm({
  circleId,
  membershipId,
  assignmentId,
  expectedVersion,
  roleLabel,
  operation,
}: {
  circleId: string;
  membershipId: string;
  assignmentId: string;
  expectedVersion: number;
  roleLabel: string;
  operation: "suspend" | "remove";
}) {
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const [state, action, pending] = useActionState(
    transitionCircleRole,
    INITIAL,
  );
  const errorRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (state.status === "error") errorRef.current?.focus();
  }, [state]);
  const closeDialog = () => {
    dialogRef.current?.close();
    triggerRef.current?.focus();
  };
  return (
    <>
      <button
        ref={triggerRef}
        className={
          operation === "remove" ? "button destructive" : "button secondary"
        }
        type="button"
        onClick={() => {
          dialogRef.current?.showModal();
          cancelRef.current?.focus();
        }}
      >
        {operation === "remove" ? "Remove role" : "Suspend role"}
      </button>
      <dialog
        ref={dialogRef}
        className="navigation-dialog"
        aria-labelledby={`confirm-${operation}-${assignmentId}`}
        aria-describedby={`consequence-${operation}-${assignmentId}`}
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) closeDialog();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            if (!pending) closeDialog();
            return;
          }
          if (event.key !== "Tab") return;
          const controls = dialogRef.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled])",
          );
          if (!controls?.length) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <form action={action} className="navigation-sheet">
          <input type="hidden" name="circleId" value={circleId} />
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="expectedVersion" value={expectedVersion} />
          <input type="hidden" name="operation" value={operation} />
          <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
          {state.status === "error" ? (
            <div
              ref={errorRef}
              tabIndex={-1}
              role="alert"
              className="error-summary"
            >
              <h2>Role change unavailable</h2>
              <p>{state.message}</p>
            </div>
          ) : null}
          <h3 id={`confirm-${operation}-${assignmentId}`}>
            Confirm {operation}
          </h3>
          <p id={`consequence-${operation}-${assignmentId}`}>
            {operation === "remove" ? "Removing" : "Suspending"} {roleLabel}{" "}
            ends its future Circle-wide authority. Circle membership, Care
            Recipient ownership, and unrelated authority remain unchanged.
          </p>
          <div className="action-row">
            <button
              ref={cancelRef}
              className="button secondary"
              type="button"
              onClick={closeDialog}
              disabled={pending}
            >
              Cancel
            </button>
            <button
              className={
                operation === "remove" ? "button destructive" : "button primary"
              }
              type="submit"
              disabled={pending}
            >
              {pending ? "Saving change…" : `Confirm ${operation}`}
            </button>
          </div>
          {pending ? (
            <p role="status" aria-live="polite">
              Saving role change…
            </p>
          ) : null}
        </form>
      </dialog>
    </>
  );
}
