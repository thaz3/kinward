import { signOut } from "@/app/actions/auth";

// Consequential delegation changes require a trusted authentication recorded by
// the server within the last fifteen minutes. Confirming identity returns to
// this same screen, which re-reads the grant before offering the action again.
export function RecentAuthenticationRequired({
  returnPath,
  action,
}: {
  returnPath: string;
  action: string;
}) {
  return (
    <section className="content-card" aria-labelledby="recent-auth-heading">
      <h2 id="recent-auth-heading">Confirm it is you to continue</h2>
      <p>
        For your protection, {action} requires a recent sign-in. Confirming your
        identity brings you back to this page, and nothing changes until you
        confirm the action itself.
      </p>
      <form action={signOut}>
        <input type="hidden" name="next" value={returnPath} />
        <button className="button primary" type="submit">
          Confirm it is you
        </button>
      </form>
    </section>
  );
}
