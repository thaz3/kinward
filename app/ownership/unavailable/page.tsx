import { AccountShell } from "@/components/account-shell";
import { OwnershipUnavailableState } from "@/components/ownership-decision";
import { requireAuthenticatedAdult } from "@/lib/auth/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ownership unavailable" };

export default async function OwnershipUnavailablePage() {
  const account = await requireAuthenticatedAdult();
  return (
    <AccountShell email={account.email} title="Care Recipient ownership">
      <OwnershipUnavailableState />
    </AccountShell>
  );
}
