import { FallbackProvider, JsonRpcProvider, JsonRpcSigner } from 'ethers';
import { useMemo } from 'react';
import { useEthersProvider } from '@/hooks/useEthersProvider';
import { useEthersSigner } from '@/hooks/useEthersSigner';

export type ContractProvider = JsonRpcProvider | FallbackProvider | undefined;
export type ContractSigner = JsonRpcSigner | undefined;

type ContractServiceConstructor<T> = new (
	provider: ContractProvider,
	signer: ContractSigner
) => T;

export function useContractService<T extends object>(
	ContractService: ContractServiceConstructor<T>
) {
	const signer = useEthersSigner();
	const provider = useEthersProvider();

	return useMemo(() => {
		if (!provider) {
			return undefined;
		}

		return new ContractService(provider, signer);
	}, [ContractService, provider, signer]);
}
