import { BaseApiService, type APIResponse } from './api.service';

export type ArbitrageDirection =
	| 'UNI_TO_AERO'
	| 'AERO_TO_UNI'
	| 'NO_OPPORTUNITY';

export interface ArbitrageLegQuote {
	dex: 'uniswap-v3' | 'aerodrome';
	amountIn: string;
	amountOut: string;
	amountInFormatted: string;
	amountOutFormatted: string;
	available: boolean;
	error?: string;
}

export interface ArbitragePath {
	direction: Exclude<ArbitrageDirection, 'NO_OPPORTUNITY'>;
	buyLeg: ArbitrageLegQuote;
	sellLeg: ArbitrageLegQuote;
	grossProfitUsdc: string;
	netProfitUsdc: string;
	profitMarginPercent: string;
	profitable: boolean;
}

export interface ArbitrageScanResult {
	timestamp: string;
	tradeSizeUsdc: string;
	quotes: {
		buyWeth: {
			uniswap: ArbitrageLegQuote;
			aerodrome: ArbitrageLegQuote;
		};
	};
	paths: {
		uniToAero: ArbitragePath;
		aeroToUni: ArbitragePath;
	};
	recommendation: {
		direction: ArbitrageDirection;
		expectedGrossProfitUsdc: string;
		expectedNetProfitUsdc: string;
		action: 'EXECUTE' | 'WAIT';
		reason: string;
	};
}

class ArbitrageService extends BaseApiService {
	async scanOpportunity(amountUsdc: string): Promise<ArbitrageScanResult> {
		try {
			const response = await this.api.get<APIResponse<ArbitrageScanResult>>(
				'/arb-opps',
				{
					params: {
						amount: amountUsdc,
					},
				}
			);

			return response.data.data;
		} catch (error) {
			throw this.handleError(error);
		}
	}
}

export const arbitrageService = new ArbitrageService();
