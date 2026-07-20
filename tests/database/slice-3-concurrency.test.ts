import { beforeAll, describe, expect, it } from "vitest";
import {
  countsForName,
  createCircle,
  createSyntheticUser,
  type SyntheticUser,
} from "./helpers";

let a: SyntheticUser, b: SyntheticUser;
beforeAll(async () => {
  [a, b] = await Promise.all([
    createSyntheticUser("concurrent-a"),
    createSyntheticUser("concurrent-b"),
  ]);
});
describe("real concurrent idempotency", () => {
  it("same user/key/name creates one governed outcome", async () => {
    const key = crypto.randomUUID(),
      name = "Concurrent Same Request";
    const results = await Promise.all(
      Array.from({ length: 8 }, () =>
        createCircle(a.client, `  Concurrent   Same Request  `, key),
      ),
    );
    expect(results.every((result) => !result.error)).toBe(true);
    expect(new Set(results.map((result) => result.data)).size).toBe(1);
    expect(await countsForName(name)).toEqual({
      circles: 1,
      memberships: 1,
      roles: 1,
      audits: 3,
      requests: 1,
    });
  });

  it("same user/key with a different name rejects without exposing a second result", async () => {
    const key = crypto.randomUUID();
    const first = await createCircle(
      a.client,
      "Original Idempotent Circle",
      key,
    );
    const second = await createCircle(
      a.client,
      "Different Idempotent Circle",
      key,
    );
    expect(first.error).toBeNull();
    expect(second.error).not.toBeNull();
    expect(second.data).toBeNull();
    expect((await countsForName("Different Idempotent Circle")).circles).toBe(
      0,
    );
  });

  it("isolates the same key across users", async () => {
    const key = crypto.randomUUID();
    const [one, two] = await Promise.all([
      createCircle(a.client, "User A Shared Key", key),
      createCircle(b.client, "User B Shared Key", key),
    ]);
    expect(one.error).toBeNull();
    expect(two.error).toBeNull();
    expect(one.data).not.toBe(two.data);
    expect(
      (await a.client.from("family_circles").select("id").eq("id", two.data))
        .data,
    ).toEqual([]);
    expect(
      (await b.client.from("family_circles").select("id").eq("id", one.data))
        .data,
    ).toEqual([]);
  });
});
