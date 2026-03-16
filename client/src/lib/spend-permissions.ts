import { createBaseAccountSDK } from '@base-org/account';

export type SpendPermission = {
	createdAt?: number;
	permissionHash?: string;
	signature: string;
	chainId?: number;
	permission: {
		account: string;
		spender: string;
		token: string;
		allowance: string;
		period: number;
		start: number;
		end: number;
		salt: string;
		extraData: string;
	};
};

export const BASE_CHAIN_ID = 8453;
export const BASE_USDC_ADDRESS =
	'0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

function getProvider() {
	const sdk = createBaseAccountSDK({ appName: 'ARBAgent' });
	return sdk.getProvider();
}

export async function requestUserSpendPermission(params: {
	userAddress: string;
	spenderAddress: string;
	dailyLimitUsd: number;
}) {
	const { requestSpendPermission } = await import(
		'@base-org/account/spend-permission/browser'
	);

	return requestSpendPermission({
		account: params.userAddress,
		spender: params.spenderAddress,
		token: BASE_USDC_ADDRESS,
		chainId: BASE_CHAIN_ID,
		allowance: BigInt(Math.floor(params.dailyLimitUsd * 1_000_000)),
		periodInDays: 1,
		provider: getProvider(),
	});
}

export async function getSpendPermissionStatus(permission: SpendPermission) {
	const { getPermissionStatus } = await import(
		'@base-org/account/spend-permission'
	);

	return getPermissionStatus(permission);
}

export async function revokeUserSpendPermission(permission: SpendPermission) {
	const { requestRevoke } = await import(
		'@base-org/account/spend-permission/browser'
	);

	return requestRevoke({
		permission,
		provider: getProvider(),
	});
}
