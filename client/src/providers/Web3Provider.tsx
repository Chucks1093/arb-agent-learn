import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { wagmiConfig } from '@/lib/web3/wagmiConfig';

const queryClient = new QueryClient();

interface Web3ProviderProps {
	children: ReactNode;
}

function Web3Provider({ children }: Web3ProviderProps) {
	return (
		<WagmiProvider config={wagmiConfig}>
			<QueryClientProvider client={queryClient}>
				{children}
			</QueryClientProvider>
		</WagmiProvider>
	);
}

export default Web3Provider;
