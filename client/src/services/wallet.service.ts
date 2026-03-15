import { BaseApiService } from './api.service';

export interface AgentWallet {
	userAddress: string;
	ownerAddress: string;
	smartAccountAddress: string;
	mode: 'mock' | 'cdp';
	createdAt: string;
}

export interface GetWalletResponse {
	exists: boolean;
	wallet: AgentWallet | null;
}

export interface CreateWalletResponse {
	wallet: AgentWallet;
}

class WalletService extends BaseApiService {
	async getWallet(): Promise<GetWalletResponse> {
		return this.get<GetWalletResponse>('/wallet');
	}

	async createWallet(): Promise<CreateWalletResponse> {
		return this.post<CreateWalletResponse>('/wallet');
	}
}

export const walletService = new WalletService();
