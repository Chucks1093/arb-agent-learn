import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { shortenAddress } from '@/lib/web3/format';

function ConnectWalletButton() {
	const { address, isConnected } = useAccount();
	const { connect, connectors, error, isPending } = useConnect();
	const { disconnect } = useDisconnect();

	const primaryConnector = connectors[0];

	if (isConnected && address) {
		return (
			<button
				type="button"
				onClick={() => disconnect()}
				className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
			>
				{shortenAddress(address)}
			</button>
		);
	}

	return (
		<div className="flex flex-col gap-2">
			<button
				type="button"
				onClick={() =>
					primaryConnector && connect({ connector: primaryConnector })
				}
				disabled={!primaryConnector || isPending}
				className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
			>
				{isPending ? 'Connecting...' : 'Connect Wallet'}
			</button>
			{error ? (
				<p className="text-sm text-red-600">{error.message}</p>
			) : null}
		</div>
	);
}

export default ConnectWalletButton;
