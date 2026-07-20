import { beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import {
  anonymous,
  createCircle,
  createSyntheticUser,
  sql,
  type SyntheticUser,
} from "./helpers";

let a: SyntheticUser,
  b: SyntheticUser,
  c: SyntheticUser,
  d: SyntheticUser,
  unverified: SyntheticUser,
  missingProfile: SyntheticUser;
let circleA: string, circleB: string;

beforeAll(async () => {
  [a, b, c, d, unverified, missingProfile] = await Promise.all([
    createSyntheticUser("user-a"),
    createSyntheticUser("user-b"),
    createSyntheticUser("user-c"),
    createSyntheticUser("user-d"),
    createSyntheticUser("user-unverified", false),
    createSyntheticUser("user-missing-profile"),
  ]);
  const [resultA, resultB] = await Promise.all([
    createCircle(a.client, "Synthetic Circle A"),
    createCircle(b.client, "Synthetic Circle B"),
  ]);
  if (resultA.error || resultB.error) throw resultA.error ?? resultB.error;
  circleA = resultA.data as string;
  circleB = resultB.data as string;
  await sql`update public.user_profiles set account_status = 'disabled' where user_id = ${d.id}`;
  await sql`delete from public.user_profiles where user_id = ${missingProfile.id}`;
});

describe("executable RLS allow and deny proof", () => {
  it("allows each active member to read only their Circle, membership, and role", async () => {
    const [aCircles, bCircles, aMemberships, aRoles] = await Promise.all([
      a.client.from("family_circles").select("id,display_name"),
      b.client.from("family_circles").select("id,display_name"),
      a.client.from("circle_memberships").select("circle_id,user_id"),
      a.client.from("circle_role_assignments").select("circle_id,role_code"),
    ]);
    expect(aCircles.data).toEqual([
      { id: circleA, display_name: "Synthetic Circle A" },
    ]);
    expect(bCircles.data).toEqual([
      { id: circleB, display_name: "Synthetic Circle B" },
    ]);
    expect(aMemberships.data).toEqual([{ circle_id: circleA, user_id: a.id }]);
    expect(aRoles.data).toEqual([
      { circle_id: circleA, role_code: "circle_head" },
    ]);
  });

  it("AT-021 returns no cross-Circle or guessed-ID information", async () => {
    for (const [client, deniedId] of [
      [a.client, circleB],
      [b.client, circleA],
      [c.client, circleA],
    ] as const) {
      const result = await client
        .from("family_circles")
        .select("id,display_name")
        .eq("id", deniedId);
      expect(result.error).toBeNull();
      expect(result.data).toEqual([]);
    }
    const guessed = await a.client
      .from("family_circles")
      .select("id,display_name")
      .eq("id", crypto.randomUUID());
    expect(guessed.data).toEqual([]);
  });

  it("authentication alone, anonymous access, creator metadata, and inactive membership grant zero access", async () => {
    expect((await c.client.from("family_circles").select("id")).data).toEqual(
      [],
    );
    expect(
      (await anonymous.from("family_circles").select("id")).error,
    ).not.toBeNull();
    const creatorOnly = await sql<
      { id: string }[]
    >`insert into public.family_circles(display_name, creator_user_id) values ('Synthetic Creator Metadata', ${c.id}) returning id`;
    expect(
      (
        await c.client
          .from("family_circles")
          .select("id")
          .eq("id", creatorOnly[0].id)
      ).data,
    ).toEqual([]);
    await sql`insert into public.circle_memberships(circle_id,user_id,status) values (${creatorOnly[0].id},${c.id},'suspended')`;
    expect(
      (
        await c.client
          .from("family_circles")
          .select("id")
          .eq("id", creatorOnly[0].id)
      ).data,
    ).toEqual([]);
  });

  it("blocks direct inserts, authority creation, update, and delete", async () => {
    const attempts = [
      a.client
        .from("family_circles")
        .insert({ display_name: "Bypass", creator_user_id: a.id }),
      a.client
        .from("circle_memberships")
        .insert({ circle_id: circleB, user_id: a.id }),
      a.client.from("circle_role_assignments").insert({
        circle_id: circleB,
        membership_id: crypto.randomUUID(),
        role_code: "circle_head",
        assigned_by_user_id: a.id,
      }),
      a.client
        .from("family_circles")
        .update({ display_name: "Changed" })
        .eq("id", circleB),
      a.client.from("family_circles").delete().eq("id", circleB),
    ];
    for (const result of await Promise.all(attempts))
      expect(result.error).not.toBeNull();
    expect(
      (
        await a.client
          .from("circle_memberships")
          .select("id")
          .eq("user_id", b.id)
      ).data,
    ).toEqual([]);
    expect(
      (
        await a.client
          .from("circle_role_assignments")
          .select("id")
          .eq("circle_id", circleB)
      ).data,
    ).toEqual([]);
  });

  it("keeps RLS effective and app audit reads denied after RPC completion", async () => {
    expect(
      (await a.client.from("family_circles").select("id").eq("id", circleB))
        .data,
    ).toEqual([]);
    expect(
      (await a.client.from("audit_events").select("id")).error,
    ).not.toBeNull();
    const audits = await sql<
      { event_type: string }[]
    >`select event_type from public.audit_events where circle_id = ${circleA} order by event_type`;
    expect(audits.map((event) => event.event_type)).toEqual([
      "circle_role.assigned",
      "circle.created",
      "membership.created",
    ]);
    const forge = await a.client.from("audit_events").insert({
      event_class: "security",
      event_type: "forged",
      target_type: "access_attempt",
      target_id: crypto.randomUUID(),
      result: "denied",
      correlation_id: crypto.randomUUID(),
    });
    expect(forge.error).not.toBeNull();
  });

  it("enforces append-only audit history and same-Circle role integrity even for owner SQL", async () => {
    const audit = await sql<
      { id: string }[]
    >`select id from public.audit_events where circle_id = ${circleA} limit 1`;
    await expect(
      sql`update public.audit_events set result='failed' where id=${audit[0].id}`,
    ).rejects.toMatchObject({ code: "55000" });
    await expect(
      sql`delete from public.audit_events where id=${audit[0].id}`,
    ).rejects.toMatchObject({ code: "55000" });
    await expect(sql`truncate public.audit_events`).rejects.toMatchObject({
      code: "55000",
    });
    const membershipB = await sql<
      { id: string }[]
    >`select id from public.circle_memberships where circle_id=${circleB} limit 1`;
    await expect(
      sql`insert into public.circle_role_assignments(circle_id,membership_id,role_code,assigned_by_user_id) values (${circleA},${membershipB[0].id},'circle_head',${a.id})`,
    ).rejects.toMatchObject({ code: "23503" });
  });
});

describe("RPC authorization and privacy", () => {
  it("denies anonymous, inactive-profile, and malformed callers", async () => {
    const anonymousResult = await createCircle(anonymous, "Anonymous Circle");
    expect(anonymousResult.error).not.toBeNull();
    expect(
      (await createCircle(unverified.client, "Unverified Circle")).error,
    ).not.toBeNull();
    expect(
      (await createCircle(d.client, "Inactive Circle")).error,
    ).not.toBeNull();
    expect(
      (await createCircle(missingProfile.client, "Missing Profile Circle"))
        .error,
    ).not.toBeNull();
    expect((await createCircle(a.client, "x")).error).not.toBeNull();
    expect((await createCircle(a.client, "x".repeat(61))).error).not.toBeNull();
    expect(JSON.stringify(anonymousResult.error)).not.toContain(circleA);
    expect(JSON.stringify(anonymousResult.error)).not.toContain(
      "Synthetic Circle A",
    );
  });

  it("does not accept identity, member, role, or existing-Circle authority parameters", async () => {
    for (const forbidden of [
      { p_user_id: b.id },
      { p_member_user_id: b.id },
      { p_role_code: "circle_head" },
      { p_circle_id: circleB },
    ]) {
      const result = await a.client.rpc("create_family_circle", {
        p_display_name: "Invalid Signature",
        p_idempotency_key: crypto.randomUUID(),
        ...forbidden,
      } as never);
      expect(result.error).not.toBeNull();
      expect(result.data).toBeNull();
    }
    const args = await sql<
      { argument_names: string[] }[]
    >`select proargnames argument_names from pg_proc where oid = 'public.create_family_circle(text,uuid)'::regprocedure`;
    expect(args[0].argument_names).toEqual([
      "p_display_name",
      "p_idempotency_key",
    ]);
    const hardening = await sql<{ proname: string; settings: string[] }[]>`
      select proname, proconfig settings from pg_proc
      where oid in ('public.create_family_circle(text,uuid)'::regprocedure, 'public.record_circle_access_denied(uuid,uuid)'::regprocedure)
      order by proname
    `;
    expect(hardening).toEqual([
      { proname: "create_family_circle", settings: ['search_path=""'] },
      { proname: "record_circle_access_denied", settings: ['search_path=""'] },
    ]);
  });

  it("persists only privacy-safe denial fields", async () => {
    const correlation = crypto.randomUUID();
    const attemptedContext = crypto.randomUUID();
    expect(
      (
        await a.client.rpc("record_circle_access_denied", {
          p_correlation_id: correlation,
          p_attempted_context_id: attemptedContext,
        })
      ).error,
    ).toBeNull();
    const rows = await sql<
      {
        circle_id: string | null;
        event_type: string;
        target_type: string;
        target_id: string;
        prior_state: unknown;
        next_state: unknown;
        attempted_context_fingerprint: string;
      }[]
    >`
      select circle_id,event_type,target_type,target_id,prior_state,next_state,attempted_context_fingerprint from public.audit_events where correlation_id=${correlation}`;
    expect(rows).toEqual([
      {
        circle_id: null,
        event_type: "circle.access_denied",
        target_type: "access_attempt",
        target_id: correlation,
        prior_state: null,
        next_state: null,
        attempted_context_fingerprint: createHash("sha256")
          .update(attemptedContext)
          .digest("hex"),
      },
    ]);
    expect(JSON.stringify(rows)).not.toContain(circleB);
    expect(JSON.stringify(rows)).not.toContain(attemptedContext);
    expect(JSON.stringify(rows)).not.toContain("Synthetic Circle");
  });
});
