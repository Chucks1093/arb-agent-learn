import { BASE_ADDRESSES } from "@/lib/base/addresses";
import { getAddress, type Address } from "viem";

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

export function getBaseTokenByAddress(address: Address) {
  const normalizedAddress = getAddress(address);

  return Object.values(BASE_TOKENS).find(
    (token) => token.address.toLowerCase() === normalizedAddress.toLowerCase(),
  );
}

export function getBaseTokenDecimals(address: Address) {
  return getBaseTokenByAddress(address)?.decimals ?? 18;
}
