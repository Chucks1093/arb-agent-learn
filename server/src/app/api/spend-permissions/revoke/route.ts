import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { markSpendPermissionRevoked } from "@/lib/spend-permissions";

const revokeSchema = z.object({
  permissionHash: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.address) {
    return fail("Not authenticated", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = revokeSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid revoke payload", 400, parsed.error.flatten());
  }

  const permission = await markSpendPermissionRevoked({
    userAddress: session.address,
    permissionHash: parsed.data.permissionHash,
  });

  return ok({ permission });
}
