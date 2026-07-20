import { execFileSync, spawnSync } from "node:child_process";

const output = execFileSync(
  "npx",
  ["--yes", "supabase@2.109.1", "status", "-o", "env"],
  { encoding: "utf8" },
);
const values = Object.fromEntries(
  output.split("\n").flatMap((line) => {
    const match = line.match(/^([A-Z_]+)="?(.*?)"?$/);
    return match ? [[match[1], match[2].replace(/"$/, "")]] : [];
  }),
);
const required = ["API_URL", "ANON_KEY", "SERVICE_ROLE_KEY", "DB_URL"];
if (!required.every((name) => values[name]))
  throw new Error(
    "Local Supabase is not running or did not return test credentials",
  );

const result = spawnSync("npm", ["run", "test:db:vitest"], {
  stdio: "inherit",
  env: {
    ...process.env,
    KINWARD_TEST_SUPABASE_URL: values.API_URL,
    KINWARD_TEST_SUPABASE_ANON_KEY: values.ANON_KEY,
    KINWARD_TEST_SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
    KINWARD_TEST_DATABASE_URL: values.DB_URL,
  },
});
process.exit(result.status ?? 1);
