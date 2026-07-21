"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { switchCareRecipient } from "@/app/actions/care-recipients";
import { ContextRequestGuard } from "@/lib/protected-state";

const CLEAR_RECIPIENT_CONTEXT_EVENT = "kinward:clear-recipient-context";

type Destination = "circle-wide" | (string & {});

export function RecipientSwitcher({
  circleId,
  circleName,
  recipients,
  current = "circle-wide",
}: {
  circleId: string;
  circleName: string;
  recipients: { id: string; displayLabel: string }[];
  current?: "circle-wide" | string;
}) {
  const [selected, setSelected] = useState<Destination>(current);
  const guard = useRef(new ContextRequestGuard());

  function beginSwitch() {
    guard.current.clear();
    window.dispatchEvent(new Event(CLEAR_RECIPIENT_CONTEXT_EVENT));
  }

  return (
    <form
      action={switchCareRecipient}
      className="form-stack"
      onSubmit={beginSwitch}
    >
      <input type="hidden" name="circleId" value={circleId} />
      <p className="status-copy">Circle — {circleName}</p>
      <fieldset className="role-group">
        <legend>Choose context</legend>
        <div className="radio-card-list">
          <label className="radio-card">
            <input
              type="radio"
              name="destination"
              value="circle-wide"
              checked={selected === "circle-wide"}
              onChange={() => setSelected("circle-wide")}
              aria-describedby="circle-wide-scope"
            />
            <span>
              <strong>Circle-wide</strong>
              <span className="radio-card-help" id="circle-wide-scope">
                Circle coordination only. No Care Recipient private information.
              </span>
            </span>
          </label>
          {recipients.map((recipient) => (
            <label className="radio-card" key={recipient.id}>
              <input
                type="radio"
                name="destination"
                value={recipient.id}
                checked={selected === recipient.id}
                onChange={() => setSelected(recipient.id)}
              />
              <span>
                <strong>{recipient.displayLabel}</strong>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <p id="switcher-help">Only contexts you can access are listed.</p>
      <button className="button primary" type="submit">
        Switch context
      </button>
      <Link className="button secondary" href={`/circles/${circleId}`}>
        Cancel
      </Link>
    </form>
  );
}
