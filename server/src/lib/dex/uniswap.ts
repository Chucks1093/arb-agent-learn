import { formatUnits, type Address } from "viem";
import { BASE_ADDRESSES } from "@/lib/base/addresses";
import { BASE_TOKENS } from "@/lib/base/tokens";
import { basePublicClient } from "@/lib/base/client";
import { UNISWAP_V3_QUOTER_V2_ABI } from "@/lib/dex/abis/uniswapV3QuoterV2";
import type { DexQuote } from "@/lib/dex/types";

export async function getUniswapV3ExactInQuote(params: {
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
}): Promise<DexQuote> {
  for (const feeTier of BASE_ADDRESSES.uniswapV3.feeTiers) {
    try {
      const [amountOut] = (await basePublicClient.readContract({
        address: BASE_ADDRESSES.uniswapV3.quoterV2,
        abi: UNISWAP_V3_QUOTER_V2_ABI,
        functionName: "quoteExactInputSingle",
        args: [
          {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            amountIn: params.amountIn,
            fee: feeTier,
            sqrtPriceLimitX96: 0n,
          },
        ],
      })) as [bigint, bigint, number, bigint];

      if (amountOut > 0n) {
        return {
          dex: "uniswap-v3",
          amountIn: params.amountIn.toString(),
          amountOut: amountOut.toString(),
          amountOutFormatted: formatUnits(amountOut, BASE_TOKENS.WETH.decimals),
          available: true,
          route: {
            tokenIn: params.tokenIn,
            tokenOut: params.tokenOut,
            feeTier,
          },
        };
      }
    } catch {
      continue;
    }
  }

  return {
    dex: "uniswap-v3",
    amountIn: params.amountIn.toString(),
    amountOut: "0",
    amountOutFormatted: "0",
    available: false,
    route: {
      tokenIn: params.tokenIn,
      tokenOut: params.tokenOut,
    },
    error: "No Uniswap V3 quote available for the configured fee tiers",
  };
}
