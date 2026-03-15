/* eslint-disable @typescript-eslint/no-explicit-any */
import { CdpClient } from "@coinbase/cdp-sdk";
import { getAddress, keccak256, toHex } from "viem";
import { env } from "@/lib/env";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type AgentWallet = {
  userAddress: string;
  ownerAddress: string;
  smartAccountAddress: string;
  ownerName: string | null;
  smartAccountName: string | null;
  mode: "mock" | "cdp";
  createdAt: string;
};

type AgentWalletRow = {
  user_address: string;
  owner_address: string;
  smart_account_address: string;
  owner_name: string | null;
  smart_account_name: string | null;
  mode: "mock" | "cdp";
  created_at: string;
};

declare global {
  var __agentWalletRuntimeByUser: Map<string, any> | undefined;
  var __cdpClient: CdpClient | undefined;
}

const agentWalletRuntimeByUser =
  globalThis.__agentWalletRuntimeByUser ?? new Map<string, any>();
globalThis.__agentWalletRuntimeByUser = agentWalletRuntimeByUser;

function toAgentWallet(row: AgentWalletRow): AgentWallet {
  return {
    userAddress: getAddress(row.user_address),
    ownerAddress: getAddress(row.owner_address),
    smartAccountAddress: getAddress(row.smart_account_address),
    ownerName: row.owner_name,
    smartAccountName: row.smart_account_name,
    mode: row.mode,
    createdAt: row.created_at,
  };
}

function toRow(wallet: AgentWallet): AgentWalletRow {
  return {
    user_address: wallet.userAddress,
    owner_address: wallet.ownerAddress,
    smart_account_address: wallet.smartAccountAddress,
    owner_name: wallet.ownerName,
    smart_account_name: wallet.smartAccountName,
    mode: wallet.mode,
    created_at: wallet.createdAt,
  };
}

function deriveAddress(seed: string) {
  const hash = keccak256(toHex(seed));
  return getAddress(`0x${hash.slice(-40)}`);
}

function buildAccountSlug(userAddress: string) {
  return userAddress.toLowerCase().replace(/^0x/, "").slice(0, 10);
}

function buildOwnerName(userAddress: string) {
  return `arb-owner-${buildAccountSlug(userAddress)}`;
}

function buildSmartAccountName(userAddress: string) {
  return `arb-smart-${buildAccountSlug(userAddress)}`;
}

function createMockAgentWallet(userAddress: string): AgentWallet {
  const normalizedUserAddress = getAddress(userAddress);

  return {
    userAddress: normalizedUserAddress,
    ownerAddress: deriveAddress(`owner:${normalizedUserAddress}`),
    smartAccountAddress: deriveAddress(`smart:${normalizedUserAddress}`),
    ownerName: buildOwnerName(normalizedUserAddress),
    smartAccountName: buildSmartAccountName(normalizedUserAddress),
    mode: "mock",
    createdAt: new Date().toISOString(),
  };
}

function ensureCdpConfig() {
  if (!env.cdpApiKeyId || !env.cdpApiKeySecret || !env.cdpWalletSecret) {
    throw new Error(
      "Missing CDP credentials. Set CDP_API_KEY_ID, CDP_API_KEY_SECRET, and CDP_WALLET_SECRET.",
    );
  }
}

function getCdpClient() {
  ensureCdpConfig();

  if (!globalThis.__cdpClient) {
    globalThis.__cdpClient = new CdpClient({
      apiKeyId: env.cdpApiKeyId,
      apiKeySecret: env.cdpApiKeySecret,
      walletSecret: env.cdpWalletSecret,
    });
  }

  return globalThis.__cdpClient;
}

async function loadWalletRowByUserAddress(userAddress: string) {
  const { data, error } = await supabaseAdmin
    .from("agent_wallets")
    .select(
      "user_address, owner_address, smart_account_address, owner_name, smart_account_name, mode, created_at",
    )
    .eq("user_address", getAddress(userAddress))
    .maybeSingle<AgentWalletRow>();

  if (error) {
    throw new Error(`Failed to load agent wallet: ${error.message}`);
  }

  return data ? toAgentWallet(data) : null;
}

async function saveWallet(wallet: AgentWallet) {
  const payload = {
    ...toRow(wallet),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.from("agent_wallets").upsert(payload, {
    onConflict: "user_address",
  });

  if (error) {
    throw new Error(`Failed to store agent wallet: ${error.message}`);
  }
}

async function createRealAgentWallet(userAddress: string): Promise<AgentWallet> {
  const normalizedUserAddress = getAddress(userAddress);
  const cdp = getCdpClient();

  const ownerName = buildOwnerName(normalizedUserAddress);
  const owner = await cdp.evm.createAccount({
    name: ownerName,
  });

  const smartAccountName = buildSmartAccountName(normalizedUserAddress);
  const smartAccount = await cdp.evm.createSmartAccount({
    owner,
    name: smartAccountName,
  } as any);

  agentWalletRuntimeByUser.set(normalizedUserAddress, {
    owner,
    smartAccount,
  });

  return {
    userAddress: normalizedUserAddress,
    ownerAddress: getAddress(owner.address),
    smartAccountAddress: getAddress(smartAccount.address),
    ownerName,
    smartAccountName,
    mode: "cdp",
    createdAt: new Date().toISOString(),
  };
}

export async function getAgentWalletForUser(userAddress: string) {
  return loadWalletRowByUserAddress(userAddress);
}

export async function createAgentWalletForUser(userAddress: string) {
  const normalizedUserAddress = getAddress(userAddress);
  const existing = await loadWalletRowByUserAddress(normalizedUserAddress);

  if (existing) {
    return existing;
  }

  const wallet = env.mockWeb3
    ? createMockAgentWallet(normalizedUserAddress)
    : await createRealAgentWallet(normalizedUserAddress);

  await saveWallet(wallet);
  return wallet;
}

export async function getOrCreateAgentWalletForUser(userAddress: string) {
  const existing = await getAgentWalletForUser(userAddress);
  if (existing) {
    return existing;
  }

  return createAgentWalletForUser(userAddress);
}
