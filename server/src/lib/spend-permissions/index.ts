import { getAddress } from "viem";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type SpendPermissionPayload = {
  createdAt?: number;
  permissionHash: string;
  signature: string;
  chainId?: number;
  permission: {
    account: string;
    spender: string;
    token: string;
    allowance: string;
    period: number;
    start: number;
    end?: number;
    salt: string;
    extraData: string;
  };
};

export type StoredSpendPermission = {
  permissionHash: string;
  userAddress: string;
  smartAccountAddress: string;
  tokenAddress: string;
  chainId: number;
  allowance: string;
  periodSeconds: number;
  startUnix: number;
  endUnix: number | null;
  salt: string;
  extraData: string;
  signature: string;
  status: "active" | "revoked";
  permission: SpendPermissionPayload;
  grantedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type SpendPermissionRow = {
  permission_hash: string;
  user_address: string;
  smart_account_address: string;
  token_address: string;
  chain_id: number;
  allowance: string;
  period_seconds: number;
  start_unix: number;
  end_unix: number | null;
  salt: string;
  extra_data: string;
  signature: string;
  status: "active" | "revoked";
  permission_json: SpendPermissionPayload;
  granted_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

function toStoredSpendPermission(row: SpendPermissionRow): StoredSpendPermission {
  return {
    permissionHash: row.permission_hash,
    userAddress: getAddress(row.user_address),
    smartAccountAddress: getAddress(row.smart_account_address),
    tokenAddress: getAddress(row.token_address),
    chainId: row.chain_id,
    allowance: row.allowance,
    periodSeconds: row.period_seconds,
    startUnix: row.start_unix,
    endUnix: row.end_unix,
    salt: row.salt,
    extraData: row.extra_data,
    signature: row.signature,
    status: row.status,
    permission: row.permission_json,
    grantedAt: row.granted_at,
    revokedAt: row.revoked_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listSpendPermissionsForUser(userAddress: string) {
  const { data, error } = await supabaseAdmin
    .from("spend_permissions")
    .select(
      "permission_hash, user_address, smart_account_address, token_address, chain_id, allowance, period_seconds, start_unix, end_unix, salt, extra_data, signature, status, permission_json, granted_at, revoked_at, created_at, updated_at",
    )
    .eq("user_address", getAddress(userAddress))
    .order("created_at", { ascending: false })
    .returns<SpendPermissionRow[]>();

  if (error) {
    throw new Error(`Failed to load spend permissions: ${error.message}`);
  }

  return (data ?? []).map(toStoredSpendPermission);
}

export async function getSpendPermissionForUser(params: {
  userAddress: string;
  permissionHash: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("spend_permissions")
    .select(
      "permission_hash, user_address, smart_account_address, token_address, chain_id, allowance, period_seconds, start_unix, end_unix, salt, extra_data, signature, status, permission_json, granted_at, revoked_at, created_at, updated_at",
    )
    .eq("permission_hash", params.permissionHash)
    .eq("user_address", getAddress(params.userAddress))
    .maybeSingle<SpendPermissionRow>();

  if (error) {
    throw new Error(`Failed to load spend permission: ${error.message}`);
  }

  return data ? toStoredSpendPermission(data) : null;
}

export async function getLatestActiveSpendPermissionForUser(params: {
  userAddress: string;
  smartAccountAddress?: string;
}) {
  let query = supabaseAdmin
    .from("spend_permissions")
    .select(
      "permission_hash, user_address, smart_account_address, token_address, chain_id, allowance, period_seconds, start_unix, end_unix, salt, extra_data, signature, status, permission_json, granted_at, revoked_at, created_at, updated_at",
    )
    .eq("user_address", getAddress(params.userAddress))
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);

  if (params.smartAccountAddress) {
    query = query.eq("smart_account_address", getAddress(params.smartAccountAddress));
  }

  const { data, error } = await query.returns<SpendPermissionRow[]>();

  if (error) {
    throw new Error(`Failed to load latest active spend permission: ${error.message}`);
  }

  const row = data?.[0];
  return row ? toStoredSpendPermission(row) : null;
}

export async function saveSpendPermission(permission: SpendPermissionPayload) {
  const account = getAddress(permission.permission.account);
  const spender = getAddress(permission.permission.spender);
  const token = getAddress(permission.permission.token);
  const grantedAt = permission.createdAt
    ? new Date(permission.createdAt * 1000).toISOString()
    : new Date().toISOString();

  const payload = {
    permission_hash: permission.permissionHash,
    user_address: account,
    smart_account_address: spender,
    token_address: token,
    chain_id: permission.chainId ?? 8453,
    allowance: permission.permission.allowance,
    period_seconds: permission.permission.period,
    start_unix: permission.permission.start,
    end_unix: permission.permission.end ?? null,
    salt: permission.permission.salt,
    extra_data: permission.permission.extraData,
    signature: permission.signature,
    status: "active" as const,
    permission_json: permission,
    granted_at: grantedAt,
    revoked_at: null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabaseAdmin
    .from("spend_permissions")
    .upsert(payload, { onConflict: "permission_hash" })
    .select(
      "permission_hash, user_address, smart_account_address, token_address, chain_id, allowance, period_seconds, start_unix, end_unix, salt, extra_data, signature, status, permission_json, granted_at, revoked_at, created_at, updated_at",
    )
    .single<SpendPermissionRow>();

  if (error) {
    throw new Error(`Failed to save spend permission: ${error.message}`);
  }

  return toStoredSpendPermission(data);
}

export async function markSpendPermissionRevoked(params: {
  userAddress: string;
  permissionHash: string;
}) {
  const { data, error } = await supabaseAdmin
    .from("spend_permissions")
    .update({
      status: "revoked",
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("permission_hash", params.permissionHash)
    .eq("user_address", getAddress(params.userAddress))
    .select(
      "permission_hash, user_address, smart_account_address, token_address, chain_id, allowance, period_seconds, start_unix, end_unix, salt, extra_data, signature, status, permission_json, granted_at, revoked_at, created_at, updated_at",
    )
    .single<SpendPermissionRow>();

  if (error) {
    throw new Error(`Failed to revoke spend permission: ${error.message}`);
  }

  return toStoredSpendPermission(data);
}
