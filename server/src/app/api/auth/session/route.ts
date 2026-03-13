import { ok } from "@/lib/api";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return ok({ authenticated: false });
  }

  return ok({
    authenticated: true,
    address: session.address,
  });
}
