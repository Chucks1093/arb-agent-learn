import {
  type SpendPermission,
  type EvmSmartAccount,
} from "@coinbase/cdp-sdk";
import {
  encodeFunctionData,
  formatUnits,
  getAddress,
  parseUnits,
  type Address,
} from "viem";
import {
  getSmartAccountRuntimeForUser,
  getOrCreateAgentWalletForUser,
} from "@/lib/agent-wallet";
import { ERC20_ABI } from "@/lib/base/abis/erc20";
import { BASE_ADDRESSES } from "@/lib/base/addresses";
import { basePublicClient } from "@/lib/base/client";
import { BASE_TOKENS } from "@/lib/base/tokens";
import { AERODROME_ROUTER_ABI } from "@/lib/dex/abis/aerodromeRouter";
import { UNISWAP_V3_SWAP_ROUTER_02_ABI } from "@/lib/dex/abis/uniswapV3SwapRouter02";
import {
  getLatestActiveSpendPermissionForUser,
  getSpendPermissionForUser,
  type StoredSpendPermission,
} from "@/lib/spend-permissions";
import {
  DEFAULT_ESTIMATED_GAS_COST_USDC,
  type ArbitragePath,
  type ArbitrageScanResult,
  getBestArbitragePath,
  scanArbitrageOpportunity,
} from "@/lib/arbitrage/scanner";

const MAX_PERMISSION_END_UNIX = 281_474_976_710_655;

export type ExecuteArbitrageRequest = {
  amountUsdc: string;
  permissionHash?: string;
  minNetProfitUsdc?: string;
  slippageBps?: number;
};

export type ExecuteArbitrageResult = {
  executed: boolean;
  reason: string;
  permissionHash: string | null;
  scan: ArbitrageScanResult;
  execution: null | {
    mode: "mock" | "cdp";
    direction: Exclude<ArbitrageScanResult["recommendation"]["direction"], "NO_OPPORTUNITY">;
    smartAccountAddress: string;
    userAddress: string;
    initialAmountUsdc: string;
    returnedAmountUsdc: string;
    grossProfitUsdc: string;
    estimatedNetProfitUsdc: string;
    slippageBps: number;
    userOpHashes: string[];
  };
};

function parseBigIntLike(value: string | number | bigint) {
  if (typeof value === "bigint") {
    return value;
  }

  return BigInt(value);
}

function formatUsdc(value: bigint) {
  return formatUnits(value, BASE_TOKENS.USDC.decimals);
}

function applySlippage(amount: bigint, slippageBps: number) {
  const basisPoints = BigInt(Math.max(0, 10_000 - slippageBps));
  return (amount * basisPoints) / 10_000n;
}

function scaleAmountOut(params: {
  quotedAmountIn: bigint;
  quotedAmountOut: bigint;
  actualAmountIn: bigint;
}) {
  if (params.quotedAmountIn === 0n) {
    return 0n;
  }

  return (params.quotedAmountOut * params.actualAmountIn) / params.quotedAmountIn;
}

function toSdkSpendPermission(permission: StoredSpendPermission): SpendPermission {
  return {
    account: getAddress(permission.userAddress),
    spender: getAddress(permission.smartAccountAddress),
    token: getAddress(permission.tokenAddress),
    allowance: parseBigIntLike(permission.allowance),
    period: permission.periodSeconds,
    start: permission.startUnix,
    end: permission.endUnix ?? MAX_PERMISSION_END_UNIX,
    salt: parseBigIntLike(permission.salt),
    extraData: permission.extraData as `0x${string}`,
  };
}

async function readTokenBalance(tokenAddress: Address, ownerAddress: Address) {
  return (await basePublicClient.readContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: [ownerAddress],
  })) as bigint;
}

function assertPermissionIsUsable(params: {
  permission: StoredSpendPermission;
  userAddress: string;
  smartAccountAddress: string;
  amountInUsdc: bigint;
}) {
  if (params.permission.status !== "active") {
    throw new Error("Spend permission is not active");
  }

  if (params.permission.userAddress.toLowerCase() !== params.userAddress.toLowerCase()) {
    throw new Error("Spend permission does not belong to the signed-in user");
  }

  if (
    params.permission.smartAccountAddress.toLowerCase() !==
    params.smartAccountAddress.toLowerCase()
  ) {
    throw new Error("Spend permission does not match the saved smart account");
  }

  if (BigInt(params.permission.allowance) < params.amountInUsdc) {
    throw new Error("Requested trade size exceeds the saved spend-permission allowance");
  }

  const nowUnix = Math.floor(Date.now() / 1000);
  if (params.permission.startUnix > nowUnix) {
    throw new Error("Spend permission is not active yet");
  }

  if (params.permission.endUnix && params.permission.endUnix < nowUnix) {
    throw new Error("Spend permission has expired");
  }
}

function selectExecutablePath(params: {
  scan: ArbitrageScanResult;
  minNetProfitUsdc: number;
}) {
  const bestPath = getBestArbitragePath(params.scan);
  const netProfit = Number(bestPath.netProfitUsdc);

  if (params.scan.recommendation.action !== "EXECUTE") {
    return {
      path: null,
      reason: params.scan.recommendation.reason,
    };
  }

  if (netProfit < params.minNetProfitUsdc) {
    return {
      path: null,
      reason: `Best path net profit $${bestPath.netProfitUsdc} is below the requested minimum of $${params.minNetProfitUsdc.toFixed(2)}.`,
    };
  }

  return {
    path: bestPath,
    reason: `Executing ${bestPath.direction} with estimated net profit of $${bestPath.netProfitUsdc}.`,
  };
}

function buildAerodromeSwapCall(params: {
  tokenIn: Address;
  tokenOut: Address;
  stable: boolean;
  amountIn: bigint;
  amountOutMinimum: bigint;
  recipient: Address;
  deadline: bigint;
}) {
  return {
    to: BASE_ADDRESSES.aerodrome.router,
    data: encodeFunctionData({
      abi: AERODROME_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [
        params.amountIn,
        params.amountOutMinimum,
        [
          {
            from: params.tokenIn,
            to: params.tokenOut,
            stable: params.stable,
            factory: BASE_ADDRESSES.aerodrome.factory,
          },
        ],
        params.recipient,
        params.deadline,
      ],
    }),
    value: 0n,
  };
}

function buildUniswapSwapCall(params: {
  tokenIn: Address;
  tokenOut: Address;
  feeTier: number;
  amountIn: bigint;
  amountOutMinimum: bigint;
  recipient: Address;
}) {
  return {
    to: BASE_ADDRESSES.uniswapV3.router02,
    data: encodeFunctionData({
      abi: UNISWAP_V3_SWAP_ROUTER_02_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: params.tokenIn,
          tokenOut: params.tokenOut,
          fee: params.feeTier,
          recipient: params.recipient,
          amountIn: params.amountIn,
          amountOutMinimum: params.amountOutMinimum,
          sqrtPriceLimitX96: 0n,
        },
      ],
    }),
    value: 0n,
  };
}

function buildApproveCall(params: {
  tokenAddress: Address;
  spender: Address;
  amount: bigint;
}) {
  return {
    to: params.tokenAddress,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "approve",
      args: [params.spender, params.amount],
    }),
    value: 0n,
  };
}

function buildTransferCall(params: {
  tokenAddress: Address;
  recipient: Address;
  amount: bigint;
}) {
  return {
    to: params.tokenAddress,
    data: encodeFunctionData({
      abi: ERC20_ABI,
      functionName: "transfer",
      args: [params.recipient, params.amount],
    }),
    value: 0n,
  };
}

async function executeSwapLeg(params: {
  smartAccount: EvmSmartAccount;
  path: ArbitragePath;
  leg: "buy" | "sell";
  amountIn: bigint;
  recipient: Address;
  slippageBps: number;
}) {
  const legQuote = params.leg === "buy" ? params.path.buyLeg : params.path.sellLeg;
  if (!legQuote.route) {
    throw new Error(`Missing route data for ${params.leg} leg`);
  }

  const tokenIn = getAddress(legQuote.route.tokenIn);
  const tokenOut = getAddress(legQuote.route.tokenOut);
  const routerAddress =
    legQuote.dex === "uniswap-v3"
      ? BASE_ADDRESSES.uniswapV3.router02
      : BASE_ADDRESSES.aerodrome.router;
  const quotedAmountOut = scaleAmountOut({
    quotedAmountIn: BigInt(legQuote.amountIn),
    quotedAmountOut: BigInt(legQuote.amountOut),
    actualAmountIn: params.amountIn,
  });
  const amountOutMinimum = applySlippage(quotedAmountOut, params.slippageBps);
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  const calls = [
    buildApproveCall({
      tokenAddress: tokenIn,
      spender: routerAddress,
      amount: params.amountIn,
    }),
    legQuote.dex === "uniswap-v3"
      ? buildUniswapSwapCall({
          tokenIn,
          tokenOut,
          feeTier: legQuote.route.feeTier ?? BASE_ADDRESSES.uniswapV3.feeTiers[1],
          amountIn: params.amountIn,
          amountOutMinimum,
          recipient: params.recipient,
        })
      : buildAerodromeSwapCall({
          tokenIn,
          tokenOut,
          stable: legQuote.route.stable ?? false,
          amountIn: params.amountIn,
          amountOutMinimum,
          recipient: params.recipient,
          deadline,
        }),
  ];

  const result = await params.smartAccount.sendUserOperation({
    network: "base",
    calls,
  });

  await params.smartAccount.waitForUserOperation({ userOpHash: result.userOpHash });
  return result.userOpHash;
}

function buildMockExecutionResult(params: {
  userAddress: string;
  smartAccountAddress: string;
  permissionHash: string;
  scan: ArbitrageScanResult;
  path: ArbitragePath;
  slippageBps: number;
}) {
  return {
    executed: true,
    reason: `Mock execution completed for ${params.path.direction}.`,
    permissionHash: params.permissionHash,
    scan: params.scan,
    execution: {
      mode: "mock" as const,
      direction: params.path.direction,
      smartAccountAddress: params.smartAccountAddress,
      userAddress: params.userAddress,
      initialAmountUsdc: params.scan.tradeSizeUsdc,
      returnedAmountUsdc: (
        Number(params.scan.tradeSizeUsdc) + Number(params.path.grossProfitUsdc)
      ).toFixed(6),
      grossProfitUsdc: params.path.grossProfitUsdc,
      estimatedNetProfitUsdc: params.path.netProfitUsdc,
      slippageBps: params.slippageBps,
      userOpHashes: [`mock-userop-${Date.now()}`],
    },
  };
}

export async function executeArbitrageForUser(params: {
  userAddress: string;
  request: ExecuteArbitrageRequest;
}): Promise<ExecuteArbitrageResult> {
  const normalizedUserAddress = getAddress(params.userAddress);
  const slippageBps = params.request.slippageBps ?? 100;
  const minNetProfitUsdc = Number(params.request.minNetProfitUsdc ?? "0.01");
  const amountInUsdc = parseUnits(params.request.amountUsdc, BASE_TOKENS.USDC.decimals);

  if (!Number.isFinite(minNetProfitUsdc) || minNetProfitUsdc < 0) {
    throw new Error("Minimum net profit must be a non-negative number");
  }

  const wallet = await getOrCreateAgentWalletForUser(normalizedUserAddress);
  const permission = params.request.permissionHash
    ? await getSpendPermissionForUser({
        userAddress: normalizedUserAddress,
        permissionHash: params.request.permissionHash,
      })
    : await getLatestActiveSpendPermissionForUser({
        userAddress: normalizedUserAddress,
        smartAccountAddress: wallet.smartAccountAddress,
      });

  if (!permission) {
    throw new Error("No active spend permission found for execution");
  }

  assertPermissionIsUsable({
    permission,
    userAddress: normalizedUserAddress,
    smartAccountAddress: wallet.smartAccountAddress,
    amountInUsdc,
  });

  const scan = await scanArbitrageOpportunity(params.request.amountUsdc);
  const selection = selectExecutablePath({
    scan,
    minNetProfitUsdc,
  });

  if (!selection.path) {
    return {
      executed: false,
      reason: selection.reason,
      permissionHash: permission.permissionHash,
      scan,
      execution: null,
    };
  }

  if (wallet.mode === "mock") {
    return buildMockExecutionResult({
      userAddress: normalizedUserAddress,
      smartAccountAddress: wallet.smartAccountAddress,
      permissionHash: permission.permissionHash,
      scan,
      path: selection.path,
      slippageBps,
    });
  }

  const smartAccount = await getSmartAccountRuntimeForUser(normalizedUserAddress);
  if (!smartAccount) {
    throw new Error("Smart account runtime is unavailable");
  }

  const smartAccountAddress = getAddress(smartAccount.address);
  const initialUsdcBalance = await readTokenBalance(
    BASE_ADDRESSES.tokens.USDC,
    smartAccountAddress,
  );
  const initialWethBalance = await readTokenBalance(
    BASE_ADDRESSES.tokens.WETH,
    smartAccountAddress,
  );
  const userOpHashes: string[] = [];

  const spendResult = await smartAccount.useSpendPermission({
    network: "base",
    spendPermission: toSdkSpendPermission(permission),
    value: amountInUsdc,
  });
  userOpHashes.push(spendResult.userOpHash);
  await smartAccount.waitForUserOperation({ userOpHash: spendResult.userOpHash });

  const postSpendUsdcBalance = await readTokenBalance(
    BASE_ADDRESSES.tokens.USDC,
    smartAccountAddress,
  );
  const buyAmountIn = postSpendUsdcBalance - initialUsdcBalance;
  if (buyAmountIn <= 0n) {
    throw new Error("Spend-permission pull did not fund the smart account");
  }

  userOpHashes.push(
    await executeSwapLeg({
      smartAccount,
      path: selection.path,
      leg: "buy",
      amountIn: buyAmountIn,
      recipient: smartAccountAddress,
      slippageBps,
    }),
  );

  const postBuyWethBalance = await readTokenBalance(
    BASE_ADDRESSES.tokens.WETH,
    smartAccountAddress,
  );
  const sellAmountIn = postBuyWethBalance - initialWethBalance;
  if (sellAmountIn <= 0n) {
    throw new Error("Buy leg completed without increasing WETH balance");
  }

  userOpHashes.push(
    await executeSwapLeg({
      smartAccount,
      path: selection.path,
      leg: "sell",
      amountIn: sellAmountIn,
      recipient: smartAccountAddress,
      slippageBps,
    }),
  );

  const postSellUsdcBalance = await readTokenBalance(
    BASE_ADDRESSES.tokens.USDC,
    smartAccountAddress,
  );
  const returnAmountUsdc = postSellUsdcBalance - initialUsdcBalance;
  if (returnAmountUsdc <= 0n) {
    throw new Error("Sell leg completed without any USDC available to return");
  }

  const returnResult = await smartAccount.sendUserOperation({
    network: "base",
    calls: [
      buildTransferCall({
        tokenAddress: BASE_ADDRESSES.tokens.USDC,
        recipient: normalizedUserAddress,
        amount: returnAmountUsdc,
      }),
    ],
  });
  userOpHashes.push(returnResult.userOpHash);
  await smartAccount.waitForUserOperation({ userOpHash: returnResult.userOpHash });

  const grossProfitUsdc = returnAmountUsdc - buyAmountIn;
  const estimatedNetProfitUsdc =
    Number(formatUsdc(grossProfitUsdc)) - DEFAULT_ESTIMATED_GAS_COST_USDC;

  return {
    executed: true,
    reason: selection.reason,
    permissionHash: permission.permissionHash,
    scan,
    execution: {
      mode: "cdp",
      direction: selection.path.direction,
      smartAccountAddress,
      userAddress: normalizedUserAddress,
      initialAmountUsdc: formatUsdc(buyAmountIn),
      returnedAmountUsdc: formatUsdc(returnAmountUsdc),
      grossProfitUsdc: formatUsdc(grossProfitUsdc),
      estimatedNetProfitUsdc: estimatedNetProfitUsdc.toFixed(6),
      slippageBps,
      userOpHashes,
    },
  };
}
