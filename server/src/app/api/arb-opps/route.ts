import { fail, ok } from "@/lib/api";
import { scanArbitrageOpportunity } from "@/lib/arbitrage/scanner";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amount = searchParams.get("amount") ?? "10";

  try {
    const result = await scanArbitrageOpportunity(amount);
    return ok(result);
  } catch (error) {
    return fail(
      error instanceof Error ? error.message : "Failed to scan arbitrage opportunity",
      400,
    );
  }
}
