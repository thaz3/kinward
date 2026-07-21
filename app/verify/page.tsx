import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { VerificationForm } from "@/components/auth/verification-form";
import { PublicShell } from "@/components/public-shell";
import { getAuthenticatedAdult } from "@/lib/auth/session";
import {
  maskEmail,
  openPendingEmail,
  PENDING_EMAIL_COOKIE,
} from "@/lib/auth/pending-email";
import { safeAuthRedirect } from "@/lib/auth/redirects";

export const metadata = { title: "Verify your email" };
export const dynamic = "force-dynamic";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const next = safeAuthRedirect(params.next);
  if (await getAuthenticatedAdult()) redirect(next);
  const cookieStore = await cookies();
  const email = openPendingEmail(cookieStore.get(PENDING_EMAIL_COOKIE)?.value);
  if (!email) redirect("/sign-in?reason=session");
  return (
    <PublicShell>
      <section className="auth-card" aria-labelledby="verify-heading">
        <h1 id="verify-heading">Verify your email</h1>
        <VerificationForm
          maskedEmail={maskEmail(email)}
          nextPath={next === "/my-kinward" ? undefined : next}
        />
        <p className="privacy-note">
          No Circle or Care Recipient information is available during
          verification.
        </p>
      </section>
    </PublicShell>
  );
}
