import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { PublicShell } from "@/components/public-shell";
import { getAuthenticatedAdult } from "@/lib/auth/session";
import { safeAuthRedirect } from "@/lib/auth/redirects";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; signedOut?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeAuthRedirect(params.next);
  if (await getAuthenticatedAdult()) redirect(next);
  return (
    <PublicShell>
      <h1>Welcome to Kinward</h1>
      <p className="tagline">Care moves better together</p>
      {params.reason === "session" && (
        <div className="neutral-alert" role="status">
          <h2>Sign in again</h2>
          <p>Your session is unavailable or has expired. Nothing changed.</p>
        </div>
      )}
      {params.reason === "verification" && (
        <div className="neutral-alert" role="status">
          <h2>Verification link unavailable</h2>
          <p>
            The verification link is invalid or has expired. Request a new one.
          </p>
        </div>
      )}
      {params.reason === "invitation" && (
        <div className="neutral-alert" role="status">
          <h2>Sign in to continue</h2>
          <p>
            Use the invited verified email address. No Circle details appear
            until your identity matches.
          </p>
        </div>
      )}
      {params.signedOut === "1" && (
        <p className="success-summary" role="status">
          You are signed out.
        </p>
      )}
      <section className="auth-card" aria-labelledby="private-sign-in">
        <h2 id="private-sign-in">Private sign-in</h2>
        <SignInForm nextPath={next === "/my-kinward" ? undefined : next} />
        <p className="privacy-note">
          Kinward uses your verified email to sign you in. No Circle information
          appears until your identity and access are confirmed.
        </p>
      </section>
    </PublicShell>
  );
}
