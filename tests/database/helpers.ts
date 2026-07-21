import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createHash, randomBytes } from "node:crypto";
import postgres from "postgres";

const url = process.env.KINWARD_TEST_SUPABASE_URL;
const anonKey = process.env.KINWARD_TEST_SUPABASE_ANON_KEY;
const serviceKey = process.env.KINWARD_TEST_SUPABASE_SERVICE_ROLE_KEY;
const databaseUrl = process.env.KINWARD_TEST_DATABASE_URL;

if (!url || !anonKey || !serviceKey || !databaseUrl) {
  throw new Error(
    "Local database test variables are required; see SLICE_3_DATABASE_TESTING.md",
  );
}
if (
  !/^http:\/\/(127\.0\.0\.1|localhost):54321$/.test(url) ||
  !databaseUrl.includes("@127.0.0.1:54322/")
) {
  throw new Error("Database security tests refuse non-local targets");
}

export const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const anonymous = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const sql = postgres(databaseUrl, { max: 12 });
export const TEST_PASSWORD = "Synthetic-only-Password-483!";

export type SyntheticUser = {
  id: string;
  email: string;
  client: SupabaseClient;
};

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function generateInvitationToken(): {
  token: string;
  digest: string;
} {
  const token = randomBytes(32).toString("base64url");
  return { token, digest: hashInvitationToken(token) };
}

export function invitationDeliveryMarker(token: string): string {
  return createHash("sha256").update(`delivery:${token}`, "utf8").digest("hex");
}

export async function createSyntheticUser(
  label: string,
  verified = true,
): Promise<SyntheticUser> {
  const email = `${label}-${crypto.randomUUID()}@example.test`;
  const created = await admin.auth.admin.createUser({
    email,
    password: TEST_PASSWORD,
    email_confirm: verified,
  });
  if (created.error || !created.data.user)
    throw created.error ?? new Error("Synthetic user was not created");
  const client = createClient(url!, anonKey!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await client.auth.signInWithPassword({
    email,
    password: TEST_PASSWORD,
  });
  if (signedIn.error && verified) throw signedIn.error;
  return { id: created.data.user.id, email, client };
}

export async function createCircle(
  client: SupabaseClient,
  name: string,
  key = crypto.randomUUID(),
) {
  return client.rpc("create_family_circle", {
    p_display_name: name,
    p_idempotency_key: key,
  });
}

export async function countsForName(name: string) {
  const rows = await sql<
    {
      circles: number;
      memberships: number;
      roles: number;
      audits: number;
      requests: number;
    }[]
  >`
    select
      (select count(*)::int from public.family_circles where display_name = ${name}) circles,
      (select count(*)::int from public.circle_memberships m join public.family_circles c on c.id = m.circle_id where c.display_name = ${name}) memberships,
      (select count(*)::int from public.circle_role_assignments r join public.family_circles c on c.id = r.circle_id where c.display_name = ${name}) roles,
      (select count(*)::int from public.audit_events a join public.family_circles c on c.id = a.circle_id where c.display_name = ${name}) audits,
      (select count(*)::int from public.circle_creation_requests where requested_name = ${name}) requests
  `;
  return rows[0];
}
