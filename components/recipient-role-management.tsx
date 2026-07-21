"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  assignRecipientRole,
  transitionRecipientRole,
  type RecipientRoleActionState,
} from "@/app/actions/recipient-roles";
import {
  RECIPIENT_ROLE_COPY,
  type RecipientRoleCode,
} from "@/lib/recipient-role-catalog";

const INITIAL: RecipientRoleActionState = { status: "idle" };

export function AssignRecipientRoleForm({
  circleId,
  careRecipientId,
  membershipId,
}: {
  circleId: string;
  careRecipientId: string;
  membershipId: string;
}) {
  const [state, action, pending] = useActionState(assignRecipientRole, INITIAL);
  const [key] = useState(() => crypto.randomUUID());
  return (
    <form action={action} className="form-stack">
      <input type="hidden" name="circleId" value={circleId} />
      <input type="hidden" name="careRecipientId" value={careRecipientId} />
      <input type="hidden" name="membershipId" value={membershipId} />
      <input type="hidden" name="idempotencyKey" value={key} />
      {state.status === "error" ? (
        <div tabIndex={-1} role="alert" className="error-summary">
          <h2>Role change unavailable</h2>
          <p>{state.message}</p>
        </div>
      ) : null}
      <fieldset>
        <legend>Choose one exact-recipient role</legend>
        <div className="stack-list">
          {(
            Object.entries(RECIPIENT_ROLE_COPY) as Array<
              [
                RecipientRoleCode,
                (typeof RECIPIENT_ROLE_COPY)[RecipientRoleCode],
              ]
            >
          ).map(([code, copy]) => (
            <label className="content-card" key={code}>
              <input type="radio" name="roleCode" value={code} required />
              <strong>{copy.label}</strong>
              <span>{copy.purpose}</span>
              <span>{copy.boundary}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="button primary" type="submit" disabled={pending}>
        {pending ? "Assigning role…" : "Assign selected role"}
      </button>
      {pending ? <p role="status">Assigning exact-recipient role…</p> : null}
    </form>
  );
}

export function RecipientRoleLifecycleForm({
  circleId,
  careRecipientId,
  membershipId,
  assignmentId,
  expectedVersion,
  roleLabel,
  operation,
}: {
  circleId: string;
  careRecipientId: string;
  membershipId: string;
  assignmentId: string;
  expectedVersion: number;
  roleLabel: string;
  operation: "suspend" | "remove";
}) {
  const [state, action, pending] = useActionState(
    transitionRecipientRole,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const clear = () => dialog.current?.close();
    window.addEventListener("kinward:clear-recipient-context", clear);
    window.addEventListener("kinward:clear-circle-context", clear);
    return () => {
      window.removeEventListener("kinward:clear-recipient-context", clear);
      window.removeEventListener("kinward:clear-circle-context", clear);
    };
  }, []);
  const close = () => {
    dialog.current?.close();
    trigger.current?.focus();
  };
  return (
    <>
      <button
        ref={trigger}
        className={
          operation === "remove" ? "button destructive" : "button secondary"
        }
        type="button"
        onClick={() => {
          dialog.current?.showModal();
          cancel.current?.focus();
        }}
      >
        {operation === "remove" ? "Remove role" : "Suspend role"}
      </button>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        aria-labelledby={`recipient-role-${operation}-${assignmentId}`}
        onCancel={(event) => {
          event.preventDefault();
          if (!pending) close();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            if (!pending) close();
            return;
          }
          if (event.key !== "Tab") return;
          const controls = dialog.current?.querySelectorAll<HTMLElement>(
            "button:not([disabled])",
          );
          if (!controls?.length) return;
          const first = controls[0],
            last = controls[controls.length - 1];
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
          <input type="hidden" name="careRecipientId" value={careRecipientId} />
          <input type="hidden" name="membershipId" value={membershipId} />
          <input type="hidden" name="assignmentId" value={assignmentId} />
          <input type="hidden" name="expectedVersion" value={expectedVersion} />
          <input type="hidden" name="operation" value={operation} />
          <input type="hidden" name="idempotencyKey" value={key} />
          {state.status === "error" ? (
            <div role="alert" className="error-summary">
              <h2>Role change unavailable</h2>
              <p>{state.message}</p>
            </div>
          ) : null}
          <h2 id={`recipient-role-${operation}-${assignmentId}`}>
            Confirm {operation}
          </h2>
          <p>
            {operation === "remove" ? "Removing" : "Suspending"} {roleLabel}{" "}
            ends its future authority for this Care Recipient only. Ownership,
            Circle membership, and unrelated roles remain unchanged.
          </p>
          <div className="action-row">
            <button
              ref={cancel}
              className="button secondary"
              type="button"
              disabled={pending}
              onClick={close}
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
            <p role="status">Saving exact-recipient role change…</p>
          ) : null}
        </form>
      </dialog>
    </>
  );
}
