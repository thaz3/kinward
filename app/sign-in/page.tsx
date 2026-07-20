import { redirect } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { PublicShell } from "@/components/public-shell";
import { getAuthenticatedAdult } from "@/lib/auth/session";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; signedOut?: string }>;
}) {
  if (await getAuthenticatedAdult()) redirect("/my-kinward");
  const params = await searchParams;
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
      {params.signedOut === "1" && (
        <p className="success-summary" role="status">
          You are signed out.
        </p>
      )}
      <section className="auth-card" aria-labelledby="private-sign-in">
        <h2 id="private-sign-in">Private sign-in</h2>
        <SignInForm />
        <p className="privacy-note">
          Kinward uses your verified email to sign you in. No Circle information
          appears until your identity and access are confirmed.
        </p>
      </section>
    </PublicShell>
  );
}
