import { ScrollArea } from '@/components/ui/scroll-area';
import { createBaseAccountSDK } from '@base-org/account';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import showToast from '@/utils/toast.util';
import { shortenAddress } from '@/lib/web3/format';
import { useNavigate } from 'react-router';

function Authentication() {
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const { data: sessionData } = useQuery({
		queryKey: ['auth-session'],
		queryFn: () => authService.getSession(),
	});

	const { data: nonceData } = useQuery({
		queryKey: ['auth-nonce'],
		queryFn: () => authService.getNonce(),
	});

	const signInWithBaseMutation = useMutation({
		mutationFn: async () => {
			const nonce = nonceData?.nonce ?? (await authService.getNonce()).nonce;

			const provider = createBaseAccountSDK({
				appName: 'ARBAgent',
			}).getProvider();

			const connectResponse = (await provider.request({
				method: 'wallet_switchEthereumChain',
				params: [{ chainId: '0x2105' }],
			})) as unknown;

			console.log('Switch chain response:', connectResponse);

			const walletConnectResponse = (await provider.request({
				method: 'wallet_connect',
				params: [
					{
						version: '1',
						capabilities: {
							signInWithEthereum: {
								nonce,
								chainId: '0x2105',
							},
						},
					},
				],
			})) as {
				accounts: Array<{
					address: string;
					capabilities?: {
						signInWithEthereum?: {
							message: string;
							signature: string;
						};
					};
				}>;
			};

			const account = walletConnectResponse.accounts?.[0];

			if (!account?.address) {
				throw new Error('No account address received from wallet');
			}

			const signInPayload = account.capabilities?.signInWithEthereum;

			if (!signInPayload?.message || !signInPayload.signature) {
				throw new Error('Missing sign-in payload from Base wallet');
			}

			return await authService.verify({
				address: account.address,
				message: signInPayload.message,
				signature: signInPayload.signature,
			});
		},
		onSuccess: async data => {
			queryClient.setQueryData(['auth-session'], {
				authenticated: true,
				address: data.address,
			});
			void queryClient.invalidateQueries({ queryKey: ['auth-session'] });
			void queryClient.invalidateQueries({ queryKey: ['auth-nonce'] });
			showToast.success(`Signed in: ${shortenAddress(data.address)}`);
			navigate('/', { replace: true });
		},
		onError: error => {
			showToast.error(
				error instanceof Error
					? error.message
					: 'Failed to sign in with Base'
			);
		},
	});

	const handleSignInWithBase = async () => {
		await signInWithBaseMutation.mutateAsync();
	};

	return (
		<div className="grid grid-cols-1 lg:grid-cols-[55%_45%] grid-rows-[100vh]   h-screen">
			<div className="h-full ">
				<ScrollArea className="h-full">
					<div className="px-1 max-w-[37.9rem] mx-auto pb-8">
						<div className="px-5 md:px-1 ">
							<header className="flex justify-between items-center mt-8 md:mt-18">
								<img
									className="font-jakarta size-11 "
									src="/icons/logo.svg"
								/>
							</header>
							<div className="mt-12 ">
								<h1 className="font-semibold text-3xl font-jakarta">
									ARBAgent
								</h1>
								<p className="text-gray-600 font-jakarta mt-4">
									AI-powered arbitrage on Base. Sign in with your Base
									account to start learning how authentication works in
									the app.
								</p>
								<div className="flex items-center gap-4 mt-8">
									<hr className="w-full bg-zinc-400" />
									<p className="font-jakarta text-zinc-400 text-sm">
										Base
									</p>
									<hr className="w-full bg-zinc-400" />
								</div>
								<div className="flex items-center justify-center mt-8 gap-4">
									<button
										onClick={handleSignInWithBase}
										disabled={signInWithBaseMutation.isPending}
										className="w-full flex items-center justify-center gap-3 border border-gray-300 py-4 px-4 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
									>
										<div className="h-4 w-4 rounded-[3px] bg-blue-600 shrink-0" />
										<span className="text-sm font-jakarta font-medium text-gray-700">
											{signInWithBaseMutation.isPending
												? 'Connecting...'
												: 'Sign in with Base'}
										</span>
									</button>
								</div>
								{sessionData?.authenticated && sessionData.address ? (
									<p className="mt-4 text-sm font-jakarta text-green-700">
										Signed in as {shortenAddress(sessionData.address)}
									</p>
								) : null}
							</div>
						</div>
					</div>
				</ScrollArea>
			</div>

			<div className="bg-blue-600 lg:block hidden "></div>
		</div>
	);
}

export default Authentication;
