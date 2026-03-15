import { ok } from "@/lib/api";
import { clearSessionCookieOnResponse } from "@/lib/auth/session";

export async function POST() {
  const response = ok({ loggedOut: true });
  return clearSessionCookieOnResponse(response);
}
