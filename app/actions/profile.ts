"use server";

import { profileInputSchema } from "@/lib/profile";
import { getAuthenticatedAdult } from "@/lib/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ProfileActionState = Readonly<{
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Readonly<Record<string, string>>;
}>;

export async function updateOwnProfile(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const account = await getAuthenticatedAdult();
  if (!account)
    return {
      status: "error",
      message: "Your session is unavailable. Sign in again.",
    };
  const parsed = profileInputSchema.safeParse({
    preferredDisplayName: formData.get("preferredDisplayName"),
    locale: formData.get("locale"),
    timeZone: formData.get("timeZone"),
    prefersReducedMotion: formData.get("prefersReducedMotion") === "on",
    prefersHighContrast: formData.get("prefersHighContrast") === "on",
    prefersLargerText: formData.get("prefersLargerText") === "on",
  });
  if (!parsed.success) {
    const flattened = parsed.error.flatten().fieldErrors;
    return {
      status: "error",
      message: "Check the highlighted fields.",
      fieldErrors: Object.fromEntries(
        Object.entries(flattened).map(([key, value]) => [
          key,
          value?.[0] ?? "Check this field.",
        ]),
      ),
    };
  }
  const supabase = await createSupabaseServerClient();
  if (!supabase)
    return { status: "error", message: "Profile settings are unavailable." };
  const { error } = await supabase
    .from("user_profiles")
    .update({
      preferred_display_name: parsed.data.preferredDisplayName,
      locale: parsed.data.locale,
      time_zone: parsed.data.timeZone,
      accessibility_preferences: {
        reduced_motion: parsed.data.prefersReducedMotion,
        high_contrast: parsed.data.prefersHighContrast,
        larger_text: parsed.data.prefersLargerText,
      },
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", account.userId);
  if (error)
    return { status: "error", message: "Profile settings are unavailable." };
  return { status: "success", message: "Profile settings saved." };
}
