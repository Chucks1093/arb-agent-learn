import { z } from "zod";
import { fail, ok } from "@/lib/api";
import { getSession } from "@/lib/auth/session";
import { executeArbitrageForUser } from "@/lib/arbitrage/execute";

const executeRequestSchema = z.object({
  amountUsdc: z.string().min(1),
  permissionHash: z.string().min(1).optional(),
  minNetProfitUsdc: z.string().min(1).optional(),
  slippageBps: z.number().int().min(0).max(10_000).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();

  if (!session?.address) {
    return fail("Not authenticated", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = executeRequestSchema.safeParse(body);

  if (!parsed.success) {
    return fail("Invalid execution request", 400, parsed.error.flatten());
  }

  try {
    const result = await executeArbitrageForUser({
      userAddress: session.address,
      request: parsed.data,
    });

    return ok(result);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to execute arbitrage",
      400,
    );
  }
}
