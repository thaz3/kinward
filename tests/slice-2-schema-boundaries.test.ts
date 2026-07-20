import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "supabase/migrations/202607200001_slice_2_user_profiles.sql",
  "utf8",
);

describe("Slice 2 database boundary", () => {
  it("creates only the minimal own-account profile with RLS", () => {
    expect(migration).toContain(
      "create table if not exists public.user_profiles",
    );
    expect(migration).toContain(
      "alter table public.user_profiles enable row level security",
    );
    expect(migration).toContain("auth.uid() = user_id");
    expect(migration).not.toMatch(
      /create table.*(?:circle|recipient|role|delegation|invitation|minor|audit)/i,
    );
  });

  it("contains no minor identity or support bypass grants", () => {
    expect(migration).not.toMatch(/service_role|impersonat|login_as|wildcard/i);
    expect(migration).not.toMatch(/managed_minor_id|minor_user_id/i);
  });
});
