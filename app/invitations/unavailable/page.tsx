import { AccountShell } from "@/components/account-shell";
import { InvitationUnavailableState } from "@/components/invitation-decision";
import { requireAuthenticatedAdult } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Invitation unavailable" };

export default async function InvitationUnavailablePage() {
  const account = await requireAuthenticatedAdult();
  return (
    <AccountShell email={account.email}>
      <InvitationUnavailableState state="unavailable" />
    </AccountShell>
  );
}
