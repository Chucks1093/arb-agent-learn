import { getAddress } from "viem";

export const BASE_ADDRESSES = {
  tokens: {
    USDC: getAddress("0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"),
    WETH: getAddress("0x4200000000000000000000000000000000000006"),
  },
  uniswapV3: {
    quoterV2: getAddress("0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a"),
    router02: getAddress("0x2626664c2603336E57B271c5C0b26F421741e481"),
    factory: getAddress("0x33128a8fC17869897dcE68Ed026d694621f6FDfD"),
    feeTiers: [500, 3000, 10000] as const,
  },
  aerodrome: {
    router: getAddress("0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43"),
    factory: getAddress("0x420DD381b31aEf6683db6B902084cB0FFECe40Da"),
    poolTypes: [false, true] as const,
  },
} as const;
