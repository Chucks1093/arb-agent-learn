import { formatUnits, type Address } from "viem";
import { BASE_ADDRESSES } from "@/lib/base/addresses";
import { BASE_TOKENS } from "@/lib/base/tokens";
import { basePublicClient } from "@/lib/base/client";
import { AERODROME_ROUTER_ABI } from "@/lib/dex/abis/aerodromeRouter";
import type { DexQuote } from "@/lib/dex/types";

export async function getAerodromeExactInQuote(params: {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
}): Promise<DexQuote> {
  for (const stable of BASE_ADDRESSES.aerodrome.poolTypes) {
    try {
      const amounts = (await basePublicClient.readContract({
        address: BASE_ADDRESSES.aerodrome.router,
        abi: AERODROME_ROUTER_ABI,
        functionName: "getAmountsOut",
        args: [
          params.amountIn,
          [
            {
              from: params.tokenIn,
              to: params.tokenOut,
              stable,
              factory: BASE_ADDRESSES.aerodrome.factory,
            },
          ],
        ],
      })) as bigint[];

      const amountOut = amounts[amounts.length - 1] ?? 0n;

      if (amountOut > 0n) {
        return {
          dex: "aerodrome",
          amountIn: params.amountIn.toString(),
          amountOut: amountOut.toString(),
          amountOutFormatted: formatUnits(amountOut, BASE_TOKENS.WETH.decimals),
          available: true,
          route: {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            stable,
          },
        };
      }
    } catch {
      continue;
    }
  }

  return {
    dex: "aerodrome",
    amountIn: params.amountIn.toString(),
    amountOut: "0",
    amountOutFormatted: "0",
    available: false,
    route: {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
    },
    error: "No Aerodrome quote available for the configured pool types",
  };
}
