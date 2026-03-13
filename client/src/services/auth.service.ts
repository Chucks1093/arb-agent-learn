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

export interface LegacyRegisterPayload {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	password: string;
	confirmPassword?: string;
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

	// Temporary placeholders for template files that still compile in this repo.
	async register(_input: LegacyRegisterPayload): Promise<never> {
		throw new Error('Email registration is not part of arb-agent-learn auth');
	}

	async getProfile(): Promise<SessionResponse | null> {
		return null;
	}
}

export const authService = new AuthService();
