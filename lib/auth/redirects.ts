const SAFE_PATHS = new Set(["/my-kinward", "/account"]);

export function safeAuthRedirect(value: string | null | undefined): string {
  if (!value || !SAFE_PATHS.has(value)) return "/my-kinward";
  return value;
}
