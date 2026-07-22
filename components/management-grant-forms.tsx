"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createPendingDelegatedGrant,
  createSharedManagementGrant,
  type ManagementGrantActionState,
} from "@/app/actions/management-grants";
import {
  EXCLUDED_OWNERSHIP_SCOPE,
  MANAGEMENT_SCOPE_COPY,
  type ManagementScopeCode,
} from "@/lib/management-grant-catalog";

const INITIAL: ManagementGrantActionState = { status: "idle" };

function ScopeFields({
  selectionMode,
  setSelectionMode,
  selected,
  setSelected,
}: {
  selectionMode: "selected" | "all_current";
  setSelectionMode: (mode: "selected" | "all_current") => void;
  selected: ManagementScopeCode[];
  setSelected: (codes: ManagementScopeCode[]) => void;
}) {
  return (
    <>
      <fieldset>
        <legend>How should scopes be chosen?</legend>
        <label className="content-card">
          <input
            type="radio"
            name="selectionMode"
            value="selected"
            checked={selectionMode === "selected"}
            onChange={() => setSelectionMode("selected")}
          />
          <strong>Selected scopes</strong>
          <span>Choose exact management permissions for this adult.</span>
        </label>
        <label className="content-card">
          <input
            type="radio"
            name="selectionMode"
            value="all_current"
            checked={selectionMode === "all_current"}
            onChange={() => {
              setSelectionMode("all_current");
              setSelected([
                "recipient.manage_roles",
                "recipient.review_permissions",
              ]);
            }}
          />
          <strong>All current Kinward management permissions</strong>
          <span>
            Stores both current scopes as explicit rows. Future permissions are
            not added automatically.
          </span>
        </label>
      </fieldset>
      <fieldset>
        <legend>Exact scopes</legend>
        <div className="stack-list" role="group" aria-label="Grantable scopes">
          {(
            Object.entries(MANAGEMENT_SCOPE_COPY) as Array<
              [
                ManagementScopeCode,
                (typeof MANAGEMENT_SCOPE_COPY)[ManagementScopeCode],
              ]
            >
          ).map(([code, copy]) => {
            const checked =
              selectionMode === "all_current" || selected.includes(code);
            return (
              <label className="content-card" key={code}>
                <input
                  type="checkbox"
                  name="permissionCodes"
                  value={code}
                  checked={checked}
                  disabled={selectionMode === "all_current"}
                  onChange={(event) => {
                    if (selectionMode === "all_current") return;
                    setSelected(
                      event.target.checked
                        ? [...selected, code]
                        : selected.filter((item) => item !== code),
                    );
                  }}
                />
                <strong>
                  {checked ? "Included — " : "Not included — "}
                  {copy.label}
                </strong>
                <span>{copy.purpose}</span>
                <span>{copy.boundary}</span>
              </label>
            );
          })}
          <div className="content-card" aria-disabled="true">
            <strong>Never included — {EXCLUDED_OWNERSHIP_SCOPE.label}</strong>
            <span>{EXCLUDED_OWNERSHIP_SCOPE.boundary}</span>
          </div>
        </div>
        <p>
          {selectionMode === "all_current"
            ? "Two scopes selected: Manage roles and Review permissions."
            : `${selected.length} scope${selected.length === 1 ? "" : "s"} selected.`}
        </p>
      </fieldset>
    </>
  );
}

export function SharedManagementGrantForm({
  circleId,
  careRecipientId,
  members,
}: {
  circleId: string;
  careRecipientId: string;
  members: Array<{ membershipId: string; displayName: string }>;
}) {
  const [state, action, pending] = useActionState(
    createSharedManagementGrant,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const [membershipId, setMembershipId] = useState("");
  const [selectionMode, setSelectionMode] = useState<
    "selected" | "all_current"
  >("selected");
  const [selected, setSelected] = useState<ManagementScopeCode[]>([]);
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

  const member = members.find((item) => item.membershipId === membershipId);
  const canReview =
    Boolean(membershipId) &&
    (selectionMode === "all_current" || selected.length > 0);

  return (
    <>
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canReview) return;
          setConfirmOpen(true);
        }}
      >
        {state.status === "error" ? (
          <div tabIndex={-1} role="alert" className="error-summary">
            <h2>Shared management unavailable</h2>
            <p>{state.message}</p>
          </div>
        ) : null}
        <fieldset>
          <legend>Choose an eligible adult</legend>
          <div className="stack-list">
            {members.map((item) => (
              <label className="content-card" key={item.membershipId}>
                <input
                  type="radio"
                  name="membershipId"
                  value={item.membershipId}
                  checked={membershipId === item.membershipId}
                  required
                  onChange={() => setMembershipId(item.membershipId)}
                />
                <strong>{item.displayName}</strong>
              </label>
            ))}
          </div>
        </fieldset>
        <ScopeFields
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          selected={selected}
          setSelected={setSelected}
        />
        <button
          ref={trigger}
          className="button primary"
          type="submit"
          disabled={pending || !canReview}
        >
          {pending ? "Saving shared access…" : "Review shared access"}
        </button>
      </form>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        aria-labelledby="shared-grant-confirm"
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
        {confirmOpen && member ? (
          <form action={action} className="navigation-sheet">
            <input type="hidden" name="circleId" value={circleId} />
            <input
              type="hidden"
              name="careRecipientId"
              value={careRecipientId}
            />
            <input type="hidden" name="membershipId" value={membershipId} />
            <input type="hidden" name="selectionMode" value={selectionMode} />
            <input type="hidden" name="idempotencyKey" value={key} />
            {(selectionMode === "all_current"
              ? ([
                  "recipient.manage_roles",
                  "recipient.review_permissions",
                ] as ManagementScopeCode[])
              : selected
            ).map((code) => (
              <input
                key={code}
                type="hidden"
                name="permissionCodes"
                value={code}
              />
            ))}
            <h2 id="shared-grant-confirm">Confirm shared access</h2>
            <p>
              {member.displayName} receives only the listed scopes for this Care
              Recipient. You remain the sole owner. Access is revocable and does
              not create legal authority.
            </p>
            <div className="action-row">
              <button
                ref={cancel}
                className="button secondary"
                type="button"
                disabled={pending}
                onClick={close}
              >
                Keep editing
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving…" : "Confirm shared access"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </>
  );
}

export function DelegatedRepresentativeForm({
  circleId,
  careRecipientId,
  members,
}: {
  circleId: string;
  careRecipientId: string;
  members: Array<{ membershipId: string; displayName: string }>;
}) {
  const [membershipId, setMembershipId] = useState("");
  return (
    <form
      className="form-stack"
      action={`/circles/${circleId}/care-recipients/${careRecipientId}/management/delegated/scopes`}
      method="get"
    >
      <fieldset>
        <legend>Choose a Designated Care Representative</legend>
        <p>
          This is a Kinward grant, not legal authority. Ownership stays with
          you.
        </p>
        <div className="stack-list">
          {members.map((item) => (
            <label className="content-card" key={item.membershipId}>
              <input
                type="radio"
                name="membershipId"
                value={item.membershipId}
                required
                checked={membershipId === item.membershipId}
                onChange={() => setMembershipId(item.membershipId)}
              />
              <strong>{item.displayName}</strong>
            </label>
          ))}
        </div>
      </fieldset>
      <button className="button primary" type="submit" disabled={!membershipId}>
        Continue to scope
      </button>
    </form>
  );
}

export function PendingDelegatedScopeForm({
  circleId,
  careRecipientId,
  membershipId,
  representativeName,
}: {
  circleId: string;
  careRecipientId: string;
  membershipId: string;
  representativeName: string;
}) {
  const [state, action, pending] = useActionState(
    createPendingDelegatedGrant,
    INITIAL,
  );
  const [key] = useState(() => crypto.randomUUID());
  const [selectionMode, setSelectionMode] = useState<
    "selected" | "all_current"
  >("selected");
  const [selected, setSelected] = useState<ManagementScopeCode[]>([]);
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

  const canContinue = selectionMode === "all_current" || selected.length > 0;

  return (
    <>
      <form
        className="form-stack"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canContinue) return;
          setConfirmOpen(true);
        }}
      >
        {state.status === "error" ? (
          <div tabIndex={-1} role="alert" className="error-summary">
            <h2>Delegation draft unavailable</h2>
            <p>{state.message}</p>
          </div>
        ) : null}
        <p>
          Representative — {representativeName}. On-behalf-of actions will be
          audited only after a later activation step.
        </p>
        <ScopeFields
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          selected={selected}
          setSelected={setSelected}
        />
        <button
          ref={trigger}
          className="button primary"
          type="submit"
          disabled={pending || !canContinue}
        >
          {pending ? "Saving pending grant…" : "Continue to duration"}
        </button>
        {!canContinue ? (
          <p role="status">Select at least one scope to continue.</p>
        ) : null}
      </form>
      <dialog
        ref={dialog}
        className="navigation-dialog"
        aria-labelledby="pending-delegation-confirm"
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
        {confirmOpen ? (
          <form action={action} className="navigation-sheet">
            <input type="hidden" name="circleId" value={circleId} />
            <input
              type="hidden"
              name="careRecipientId"
              value={careRecipientId}
            />
            <input type="hidden" name="membershipId" value={membershipId} />
            <input type="hidden" name="selectionMode" value={selectionMode} />
            <input type="hidden" name="idempotencyKey" value={key} />
            {(selectionMode === "all_current"
              ? ([
                  "recipient.manage_roles",
                  "recipient.review_permissions",
                ] as ManagementScopeCode[])
              : selected
            ).map((code) => (
              <input
                key={code}
                type="hidden"
                name="permissionCodes"
                value={code}
              />
            ))}
            <h2 id="pending-delegation-confirm">Save pending delegation</h2>
            <p>
              This records a pending grant and scope snapshot only. It grants no
              authority. Duration, consent, acceptance, and activation remain
              later steps.
            </p>
            <div className="action-row">
              <button
                ref={cancel}
                className="button secondary"
                type="button"
                disabled={pending}
                onClick={close}
              >
                Keep editing
              </button>
              <button
                className="button primary"
                type="submit"
                disabled={pending}
              >
                {pending ? "Saving…" : "Save pending grant"}
              </button>
            </div>
          </form>
        ) : null}
      </dialog>
    </>
  );
}
