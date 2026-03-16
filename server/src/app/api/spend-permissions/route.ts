import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { getAgentWalletForUser } from "@/lib/agent-wallet";
import {
  listSpendPermissionsForUser,
  saveSpendPermission,
} from "@/lib/spend-permissions";

const spendPermissionSchema = z.object({
  createdAt: z.number().optional(),
  permissionHash: z.string().min(1),
  signature: z.string().min(1),
  chainId: z.number().int().optional(),
  permission: z.object({
    account: z.string().min(1),
    spender: z.string().min(1),
    token: z.string().min(1),
    allowance: z.string().min(1),
    period: z.number().int().positive(),
    start: z.number().int().nonnegative(),
    end: z.number().int().nonnegative().optional(),
    salt: z.string().min(1),
    extraData: z.string().min(1),
  }),
});

export async function GET() {
  const session = await getSession();

  if (!session?.address) {
    return fail("Not authenticated", 401);
  }

  const permissions = await listSpendPermissionsForUser(session.address);

  return ok({ permissions });
}

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.address) {
    return fail("Not authenticated", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = spendPermissionSchema.safeParse(body?.permission);

  if (!parsed.success) {
    return fail("Invalid spend permission payload", 400, parsed.error.flatten());
  }

  const permission = parsed.data;
  const wallet = await getAgentWalletForUser(session.address);

  if (!wallet) {
    return fail("Agent wallet not found", 400);
  }

  if (permission.permission.account.toLowerCase() !== session.address.toLowerCase()) {
    return fail("Permission account does not match signed-in user", 400);
  }

  if (
    permission.permission.spender.toLowerCase() !==
    wallet.smartAccountAddress.toLowerCase()
  ) {
    return fail("Permission spender does not match agent smart account", 400);
  }

  const storedPermission = await saveSpendPermission(permission);

  return ok({ permission: storedPermission }, 201);
}
