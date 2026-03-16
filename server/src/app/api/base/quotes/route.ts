import { parseUnits } from "viem";
import { fail, ok } from "@/lib/api";
import { BASE_ADDRESSES } from "@/lib/base/addresses";
import { BASE_TOKENS } from "@/lib/base/tokens";
import { getUniswapV3ExactInQuote } from "@/lib/dex/uniswap";
import { getAerodromeExactInQuote } from "@/lib/dex/aerodrome";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const amountParam = searchParams.get("amount") ?? "10";
  const amount = Number(amountParam);

  if (!Number.isFinite(amount) || amount <= 0) {
    return fail("Invalid amount query parameter", 400);
  }

  const amountIn = parseUnits(amountParam, BASE_TOKENS.USDC.decimals);

  const [uniswap, aerodrome] = await Promise.all([
    getUniswapV3ExactInQuote({
      tokenIn: BASE_ADDRESSES.tokens.USDC,
      tokenOut: BASE_ADDRESSES.tokens.WETH,
      amountIn,
    }),
    getAerodromeExactInQuote({
      tokenIn: BASE_ADDRESSES.tokens.USDC,
      tokenOut: BASE_ADDRESSES.tokens.WETH,
      amountIn,
    }),
  ]);

  return ok({
    chain: "base",
    tokenPair: `${BASE_TOKENS.USDC.symbol}/${BASE_TOKENS.WETH.symbol}`,
    amountIn: {
      raw: amountIn.toString(),
      formatted: amountParam,
      symbol: BASE_TOKENS.USDC.symbol,
    },
    quotes: {
      uniswap,
      aerodrome,
    },
  });
}
