import { beforeAll, describe, expect, it } from "vitest";
import {
  createCircle,
  createSyntheticUser,
  generateInvitationToken,
  sql,
  type SyntheticUser,
} from "./helpers";

const CONSENT = "kinward.ownership.v1";

let avery: SyntheticUser; // Circle Head, owns neither recipient.
let dadUser: SyntheticUser;
let momUser: SyntheticUser;
let harbor: string;
let dadId: string;
let momId: string;

async function proposeAndAccept(
  owner: SyntheticUser,
  label: string,
): Promise<string> {
  const token = generateInvitationToken();
  const proposed = await avery.client.rpc("propose_care_recipient", {
    p_circle_id: harbor,
    p_display_label: label,
    p_invited_email: owner.email,
    p_token_digest: token.digest,
    p_idempotency_key: crypto.randomUUID(),
  });
  if (proposed.error) throw proposed.error;
  const recipientId = (proposed.data as { care_recipient_id: string })
    .care_recipient_id;
  const accepted = await owner.client.rpc("accept_ownership_invitation", {
    p_token_digest: token.digest,
    p_consent_version: CONSENT,
    p_idempotency_key: crypto.randomUUID(),
  });
  if (accepted.error) throw accepted.error;
  expect((accepted.data as { outcome: string }).outcome).toBe("accepted");
  return recipientId;
}

async function ownedOutcome(
  client: SyntheticUser["client"],
  id: string,
): Promise<string> {
  const result = await client.rpc("get_owned_care_recipient", {
    p_circle_id: harbor,
    p_care_recipient_id: id,
  });
  return (result.data as { outcome: string }).outcome;
}

beforeAll(async () => {
  [avery, dadUser, momUser] = await Promise.all([
    createSyntheticUser("iso-avery"),
    createSyntheticUser("iso-dad"),
    createSyntheticUser("iso-mom"),
  ]);
  const circle = await createCircle(avery.client, "Harbor Circle");
  if (circle.error) throw circle.error;
  harbor = circle.data as string;
  dadId = await proposeAndAccept(dadUser, "Dad Harbor");
  momId = await proposeAndAccept(momUser, "Mom Harbor");
});

describe("Slice 5 Dad/Mom ownership isolation (AT-002/003/022)", () => {
  it("keeps the non-owning Circle Head out of both recipients", async () => {
    expect(await ownedOutcome(avery.client, dadId)).toBe("unavailable");
    expect(await ownedOutcome(avery.client, momId)).toBe("unavailable");
    const headSelect = await avery.client
      .from("care_recipients")
      .select("id")
      .in("id", [dadId, momId]);
    expect(headSelect.data ?? []).toEqual([]);
  });

  it("lists only Dad for dadUser and only Mom for momUser", async () => {
    const dadList = await dadUser.client.rpc("list_owned_care_recipients", {
      p_circle_id: harbor,
    });
    expect(dadList.error).toBeNull();
    const dadRows = dadList.data as { care_recipient_id: string }[];
    expect(dadRows.map((r) => r.care_recipient_id)).toEqual([dadId]);

    const momList = await momUser.client.rpc("list_owned_care_recipients", {
      p_circle_id: harbor,
    });
    expect(momList.error).toBeNull();
    const momRows = momList.data as { care_recipient_id: string }[];
    expect(momRows.map((r) => r.care_recipient_id)).toEqual([momId]);
  });

  it("returns only the caller's own recipient from a direct RLS select", async () => {
    const dadSelect = await dadUser.client
      .from("care_recipients")
      .select("id, owner_user_id")
      .eq("circle_id", harbor);
    expect(dadSelect.data).toEqual([{ id: dadId, owner_user_id: dadUser.id }]);

    const momSelect = await momUser.client
      .from("care_recipients")
      .select("id, owner_user_id")
      .eq("circle_id", harbor);
    expect(momSelect.data).toEqual([{ id: momId, owner_user_id: momUser.id }]);
  });

  it("denies dadUser reading Mom's id and momUser reading Dad's id", async () => {
    expect(await ownedOutcome(dadUser.client, momId)).toBe("unavailable");
    expect(await ownedOutcome(momUser.client, dadId)).toBe("unavailable");
    const dadReadsMom = await dadUser.client
      .from("care_recipients")
      .select("id")
      .eq("id", momId);
    expect(dadReadsMom.data ?? []).toEqual([]);
  });

  it("does not modify Mom's row when another recipient is activated", async () => {
    const before = await sql<
      {
        status: string;
        owner_user_id: string | null;
        version: string;
        activated_at: string | null;
        updated_at: string;
      }[]
    >`select status, owner_user_id, version, activated_at, updated_at
      from public.care_recipients where id = ${momId}`;

    const sibling = await createSyntheticUser("iso-sibling");
    const siblingId = await proposeAndAccept(sibling, "Sibling Harbor");
    expect(await ownedOutcome(sibling.client, siblingId)).toBe("ready");

    const after = await sql<
      {
        status: string;
        owner_user_id: string | null;
        version: string;
        activated_at: string | null;
        updated_at: string;
      }[]
    >`select status, owner_user_id, version, activated_at, updated_at
      from public.care_recipients where id = ${momId}`;
    expect(after[0]).toEqual(before[0]);
    expect(after[0].owner_user_id).toBe(momUser.id);
  });
});
