import { BaseApiService } from './api.service';

export interface NonceResponse {
	nonce: string;
}

export interface VerifyAuthPayload {
	address: string;
	message: string;
	signature: string;
}

export interface VerifyAuthResponse {
	address: string;
}

export interface SessionResponse {
	authenticated: boolean;
	address?: string;
}

class AuthService extends BaseApiService {
	async getNonce(): Promise<NonceResponse> {
		return this.get<NonceResponse>('/auth/verify');
	}

	async verify(input: VerifyAuthPayload): Promise<VerifyAuthResponse> {
		return this.post<VerifyAuthResponse>('/auth/verify', input);
	}

	async getSession(): Promise<SessionResponse> {
		return this.get<SessionResponse>('/auth/session');
	}
}

export const authService = new AuthService();
