import { z } from "zod";

export const profileInputSchema = z.object({
  preferredDisplayName: z.string().trim().min(1).max(80),
  locale: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/),
  timeZone: z.string().min(1).max(64),
  prefersReducedMotion: z.boolean(),
  prefersHighContrast: z.boolean(),
  prefersLargerText: z.boolean(),
});

export type ProfileInput = z.infer<typeof profileInputSchema>;

export type UserProfile = Readonly<{
  user_id: string;
  preferred_display_name: string;
  locale: string;
  time_zone: string;
  accessibility_preferences: {
    reduced_motion: boolean;
    high_contrast: boolean;
    larger_text: boolean;
  };
  account_status: "active" | "disabled" | "archived";
  version: number;
}>;
