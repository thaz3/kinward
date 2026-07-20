"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createCircle, type CircleActionState } from "@/app/actions/circles";

const initialState: CircleActionState = { status: "idle" };

export function CircleCreationForm({
  idempotencyKey,
}: {
  idempotencyKey: string;
}) {
  const [state, action, pending] = useActionState(createCircle, initialState);
  const [dirty, setDirty] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const keepEditing = useRef<HTMLButtonElement>(null);
  const cancel = useRef<HTMLButtonElement>(null);
  const error = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (state.status === "error") error.current?.focus();
  }, [state]);
  function closeDialog() {
    dialog.current?.close();
    cancel.current?.focus();
  }

  return (
    <>
      <form
        action={action}
        className="form-stack"
        onChange={() => setDirty(true)}
      >
        <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
        {state.status === "error" && (
          <div className="error-summary" role="alert" tabIndex={-1} ref={error}>
            <h2>{state.message}</h2>
            <p>Your entry is still here.</p>
          </div>
        )}
        <div className="field-group">
          <label htmlFor="circle-name">Circle name</label>
          <input
            id="circle-name"
            name="circleName"
            required
            minLength={2}
            maxLength={60}
            aria-invalid={Boolean(state.fieldError)}
            aria-describedby={
              state.fieldError ? "circle-name-error" : undefined
            }
          />
          {state.fieldError && (
            <p className="field-error" id="circle-name-error">
              {state.fieldError}
            </p>
          )}
        </div>
        <section className="neutral-alert" aria-labelledby="head-boundary">
          <h2 id="head-boundary">Circle Head boundary</h2>
          <p>
            You become the first Circle Head. This grants no Care Recipient
            access.
          </p>
        </section>
        {pending && (
          <p role="status" aria-live="polite">
            Creating Circle… Entered information stays visible.
          </p>
        )}
        <button className="button primary" disabled={pending} type="submit">
          {pending ? "Creating…" : "Create Circle"}
        </button>
        <button
          ref={cancel}
          className="button secondary"
          type="button"
          disabled={pending}
          onClick={() =>
            dirty ? dialog.current?.showModal() : location.assign("/my-kinward")
          }
        >
          Cancel
        </button>
      </form>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeDialog();
        }}
        onClose={() => cancel.current?.focus()}
      >
        <div className="navigation-sheet">
          <h2>Discard this unsubmitted Circle?</h2>
          <p>
            The Circle name and any settings you entered will be lost. No Circle
            has been created.
          </p>
          <div className="dialog-actions">
            <button
              ref={keepEditing}
              autoFocus
              className="button primary"
              onClick={closeDialog}
            >
              Keep editing
            </button>
            <Link className="button secondary" href="/my-kinward">
              Discard draft
            </Link>
          </div>
        </div>
      </dialog>
    </>
  );
}
