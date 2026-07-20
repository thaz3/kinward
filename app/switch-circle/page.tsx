import { switchCircle } from "@/app/actions/circles";
import { AccountShell } from "@/components/account-shell";
import { EmptyState, UnavailableState } from "@/components/system-states";
import { requireAuthenticatedAdult } from "@/lib/auth/session";
import { listAuthorizedCircles } from "@/lib/circles";

export const dynamic = "force-dynamic";

export default async function SwitchCirclePage() {
  const account = await requireAuthenticatedAdult();
  const circles = await listAuthorizedCircles(account.userId);
  return (
    <AccountShell email={account.email} title="Switch Circle">
      {circles === null ? (
        <UnavailableState />
      ) : circles.length === 0 ? (
        <EmptyState
          heading="No Circles available"
          message="Create a Family Circle to begin."
          action={{ href: "/circles/new", label: "Create Circle" }}
        />
      ) : (
        <form action={switchCircle} className="content-card form-stack">
          <fieldset>
            <legend>Choose an active Circle</legend>
            {circles.map((circle) => (
              <label className="radio-row" key={circle.id}>
                <input
                  type="radio"
                  name="circleId"
                  value={circle.id}
                  required
                />
                <span>{circle.displayName}</span>
              </label>
            ))}
          </fieldset>
          <button className="button primary">Open selected Circle</button>
        </form>
      )}
    </AccountShell>
  );
}
