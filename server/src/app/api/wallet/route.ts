import { fail, ok } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import {
  getAgentWalletForUser,
  getOrCreateAgentWalletForUser,
} from "@/lib/agent-wallet";

export async function GET() {
  const session = await getSession();

  if (!session?.address) {
    return fail("Not authenticated", 401);
  }

  const wallet = await getAgentWalletForUser(session.address);

  return ok({
    exists: Boolean(wallet),
    wallet,
  });
}

export async function POST() {
  const session = await getSession();

  if (!session?.address) {
    return fail("Not authenticated", 401);
  }

  const wallet = await getOrCreateAgentWalletForUser(session.address);

  return ok({
    wallet,
  });
}
