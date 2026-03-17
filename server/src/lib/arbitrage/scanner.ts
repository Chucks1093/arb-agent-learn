import { formatUnits, parseUnits } from "viem";
import { BASE_ADDRESSES } from "@/lib/base/addresses";
import { BASE_TOKENS } from "@/lib/base/tokens";
import { getAerodromeExactInQuote } from "@/lib/dex/aerodrome";
import { getUniswapV3ExactInQuote } from "@/lib/dex/uniswap";

export type ArbitrageDirection = "UNI_TO_AERO" | "AERO_TO_UNI" | "NO_OPPORTUNITY";

export type ArbitrageLegQuote = {
  dex: "uniswap-v3" | "aerodrome";
  amountIn: string;
  amountOut: string;
  amountInFormatted: string;
  amountOutFormatted: string;
  available: boolean;
  error?: string;
  route?: {
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    feeTier?: number;
    stable?: boolean;
  };
};

export type ArbitragePath = {
  direction: Exclude<ArbitrageDirection, "NO_OPPORTUNITY">;
  buyLeg: ArbitrageLegQuote;
  sellLeg: ArbitrageLegQuote;
  grossProfitUsdc: string;
  netProfitUsdc: string;
  profitMarginPercent: string;
  profitable: boolean;
};

export type ArbitrageScanResult = {
  timestamp: string;
  tradeSizeUsdc: string;
  quotes: {
    buyWeth: {
      uniswap: ArbitrageLegQuote;
      aerodrome: ArbitrageLegQuote;
    };
  };
  paths: {
    uniToAero: ArbitragePath;
    aeroToUni: ArbitragePath;
  };
  recommendation: {
    direction: ArbitrageDirection;
    expectedGrossProfitUsdc: string;
    expectedNetProfitUsdc: string;
    action: "EXECUTE" | "WAIT";
    reason: string;
  };
};

export const DEFAULT_ESTIMATED_GAS_COST_USDC = 0.5;
export const DEFAULT_MIN_NET_PROFIT_USDC = 0.01;

function toDecimal(value: bigint, decimals: number) {
  return Number(formatUnits(value, decimals));
}

function formatDecimal(value: number, precision = 6) {
  return value.toFixed(precision);
}

function buildLegQuote(params: {
  dex: "uniswap-v3" | "aerodrome";
  amountIn: bigint;
  amountOut: bigint;
  amountInDecimals: number;
  amountOutDecimals: number;
  available: boolean;
  error?: string;
  route?: ArbitrageLegQuote["route"];
}): ArbitrageLegQuote {
  return {
    dex: params.dex,
    amountIn: params.amountIn.toString(),
    amountOut: params.amountOut.toString(),
    amountInFormatted: formatDecimal(
      toDecimal(params.amountIn, params.amountInDecimals),
    ),
    amountOutFormatted: formatDecimal(
      toDecimal(params.amountOut, params.amountOutDecimals),
    ),
    available: params.available,
    error: params.error,
    route: params.route,
  };
}

function buildPath(params: {
  direction: Exclude<ArbitrageDirection, "NO_OPPORTUNITY">;
  tradeSizeUsdc: bigint;
  buyLeg: ArbitrageLegQuote;
  sellLeg: ArbitrageLegQuote;
}): ArbitragePath {
  const tradeSize = toDecimal(params.tradeSizeUsdc, BASE_TOKENS.USDC.decimals);
  const finalUsdc = Number(params.sellLeg.amountOutFormatted);
  const grossProfit = finalUsdc - tradeSize;
  const netProfit = grossProfit - DEFAULT_ESTIMATED_GAS_COST_USDC;
  const profitMargin = tradeSize > 0 ? (netProfit / tradeSize) * 100 : 0;

  return {
    direction: params.direction,
    buyLeg: params.buyLeg,
    sellLeg: params.sellLeg,
    grossProfitUsdc: grossProfit.toFixed(6),
    netProfitUsdc: netProfit.toFixed(6),
    profitMarginPercent: profitMargin.toFixed(4),
    profitable: netProfit > DEFAULT_MIN_NET_PROFIT_USDC,
  };
}

export function getBestArbitragePath(result: ArbitrageScanResult) {
  const uniToAeroNetProfit = Number(result.paths.uniToAero.netProfitUsdc);
  const aeroToUniNetProfit = Number(result.paths.aeroToUni.netProfitUsdc);

  return uniToAeroNetProfit >= aeroToUniNetProfit
    ? result.paths.uniToAero
    : result.paths.aeroToUni;
}

export async function scanArbitrageOpportunity(
  tradeSizeUsdc: string,
): Promise<ArbitrageScanResult> {
  const tradeSize = Number(tradeSizeUsdc);

  if (!Number.isFinite(tradeSize) || tradeSize <= 0) {
    throw new Error("Trade size must be a positive number");
  }

  const amountInUsdc = parseUnits(tradeSizeUsdc, BASE_TOKENS.USDC.decimals);

  const [uniBuyQuote, aeroBuyQuote] = await Promise.all([
    getUniswapV3ExactInQuote({
      tokenIn: BASE_ADDRESSES.tokens.USDC,
      tokenOut: BASE_ADDRESSES.tokens.WETH,
      amountIn: amountInUsdc,
    }),
    getAerodromeExactInQuote({
      tokenIn: BASE_ADDRESSES.tokens.USDC,
      tokenOut: BASE_ADDRESSES.tokens.WETH,
      amountIn: amountInUsdc,
    }),
  ]);

  const uniBuyLeg = buildLegQuote({
    dex: "uniswap-v3",
    amountIn: amountInUsdc,
    amountOut: BigInt(uniBuyQuote.amountOut),
    amountInDecimals: BASE_TOKENS.USDC.decimals,
    amountOutDecimals: BASE_TOKENS.WETH.decimals,
    available: uniBuyQuote.available,
    error: uniBuyQuote.error,
    route: uniBuyQuote.route,
  });

  const aeroBuyLeg = buildLegQuote({
    dex: "aerodrome",
    amountIn: amountInUsdc,
    amountOut: BigInt(aeroBuyQuote.amountOut),
    amountInDecimals: BASE_TOKENS.USDC.decimals,
    amountOutDecimals: BASE_TOKENS.WETH.decimals,
    available: aeroBuyQuote.available,
    error: aeroBuyQuote.error,
    route: aeroBuyQuote.route,
  });

  const [aeroSellQuote, uniSellQuote] = await Promise.all([
    uniBuyQuote.available && BigInt(uniBuyQuote.amountOut) > 0n
      ? getAerodromeExactInQuote({
          tokenIn: BASE_ADDRESSES.tokens.WETH,
          tokenOut: BASE_ADDRESSES.tokens.USDC,
          amountIn: BigInt(uniBuyQuote.amountOut),
        })
      : Promise.resolve({
          dex: "aerodrome" as const,
          amountIn: "0",
          amountOut: "0",
          amountOutFormatted: "0",
          available: false,
          route: {
            tokenIn: BASE_ADDRESSES.tokens.WETH,
            tokenOut: BASE_ADDRESSES.tokens.USDC,
          },
          error: "Buy leg unavailable on Uniswap",
        }),
    aeroBuyQuote.available && BigInt(aeroBuyQuote.amountOut) > 0n
      ? getUniswapV3ExactInQuote({
          tokenIn: BASE_ADDRESSES.tokens.WETH,
          tokenOut: BASE_ADDRESSES.tokens.USDC,
          amountIn: BigInt(aeroBuyQuote.amountOut),
        })
      : Promise.resolve({
          dex: "uniswap-v3" as const,
          amountIn: "0",
          amountOut: "0",
          amountOutFormatted: "0",
          available: false,
          route: {
            tokenIn: BASE_ADDRESSES.tokens.WETH,
            tokenOut: BASE_ADDRESSES.tokens.USDC,
          },
          error: "Buy leg unavailable on Aerodrome",
        }),
  ]);

  const aeroSellLeg = buildLegQuote({
    dex: "aerodrome",
    amountIn: BigInt(uniBuyQuote.amountOut),
    amountOut: BigInt(aeroSellQuote.amountOut),
    amountInDecimals: BASE_TOKENS.WETH.decimals,
    amountOutDecimals: BASE_TOKENS.USDC.decimals,
    available: aeroSellQuote.available,
    error: aeroSellQuote.error,
    route: aeroSellQuote.route,
  });

  const uniSellLeg = buildLegQuote({
    dex: "uniswap-v3",
    amountIn: BigInt(aeroBuyQuote.amountOut),
    amountOut: BigInt(uniSellQuote.amountOut),
    amountInDecimals: BASE_TOKENS.WETH.decimals,
    amountOutDecimals: BASE_TOKENS.USDC.decimals,
    available: uniSellQuote.available,
    error: uniSellQuote.error,
    route: uniSellQuote.route,
  });

  const uniToAero = buildPath({
    direction: "UNI_TO_AERO",
    tradeSizeUsdc: amountInUsdc,
    buyLeg: uniBuyLeg,
    sellLeg: aeroSellLeg,
  });

  const aeroToUni = buildPath({
    direction: "AERO_TO_UNI",
    tradeSizeUsdc: amountInUsdc,
    buyLeg: aeroBuyLeg,
    sellLeg: uniSellLeg,
  });

  const bestPath = getBestArbitragePath({
    timestamp: "",
    tradeSizeUsdc,
    quotes: {
      buyWeth: {
        uniswap: uniBuyLeg,
        aerodrome: aeroBuyLeg,
      },
    },
    paths: {
      uniToAero,
      aeroToUni,
    },
    recommendation: {
      direction: "NO_OPPORTUNITY",
      expectedGrossProfitUsdc: "0",
      expectedNetProfitUsdc: "0",
      action: "WAIT",
      reason: "",
    },
  });

  const bestNetProfit = Number(bestPath.netProfitUsdc);

  const recommendation =
    bestPath.profitable && bestNetProfit > DEFAULT_MIN_NET_PROFIT_USDC
      ? {
          direction: bestPath.direction as ArbitrageDirection,
          expectedGrossProfitUsdc: bestPath.grossProfitUsdc,
          expectedNetProfitUsdc: bestPath.netProfitUsdc,
          action: "EXECUTE" as const,
          reason: `Best simulated path is ${bestPath.direction} with estimated net profit of $${bestPath.netProfitUsdc}.`,
        }
      : {
          direction: "NO_OPPORTUNITY" as const,
          expectedGrossProfitUsdc: bestPath.grossProfitUsdc,
          expectedNetProfitUsdc: bestPath.netProfitUsdc,
          action: "WAIT" as const,
          reason:
            "Neither simulated path clears the minimum net-profit threshold after the rough gas estimate.",
        };

  return {
    timestamp: new Date().toISOString(),
    tradeSizeUsdc,
    quotes: {
      buyWeth: {
        uniswap: uniBuyLeg,
        aerodrome: aeroBuyLeg,
      },
    },
    paths: {
      uniToAero,
      aeroToUni,
    },
    recommendation,
  };
}
