export type DexQuote = {
  dex: "uniswap-v3" | "aerodrome";
  amountIn: string;
  amountOut: string;
  amountOutFormatted: string;
  available: boolean;
  route: {
    tokenIn: `0x${string}`;
    tokenOut: `0x${string}`;
    feeTier?: number;
    stable?: boolean;
  };
  error?: string;
};
