import { createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { defaultChain, supportedChains } from '@/lib/web3/chains';
import { env } from '@/utils/env.utils';

export const wagmiConfig = createConfig({
	chains: supportedChains,
	connectors: [injected()],
	multiInjectedProviderDiscovery: true,
	transports: {
		1: http(env.VITE_MAINNET_RPC_URL),
		84532: http(env.VITE_BASE_SEPOLIA_RPC_URL),
		11155111: http(env.VITE_SEPOLIA_RPC_URL),
		31337: http(env.VITE_ANVIL_RPC_URL),
	},
	ssr: false,
});

export { defaultChain };

declare module 'wagmi' {
	interface Register {
		config: typeof wagmiConfig;
	}
}
