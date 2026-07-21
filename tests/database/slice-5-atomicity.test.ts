import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  generateInvitationToken,
  sql,
  type SyntheticUser,
} from "./helpers";

const CONSENT = "kinward.ownership.v1";

let head: SyntheticUser;
let circleId: string;

beforeAll(async () => {
  head = await createSyntheticUser("cr-atomic-head");
  const created = await createCircle(head.client, "CR Atomic Circle");
  if (created.error) throw created.error;
  circleId = created.data as string;
});

afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

async function installFailure(
  stage: string,
  table: string,
  operation: "insert" | "update",
  when?: string,
) {
  await sql`drop schema if exists kinward_test cascade`;
  await sql`create schema kinward_test`;
  await sql.unsafe(
    `create function kinward_test.fail_${stage}() returns trigger language plpgsql as $$ begin raise exception 'synthetic_test_failure'; end $$`,
  );
  const guard = when ? ` when (${when})` : "";
  await sql.unsafe(
    `create trigger kinward_test_fail_${stage} after ${operation} on public.${table} for each row${guard} execute function kinward_test.fail_${stage}()`,
  );
}

async function dropFailures() {
  await sql`drop schema if exists kinward_test cascade`;
}

async function proposeCounts(label: string, key: string) {
  const rows = await sql<
    { recipients: number; invitations: number; requests: number }[]
  >`
    select
      (select count(*)::int from public.care_recipients
        where circle_id = ${circleId} and display_label = ${label}) recipients,
      (select count(*)::int from public.care_recipient_ownership_invitations inv
        join public.care_recipients r on r.id = inv.care_recipient_id
        where r.circle_id = ${circleId} and r.display_label = ${label}) invitations,
      (select count(*)::int from public.ownership_proposal_requests
        where user_id = ${head.id} and idempotency_key = ${key}) requests
  `;
  return rows[0];
}

describe("Slice 5 proposal atomic rollback", () => {
  for (const [stage, table, operation, when] of [
    ["prop_request", "ownership_proposal_requests", "insert", undefined],
    ["prop_recipient", "care_recipients", "insert", "new.status = 'proposed'"],
    [
      "prop_invitation",
      "care_recipient_ownership_invitations",
      "insert",
      undefined,
    ],
    [
      "prop_audit",
      "audit_events",
      "insert",
      "new.event_type = 'care_recipient.proposed'",
    ],
  ] as const) {
    it(`rolls back the whole proposal after ${stage} fails`, async () => {
      const target = await createSyntheticUser(`cr-atomic-${stage}`);
      const label = `Atomic Propose ${stage} ${crypto.randomUUID().slice(0, 8)}`;
      const key = crypto.randomUUID();
      await installFailure(stage, table, operation, when);
      const attempt = await head.client.rpc("propose_care_recipient", {
        p_circle_id: circleId,
        p_display_label: label,
        p_invited_email: target.email,
        p_token_digest: generateInvitationToken().digest,
        p_idempotency_key: key,
      });
      expect(attempt.error).not.toBeNull();
      expect(await proposeCounts(label, key)).toEqual({
        recipients: 0,
        invitations: 0,
        requests: 0,
      });
      await dropFailures();

      const retry = await head.client.rpc("propose_care_recipient", {
        p_circle_id: circleId,
        p_display_label: label,
        p_invited_email: target.email,
        p_token_digest: generateInvitationToken().digest,
        p_idempotency_key: key,
      });
      expect(retry.error).toBeNull();
      expect((retry.data as { created: boolean }).created).toBe(true);
      expect(await proposeCounts(label, key)).toEqual({
        recipients: 1,
        invitations: 1,
        requests: 1,
      });
    });
  }
});

describe("Slice 5 acceptance atomic rollback", () => {
  const stages = [
    {
      name: "membership",
      table: "circle_memberships",
      operation: "insert" as const,
    },
    {
      name: "acceptance",
      table: "ownership_acceptance_records",
      operation: "insert" as const,
    },
    {
      name: "consent",
      table: "consent_records",
      operation: "insert" as const,
    },
    {
      name: "activation",
      table: "care_recipients",
      operation: "update" as const,
      when: "new.status = 'active'",
    },
    {
      name: "invitation_accepted",
      table: "care_recipient_ownership_invitations",
      operation: "update" as const,
      when: "new.status = 'accepted'",
    },
    {
      name: "accept_audit",
      table: "audit_events",
      operation: "insert" as const,
      when: "new.event_type = 'care_recipient.owner_accepted'",
    },
  ];

  for (const stage of stages) {
    it(`rolls back the whole acceptance after ${stage.name} fails`, async () => {
      const invitee = await createSyntheticUser(
        `cr-atomic-accept-${stage.name}`,
      );
      const token = generateInvitationToken();
      const created = await head.client.rpc("propose_care_recipient", {
        p_circle_id: circleId,
        p_display_label: `Atomic Accept ${stage.name} ${crypto
          .randomUUID()
          .slice(0, 8)}`,
        p_invited_email: invitee.email,
        p_token_digest: token.digest,
        p_idempotency_key: crypto.randomUUID(),
      });
      const recipientId = (created.data as { care_recipient_id: string })
        .care_recipient_id;

      const when =
        stage.name === "membership"
          ? `new.user_id = '${invitee.id}'`
          : stage.when;
      await installFailure(stage.name, stage.table, stage.operation, when);

      const attempt = await invitee.client.rpc("accept_ownership_invitation", {
        p_token_digest: token.digest,
        p_consent_version: CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      });
      expect(attempt.error).not.toBeNull();

      const state = await sql<
        {
          status: string;
          owner_user_id: string | null;
          token_digest: string;
          invitation_status: string;
          acceptances: number;
          consents: number;
          memberships: number;
          accept_audits: number;
        }[]
      >`
        select
          r.status,
          r.owner_user_id,
          inv.token_digest,
          inv.status as invitation_status,
          (select count(*)::int from public.ownership_acceptance_records
            where care_recipient_id = r.id) acceptances,
          (select count(*)::int from public.consent_records
            where care_recipient_id = r.id) consents,
          (select count(*)::int from public.circle_memberships
            where circle_id = ${circleId} and user_id = ${invitee.id}) memberships,
          (select count(*)::int from public.audit_events
            where target_id = r.id
              and event_type in ('care_recipient.owner_accepted', 'care_recipient.activated')) accept_audits
        from public.care_recipients r
        join public.care_recipient_ownership_invitations inv
          on inv.care_recipient_id = r.id
        where r.id = ${recipientId}`;
      expect(state[0]).toEqual({
        status: "proposed",
        owner_user_id: null,
        token_digest: token.digest,
        invitation_status: "pending",
        acceptances: 0,
        consents: 0,
        memberships: 0,
        accept_audits: 0,
      });

      await dropFailures();

      const retry = await invitee.client.rpc("accept_ownership_invitation", {
        p_token_digest: token.digest,
        p_consent_version: CONSENT,
        p_idempotency_key: crypto.randomUUID(),
      });
      expect(retry.error).toBeNull();
      expect((retry.data as { outcome: string }).outcome).toBe("accepted");
      const finalRow = await sql<
        { status: string; owner_user_id: string | null }[]
      >`select status, owner_user_id from public.care_recipients where id = ${recipientId}`;
      expect(finalRow[0]).toEqual({
        status: "active",
        owner_user_id: invitee.id,
      });
    });
  }
});
