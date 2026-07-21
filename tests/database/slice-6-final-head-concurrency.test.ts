import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let head: SyntheticUser;
let circleId: string;
let headAssignmentId: string;

beforeAll(async () => {
  head = await createSyntheticUser("final-head");
  const circle = await createCircle(head.client, "Final Head Circle");
  circleId = circle.data as string;
  const rows = await sql<{ id: string }[]>`
    select id from public.circle_role_assignments
    where circle_id = ${circleId} and role_code = 'circle_head' and status = 'active'`;
  headAssignmentId = rows[0].id;
});

describe("Slice 6 final Circle Head invariant", () => {
  it("blocks suspend and remove of the final active Head and audits each governed denial", async () => {
    const [suspend, remove] = await Promise.all([
      head.client.rpc("transition_circle_role", {
        p_assignment_id: headAssignmentId,
        p_operation: "suspend",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
      head.client.rpc("transition_circle_role", {
        p_assignment_id: headAssignmentId,
        p_operation: "remove",
        p_expected_version: 1,
        p_idempotency_key: crypto.randomUUID(),
      }),
    ]);
    expect((suspend.data as { outcome: string }).outcome).toBe(
      "final_head_blocked",
    );
    expect((remove.data as { outcome: string }).outcome).toBe(
      "final_head_blocked",
    );
    const rows = await sql<{ status: string; denials: number }[]>`
      select status,
        (select count(*)::int from public.audit_events where target_id = ${headAssignmentId}
          and event_type = 'circle_role.final_head_change_denied') denials
      from public.circle_role_assignments where id = ${headAssignmentId}`;
    expect(rows[0]).toEqual({ status: "active", denials: 2 });
  });

  it("blocks membership deactivation and direct service-role lifecycle loss", async () => {
    const membership = await sql<{ id: string }[]>`
      select id from public.circle_memberships where circle_id = ${circleId} and user_id = ${head.id}`;
    await expect(
      sql`update public.circle_memberships set status = 'removed' where id = ${membership[0].id}`,
    ).rejects.toThrow(/final_circle_head_required/);
    await expect(
      sql`update public.circle_role_assignments set status = 'removed', ends_at = now() where id = ${headAssignmentId}`,
    ).rejects.toThrow(/final_circle_head_required/);
  });
});
