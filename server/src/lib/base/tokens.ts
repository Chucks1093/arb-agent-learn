import { BASE_ADDRESSES } from "@/lib/base/addresses";

export const BASE_TOKENS = {
  USDC: {
    symbol: "USDC",
    decimals: 6,
    address: BASE_ADDRESSES.tokens.USDC,
  },
  WETH: {
    symbol: "WETH",
    decimals: 18,
    address: BASE_ADDRESSES.tokens.WETH,
  },
} as const;
