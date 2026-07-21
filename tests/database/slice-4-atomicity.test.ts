import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  generateInvitationToken,
  sql,
  type SyntheticUser,
} from "./helpers";

let head: SyntheticUser;
let circleId: string;

beforeAll(async () => {
  head = await createSyntheticUser("inv-atomic-head");
  const created = await createCircle(head.client, "Invite Atomic Circle");
  if (created.error) throw created.error;
  circleId = created.data as string;
});

afterAll(async () => {
  await sql`drop schema if exists kinward_test cascade`;
});

async function installFailure(
  stage: string,
  table: string,
  timing: "insert" | "update" = "insert",
) {
  await sql`drop schema if exists kinward_test cascade`;
  await sql`create schema kinward_test`;
  await sql.unsafe(
    `create function kinward_test.fail_${stage}() returns trigger language plpgsql as $$ begin raise exception 'synthetic_test_failure'; end $$`,
  );
  await sql.unsafe(
    `create trigger kinward_test_fail_${stage} after ${timing} on public.${table} for each row execute function kinward_test.fail_${stage}()`,
  );
}

async function invitationCounts(emailDigest: string) {
  const rows = await sql<
    {
      invitations: number;
      assignments: number;
      memberships: number;
      roles: number;
      audits: number;
      requests: number;
    }[]
  >`
    select
      (select count(*)::int from public.circle_invitations where invited_email_digest = ${emailDigest}) invitations,
      (select count(*)::int from public.invitation_proposed_assignments a
        join public.circle_invitations i on i.id = a.invitation_id
        where i.invited_email_digest = ${emailDigest}) assignments,
      (select count(*)::int from public.circle_memberships m
        join auth.users u on u.id = m.user_id
        where m.circle_id = ${circleId}
          and encode(extensions.digest(convert_to(lower(u.email), 'UTF8'), 'sha256'), 'hex') = ${emailDigest}) memberships,
      (select count(*)::int from public.circle_role_assignments r
        join public.circle_memberships m on m.id = r.membership_id
        join auth.users u on u.id = m.user_id
        where m.circle_id = ${circleId}
          and encode(extensions.digest(convert_to(lower(u.email), 'UTF8'), 'sha256'), 'hex') = ${emailDigest}
          and r.role_code = 'family_coordinator') roles,
      (select count(*)::int from public.audit_events a
        join public.circle_invitations i on i.id = a.target_id
        where i.invited_email_digest = ${emailDigest}) audits,
      (select count(*)::int from public.invitation_creation_requests
        where invited_email_digest = ${emailDigest}) requests
  `;
  return rows[0];
}

describe("Slice 4 invitation atomic rollback", () => {
  for (const [stage, table, timing] of [
    ["invite_request", "invitation_creation_requests", "insert"],
    ["invite_insert", "circle_invitations", "insert"],
    ["assignment_insert", "invitation_proposed_assignments", "insert"],
    ["invite_audit", "audit_events", "insert"],
  ] as const) {
    it(`rolls back create after ${stage}`, async () => {
      await installFailure(stage, table, timing);
      const email = `atomic-create-${stage}-${crypto.randomUUID()}@example.test`;
      const digest = (
        await sql<
          { d: string }[]
        >`select public.kinward_email_digest(${email}) d`
      )[0].d;
      const token = generateInvitationToken();
      expect(
        (
          await head.client.rpc("create_circle_invitation", {
            p_circle_id: circleId,
            p_invited_email: email,
            p_token_digest: token.digest,
            p_idempotency_key: crypto.randomUUID(),
          })
        ).error,
      ).not.toBeNull();
      expect(await invitationCounts(digest)).toEqual({
        invitations: 0,
        assignments: 0,
        memberships: 0,
        roles: 0,
        audits: 0,
        requests: 0,
      });
      await sql`drop schema kinward_test cascade`;
    });
  }

  for (const stage of [
    {
      name: "membership",
      table: "circle_memberships",
      operation: "insert",
      when: "new.user_id is not null",
    },
    {
      name: "role",
      table: "circle_role_assignments",
      operation: "insert",
      when: "new.role_code = 'family_coordinator'",
    },
    {
      name: "assignment",
      table: "invitation_proposed_assignments",
      operation: "update",
      when: "new.status = 'activated'",
    },
    {
      name: "invitation",
      table: "circle_invitations",
      operation: "update",
      when: "new.status = 'accepted'",
    },
    {
      name: "accept_audit",
      table: "audit_events",
      operation: "insert",
      when: "new.event_type = 'invitation.accepted'",
    },
    {
      name: "membership_audit",
      table: "audit_events",
      operation: "insert",
      when: "new.event_type = 'membership.created'",
    },
    {
      name: "role_audit",
      table: "audit_events",
      operation: "insert",
      when: "new.event_type = 'circle_role.assigned'",
    },
  ]) {
    it(`rolls back acceptance after ${stage.name}`, async () => {
      const invitee = await createSyntheticUser(`inv-atomic-${stage.name}`);
      const token = generateInvitationToken();
      const created = await head.client.rpc("create_circle_invitation", {
        p_circle_id: circleId,
        p_invited_email: invitee.email,
        p_token_digest: token.digest,
        p_idempotency_key: crypto.randomUUID(),
      });
      const invitationId = (created.data as { invitation_id: string })
        .invitation_id;
      await sql`drop schema if exists kinward_test cascade`;
      await sql`create schema kinward_test`;
      await sql.unsafe(
        `create function kinward_test.fail_${stage.name}() returns trigger language plpgsql as $$ begin raise exception 'synthetic_test_failure'; end $$`,
      );
      await sql.unsafe(
        `create trigger kinward_test_fail_${stage.name} after ${stage.operation} on public.${stage.table} for each row when (${stage.when}) execute function kinward_test.fail_${stage.name}()`,
      );
      expect(
        (
          await invitee.client.rpc("accept_circle_invitation", {
            p_token_digest: token.digest,
          })
        ).error,
      ).not.toBeNull();
      const state = await sql<
        {
          status: string;
          token_digest: string;
          memberships: number;
          roles: number;
          assignment_status: string;
          audits: number;
        }[]
      >`
        select i.status, i.token_digest,
          (select count(*)::int from public.circle_memberships where circle_id = ${circleId} and user_id = ${invitee.id}) memberships,
          (select count(*)::int from public.circle_role_assignments r join public.circle_memberships m on m.id = r.membership_id where m.circle_id = ${circleId} and m.user_id = ${invitee.id}) roles,
          (select status from public.invitation_proposed_assignments where invitation_id = i.id) assignment_status,
          (select count(*)::int from public.audit_events where target_id = i.id and event_type <> 'invitation.created') audits
        from public.circle_invitations i where i.id = ${invitationId}`;
      expect(state[0]).toEqual({
        status: "pending",
        token_digest: token.digest,
        memberships: 0,
        roles: 0,
        assignment_status: "proposed",
        audits: 0,
      });
      await sql`drop schema kinward_test cascade`;
      const accepted = await invitee.client.rpc("accept_circle_invitation", {
        p_token_digest: token.digest,
      });
      expect(accepted.data).toMatchObject({ outcome: "accepted" });
    });
  }
});
