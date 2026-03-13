import { env } from '@/utils/env.utils';
import axios, { type AxiosInstance, AxiosError } from 'axios';

export interface APIResponse<T = undefined> {
	success: boolean;
	data: T;
}

export interface APIErrorResponse {
	success: false;
	error: {
		message: string;
		details?: unknown;
	};
}

export class ApiError extends Error {
	public status: number;
	public response?: APIErrorResponse;

	constructor(
		message: string,
		status: number = 500,
		response?: APIErrorResponse
	) {
		super(message);
		this.name = 'ApiError';
		this.status = status;
		this.response = response;
	}
}

// BASE CLASS - All services inherit from this
export class BaseApiService {
	protected api: AxiosInstance;
	protected API_URL: string;

	constructor() {
		this.API_URL = env.VITE_BACKEND_URL;

		this.api = axios.create({
			baseURL: this.API_URL,
			withCredentials: true, // Send cookies
		});
	}

	// Common error handler
	protected handleError(error: unknown): ApiError {
		if (axios.isAxiosError(error)) {
			const axiosError = error as AxiosError<APIErrorResponse>;

			if (axiosError.response) {
				const status = axiosError.response.status;
				const data = axiosError.response.data;
				const message = data?.error?.message || 'An error occurred';

				return new ApiError(message, status, data);
			} else if (axiosError.request) {
				return new ApiError('Network error - check your connection', 0);
			}
		}

		if (error instanceof Error) {
			return new ApiError(error.message, 500);
		}

		return new ApiError('Something went wrong', 500);
	}
	protected async get<T>(url: string): Promise<T> {
		try {
			const response = await this.api.get<APIResponse<T>>(url);
			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}

	protected async post<T>(url: string, payload?: unknown): Promise<T> {
		try {
			const response = await this.api.post<APIResponse<T>>(url, payload);
			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}
}
