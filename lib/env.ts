import { z } from "zod";

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(20),
});

const serverEnvironmentSchema = publicEnvironmentSchema.extend({
  KINWARD_AUTH_COOKIE_SECRET: z.string().min(32),
});

export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;
export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;

export function getPublicEnvironment(): PublicEnvironment | null {
  const parsed = publicEnvironmentSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}

export function getServerEnvironment(): ServerEnvironment | null {
  const parsed = serverEnvironmentSchema.safeParse(process.env);
  return parsed.success ? parsed.data : null;
}
