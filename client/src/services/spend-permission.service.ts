import { BaseApiService } from './api.service';
import type { SpendPermission } from '@/lib/spend-permissions';

export interface StoredSpendPermission {
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
	status: 'active' | 'revoked';
	permission: SpendPermission;
	grantedAt: string | null;
	revokedAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface GetSpendPermissionsResponse {
	permissions: StoredSpendPermission[];
}

export interface SaveSpendPermissionResponse {
	permission: StoredSpendPermission;
}

class SpendPermissionService extends BaseApiService {
	async getSpendPermissions(): Promise<GetSpendPermissionsResponse> {
		return this.get<GetSpendPermissionsResponse>('/spend-permissions');
	}

	async saveSpendPermission(
		permission: SpendPermission
	): Promise<SaveSpendPermissionResponse> {
		return this.post<SaveSpendPermissionResponse>('/spend-permissions', {
			permission,
		});
	}

	async revokeSpendPermission(permissionHash: string) {
		return this.post<SaveSpendPermissionResponse>('/spend-permissions/revoke', {
			permissionHash,
		});
	}
}

export const spendPermissionService = new SpendPermissionService();
