import { redirect } from "next/navigation";
import { toAuthenticatedAdult } from "@/lib/auth/account";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getAuthenticatedAdult() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return toAuthenticatedAdult(data.user);
}

export async function requireAuthenticatedAdult() {
  const account = await getAuthenticatedAdult();
  if (!account) redirect("/sign-in?reason=session");
  return account;
}
