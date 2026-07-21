import { afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  TEST_PASSWORD,
  type SyntheticUser,
} from "./helpers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.KINWARD_TEST_SUPABASE_URL!;
const anonKey = process.env.KINWARD_TEST_SUPABASE_ANON_KEY!;

let owner: SyntheticUser,
  member: SyntheticUser,
  circle: string,
  recipient: string,
  membership: string;

async function openOwnerSession(): Promise<SupabaseClient> {
  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const signedIn = await client.auth.signInWithPassword({
    email: owner.email,
    password: TEST_PASSWORD,
  });
  if (signedIn.error) throw signedIn.error;
  return client;
}

async function terminateAbortedTestSessions() {
  await sql`
    select pg_terminate_backend(pid)
    from pg_stat_activity
    where pid <> pg_backend_pid()
      and datname = current_database()
      and (
        state = 'idle in transaction'
        or state = 'idle in transaction (aborted)'
        or (state = 'active' and wait_event_type = 'Lock')
      )
      and query ilike '%transition_recipient_role%'
  `;
}

beforeAll(async () => {
  owner = await createSyntheticUser("slice7-lifecycle-owner");
  member = await createSyntheticUser("slice7-lifecycle-member");
  circle = (await createCircle(owner.client, "Lifecycle Race Circle"))
    .data as string;
  membership = (
    await sql<
      { id: string }[]
    >`insert into public.circle_memberships(circle_id,user_id) values(${circle},${member.id}) returning id`
  )[0].id;
  recipient = (
    (
      await owner.client.rpc("self_activate_care_recipient", {
        p_circle_id: circle,
        p_display_label: "Lifecycle Recipient",
        p_idempotency_key: crypto.randomUUID(),
        p_consent_version: "kinward.ownership.v1",
      })
    ).data as { care_recipient_id: string }
  ).care_recipient_id;
});

afterEach(async () => {
  await terminateAbortedTestSessions();
});

const assign = (role: string, key = crypto.randomUUID()) =>
  owner.client.rpc("assign_recipient_role", {
    p_circle_id: circle,
    p_care_recipient_id: recipient,
    p_membership_id: membership,
    p_role_code: role,
    p_idempotency_key: key,
  });

const transition = (
  client: SupabaseClient,
  id: string,
  op: "suspend" | "remove",
  key = crypto.randomUUID(),
) =>
  client.rpc("transition_recipient_role", {
    p_assignment_id: id,
    p_operation: op,
    p_expected_version: 1,
    p_idempotency_key: key,
  });

describe("Slice 7 governed lifecycle races", () => {
  it.each([
    ["medical_lead", "suspend"],
    ["chemo_care_lead", "remove"],
  ] as const)(
    "assign versus %s settles terminal without overlap",
    async (role, op) => {
      const first = await assign(role);
      const id = (first.data as { assignment_id: string }).assignment_id;
      const [duplicate, terminal] = await Promise.all([
        assign(role),
        transition(owner.client, id, op),
      ]);
      expect(terminal.error).toBeNull();
      expect(
        duplicate.error === null ||
          duplicate.error?.message === "role_lifecycle_closed",
      ).toBe(true);
      const state = await sql<
        { rows: number; active: number; status: string; audits: number }[]
      >`select count(*)::int rows,count(*) filter(where status='active')::int active,max(status) status,
      (select count(*)::int from public.audit_events where target_id=${id} and event_type=${`recipient_role.${op === "suspend" ? "suspended" : "removed"}`}) audits
      from public.care_recipient_role_assignments where care_recipient_id=${recipient} and membership_id=${membership} and role_code=${role}`;
      expect(state[0]).toEqual({
        rows: 1,
        active: 0,
        status: op === "suspend" ? "suspended" : "removed",
        audits: 1,
      });
      const permissionCode =
        role === "medical_lead"
          ? "recipient.coordinate_healthcare_team_information"
          : "recipient.coordinate_treatment_logistics";
      const permission = await sql<
        { allowed: boolean }[]
      >`select public.kinward_has_recipient_permission(
        ${circle}, ${recipient}, ${member.id}, ${permissionCode}
      ) allowed`;
      expect(permission[0].allowed).toBe(false);
    },
  );

  it("suspend versus remove has one winner and a safe stale conflict", async () => {
    const first = await assign("care_lead");
    const id = (first.data as { assignment_id: string }).assignment_id;
    const suspendKey = crypto.randomUUID();
    const removeKey = crypto.randomUUID();
    const suspendClient = await openOwnerSession();
    const removeClient = await openOwnerSession();
    let suspend: Awaited<ReturnType<typeof transition>>;
    let remove: Awaited<ReturnType<typeof transition>>;
    try {
      [suspend, remove] = await Promise.all([
        transition(suspendClient, id, "suspend", suspendKey),
        transition(removeClient, id, "remove", removeKey),
      ]);
    } finally {
      await Promise.allSettled([
        suspendClient.auth.signOut(),
        removeClient.auth.signOut(),
        terminateAbortedTestSessions(),
      ]);
    }

    const winners = [suspend, remove].filter((result) => !result.error);
    const losers = [suspend, remove].filter((result) => result.error);
    expect(winners).toHaveLength(1);
    expect(losers).toHaveLength(1);
    expect(losers[0].error?.message).toBe("stale_state");
    const winningStatus = (winners[0].data as { status: string }).status;
    expect(["suspended", "removed"]).toContain(winningStatus);
    const winnerKey = suspend.error ? removeKey : suspendKey;
    const loserKey = suspend.error ? suspendKey : removeKey;

    const state = await sql<
      {
        active: number;
        version: number;
        status: string;
        events: number;
        winner_requests: number;
        winner_completed: number;
        loser_requests: number;
      }[]
    >`select
      count(*) filter(where status='active')::int as active,
      max(version)::int as version,
      max(status) as status,
      (select count(*)::int from public.audit_events
        where target_id=${id}
          and event_type in ('recipient_role.suspended','recipient_role.removed')) as events,
      (select count(*)::int from public.care_recipient_role_mutation_requests
        where idempotency_key=${winnerKey}) as winner_requests,
      (select count(*)::int from public.care_recipient_role_mutation_requests
        where idempotency_key=${winnerKey} and result is not null) as winner_completed,
      (select count(*)::int from public.care_recipient_role_mutation_requests
        where idempotency_key=${loserKey}) as loser_requests
      from public.care_recipient_role_assignments where id=${id}`;
    expect(state[0]).toEqual({
      active: 0,
      version: 2,
      status: winningStatus,
      events: 1,
      winner_requests: 1,
      winner_completed: 1,
      loser_requests: 0,
    });

    const permission = await sql<
      { allowed: boolean }[]
    >`select public.kinward_has_recipient_permission(
      ${circle}, ${recipient}, ${member.id}, 'recipient.coordinate_practical_support'
    ) allowed`;
    expect(permission[0].allowed).toBe(false);

    const leftover = await sql<{ stuck: number }[]>`select count(*)::int stuck
      from pg_stat_activity
      where pid <> pg_backend_pid()
        and datname = current_database()
        and state in ('idle in transaction', 'idle in transaction (aborted)')
        and query ilike '%transition_recipient_role%'`;
    expect(leftover[0].stuck).toBe(0);
  });

  it.each(["suspend", "remove"] as const)(
    "duplicate %s is idempotent with one audit",
    async (op) => {
      const isolatedRecipient = (
        (
          await owner.client.rpc("self_activate_care_recipient", {
            p_circle_id: circle,
            p_display_label: `Duplicate ${op} Recipient`,
            p_idempotency_key: crypto.randomUUID(),
            p_consent_version: "kinward.ownership.v1",
          })
        ).data as { care_recipient_id: string }
      ).care_recipient_id;
      const role = "backup_caregiver";
      const first = await owner.client.rpc("assign_recipient_role", {
        p_circle_id: circle,
        p_care_recipient_id: isolatedRecipient,
        p_membership_id: membership,
        p_role_code: role,
        p_idempotency_key: crypto.randomUUID(),
      });
      const id = (first.data as { assignment_id: string }).assignment_id;
      const key = crypto.randomUUID();
      const isolatedTransition = () =>
        owner.client.rpc("transition_recipient_role", {
          p_assignment_id: id,
          p_operation: op,
          p_expected_version: 1,
          p_idempotency_key: key,
        });
      const [one, two] = await Promise.all([
        isolatedTransition(),
        isolatedTransition(),
      ]);
      expect(one.error).toBeNull();
      expect(two.error).toBeNull();
      expect(two.data).toEqual(one.data);
      const events = await sql<
        { count: number }[]
      >`select count(*)::int count from public.audit_events where correlation_id=${key}`;
      expect(events[0].count).toBe(1);
    },
  );
});
