"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  selectCareManagementMode,
  type ManagementModeActionState,
} from "@/app/actions/management-modes";
import {
  MANAGEMENT_MODE_COPY,
  type ManagementModeCode,
} from "@/lib/management-mode-catalog";

const INITIAL: ManagementModeActionState = { status: "idle" };

export function SelectManagementModeForm({
  circleId,
  careRecipientId,
  expectedVersion,
  currentModeCode,
}: {
  circleId: string;
  careRecipientId: string;
  expectedVersion: number;
  currentModeCode: ManagementModeCode | null;
}) {
  const [state, action, pending] = useActionState(
    selectCareManagementMode,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const [selected, setSelected] = useState<ManagementModeCode | null>(
    currentModeCode,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const clear = () => {
      dialog.current?.close();
      setConfirmOpen(false);
    };
    window.addEventListener("kinward:clear-recipient-context", clear);
    window.addEventListener("kinward:clear-circle-context", clear);
    return () => {
      window.removeEventListener("kinward:clear-recipient-context", clear);
      window.removeEventListener("kinward:clear-circle-context", clear);
    };
  }, []);

  useEffect(() => {
    if (!confirmOpen) return;
    dialog.current?.showModal();
    cancel.current?.focus();
  }, [confirmOpen]);

  const close = () => {
    dialog.current?.close();
    setConfirmOpen(false);
    trigger.current?.focus();
  };

  const selectedCopy = selected ? MANAGEMENT_MODE_COPY[selected] : null;
  const changingAway =
    currentModeCode !== null &&
    selected !== null &&
    selected !== currentModeCode;

  return (
    <>
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (!selected) return;
          setConfirmOpen(true);
        }}
      >
        <input type="hidden" name="circleId" value={circleId} />
        <input type="hidden" name="careRecipientId" value={careRecipientId} />
        <input type="hidden" name="expectedVersion" value={expectedVersion} />
        <input type="hidden" name="idempotencyKey" value={key} />
        {state.status === "error" ? (
          <div tabIndex={-1} role="alert" className="error-summary">
            <h2>Management mode unavailable</h2>
            <p>{state.message}</p>
          </div>
        ) : null}
        <fieldset>
          <legend>Choose a Care Management Mode</legend>
          <div className="stack-list" role="radiogroup" aria-label="Modes">
            {(
              Object.entries(MANAGEMENT_MODE_COPY) as Array<
                [
                  ManagementModeCode,
                  (typeof MANAGEMENT_MODE_COPY)[ManagementModeCode],
                ]
              >
            ).map(([code, copy]) => {
              const isSelected = selected === code;
              return (
                <label className="content-card" key={code}>
                  <input
                    type="radio"
                    name="modeCode"
                    value={code}
                    checked={isSelected}
                    required
                    onChange={() => setSelected(code)}
                  />
                  <strong>
                    {isSelected ? "Selected — " : ""}
                    {copy.label}
                  </strong>
                  <span>{copy.summary}</span>
                  <span>{copy.consequence}</span>
                  <span>{copy.boundary}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <button
          ref={trigger}
          className="button primary"
          type="submit"
          disabled={pending || !selected}
        >
          {pending ? "Saving mode…" : "Review selected mode"}
        </button>
        {pending ? <p role="status">Saving Care Management Mode…</p> : null}
      </form>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        aria-labelledby="management-mode-confirm"
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
        {confirmOpen && selectedCopy && selected ? (
          <form action={action} className="navigation-sheet">
            <input type="hidden" name="circleId" value={circleId} />
            <input
              type="hidden"
              name="careRecipientId"
              value={careRecipientId}
            />
            <input
              type="hidden"
              name="expectedVersion"
              value={expectedVersion}
            />
            <input type="hidden" name="idempotencyKey" value={key} />
            <input type="hidden" name="modeCode" value={selected} />
            {state.status === "error" ? (
              <div role="alert" className="error-summary">
                <h2>Management mode unavailable</h2>
                <p>{state.message}</p>
              </div>
            ) : null}
            <h2 id="management-mode-confirm">Confirm {selectedCopy.label}</h2>
            <p>{selectedCopy.consequence}</p>
            <p>{selectedCopy.boundary}</p>
            {changingAway ? (
              <p>
                Changing modes does not rewrite existing Care Recipient roles.
                Shared or Delegated grants are not created by this selection.
              </p>
            ) : null}
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
                className="button primary"
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving mode…" : `Use ${selectedCopy.label}`}
              </button>
            </div>
            {pending ? <p role="status">Saving Care Management Mode…</p> : null}
          </form>
        ) : null}
      </dialog>
    </>
  );
}
