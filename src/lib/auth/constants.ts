export const SESSION_COOKIE = "tl_alumni_session";
export const AUTH_NEXT_COOKIE = "tl_auth_next";

export function safeNextPath(value: string | null | undefined): string {
  if (value && value.startsWith("/") && !value.startsWith("//")) {
    return value;
  }
  return "/home";
}
