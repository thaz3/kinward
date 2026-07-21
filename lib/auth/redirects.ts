const SAFE_PATHS = new Set(["/my-kinward", "/account"]);

function isSafeInvitationPath(value: string): boolean {
  if (
    value.includes("://") ||
    value.includes("\\") ||
    value.includes("..") ||
    value.startsWith("//")
  ) {
    return false;
  }
  return (
    /^\/invitations\/accept\/[A-Za-z0-9_-]+$/.test(value) ||
    /^\/invitations\/mine\/[0-9a-f-]{36}$/i.test(value) ||
    /^\/ownership\/accept\/[A-Za-z0-9_-]+$/.test(value)
  );
}

export function safeAuthRedirect(value: string | null | undefined): string {
  if (!value) return "/my-kinward";
  if (SAFE_PATHS.has(value)) return value;
  if (isSafeInvitationPath(value)) return value;
  return "/my-kinward";
}
