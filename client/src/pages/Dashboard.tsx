import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLoaderData, useNavigate } from 'react-router';
import {
	authService,
	type SessionResponse,
} from '@/services/auth.service';
import { walletService } from '@/services/wallet.service';
import {
	arbitrageService,
	type ArbitragePath,
} from '@/services/arbitrage.service';
import {
	getSpendPermissionStatus,
	requestUserSpendPermission,
	revokeUserSpendPermission,
} from '@/lib/spend-permissions';
import {
	spendPermissionService,
	type StoredSpendPermission,
} from '@/services/spend-permission.service';
import showToast from '@/utils/toast.util';
import { shortenAddress } from '@/lib/web3/format';

function Dashboard() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const loaderSession = useLoaderData() as SessionResponse;
	const [dailyLimit, setDailyLimit] = useState(5);
	const [scanAmount, setScanAmount] = useState('10');

	const { data: sessionData } = useQuery({
		queryKey: ['auth-session'],
		queryFn: () => authService.getSession(),
		initialData: loaderSession,
	});

	const { data: walletData, isLoading: isWalletLoading } = useQuery({
		queryKey: ['agent-wallet'],
		queryFn: () => walletService.createWallet(),
		enabled: Boolean(sessionData?.authenticated),
	});

	const { data: permissionsData, isLoading: isPermissionsLoading } = useQuery({
		queryKey: ['spend-permissions'],
		queryFn: () => spendPermissionService.getSpendPermissions(),
		enabled: Boolean(sessionData?.authenticated && walletData?.wallet),
	});

	const { data: permissionStatuses } = useQuery({
		queryKey: [
			'spend-permission-statuses',
			permissionsData?.permissions.map(permission => permission.permissionHash),
		],
		queryFn: async () => {
			const entries = await Promise.all(
				(permissionsData?.permissions ?? []).map(async permission => [
					permission.permissionHash,
					await getSpendPermissionStatus(permission.permission),
				])
			);

			return Object.fromEntries(entries);
		},
		enabled: Boolean(permissionsData?.permissions.length),
	});

	const grantPermissionMutation = useMutation({
		mutationFn: async () => {
			if (!sessionData?.address) {
				throw new Error('No authenticated wallet address found');
			}

			if (!walletData?.wallet.smartAccountAddress) {
				throw new Error('Agent smart account is unavailable');
			}

			const permission = await requestUserSpendPermission({
				userAddress: sessionData.address,
				spenderAddress: walletData.wallet.smartAccountAddress,
				dailyLimitUsd: dailyLimit,
			});

			if (!permission.permissionHash) {
				throw new Error('Permission hash missing from wallet response');
			}

			return spendPermissionService.saveSpendPermission(permission);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['spend-permissions'] });
			await queryClient.invalidateQueries({
				queryKey: ['spend-permission-statuses'],
			});
			showToast.success('Spend permission granted');
		},
		onError: error => {
			showToast.error(
				error instanceof Error
					? error.message
					: 'Failed to grant spend permission'
			);
		},
	});

	const revokePermissionMutation = useMutation({
		mutationFn: async (permission: StoredSpendPermission) => {
			await revokeUserSpendPermission(permission.permission);
			return spendPermissionService.revokeSpendPermission(
				permission.permissionHash
			);
		},
		onSuccess: async () => {
			await queryClient.invalidateQueries({ queryKey: ['spend-permissions'] });
			await queryClient.invalidateQueries({
				queryKey: ['spend-permission-statuses'],
			});
			showToast.success('Spend permission revoked');
		},
		onError: error => {
			showToast.error(
				error instanceof Error
					? error.message
					: 'Failed to revoke spend permission'
			);
		},
	});

	const scanMutation = useMutation({
		mutationFn: (amountUsdc: string) =>
			arbitrageService.scanOpportunity(amountUsdc),
		onError: error => {
			showToast.error(
				error instanceof Error ? error.message : 'Failed to scan opportunity'
			);
		},
	});

	const logoutMutation = useMutation({
		mutationFn: () => authService.logout(),
		onSuccess: async () => {
			queryClient.setQueryData(['auth-session'], {
				authenticated: false,
			});
			queryClient.removeQueries({ queryKey: ['agent-wallet'] });
			queryClient.removeQueries({ queryKey: ['spend-permissions'] });
			queryClient.removeQueries({ queryKey: ['spend-permission-statuses'] });
			showToast.success('Signed out');
			navigate('/auth', { replace: true });
		},
		onError: error => {
			showToast.error(
				error instanceof Error ? error.message : 'Failed to sign out'
			);
		},
	});

	const formatAllowance = (allowance: string) =>
		(Number(allowance) / 1_000_000).toFixed(2);

	const bestPath =
		scanMutation.data &&
		(Number(scanMutation.data.paths.uniToAero.netProfitUsdc) >=
		Number(scanMutation.data.paths.aeroToUni.netProfitUsdc)
			? scanMutation.data.paths.uniToAero
			: scanMutation.data.paths.aeroToUni);

	const renderPathCard = (path: ArbitragePath, label: string) => (
		<div className="rounded-xl border border-white/8 bg-black/20 p-4">
			<div className="flex items-center justify-between gap-4">
				<div>
					<p className="text-xs uppercase tracking-[0.16em] text-white/45">
						{label}
					</p>
					<p className="mt-2 text-lg font-medium text-white">
						{path.direction}
					</p>
				</div>

				<div
					className={`rounded-full px-3 py-1 text-xs uppercase tracking-[0.16em] ${
						path.profitable
							? 'border border-[#C6FF91]/30 bg-[#C6FF91]/10 text-[#C6FF91]'
							: 'border border-white/10 bg-white/5 text-white/60'
					}`}
				>
					{path.profitable ? 'profitable' : 'not profitable'}
				</div>
			</div>

			<div className="mt-4 grid gap-3 md:grid-cols-2">
				<div>
					<p className="text-xs uppercase tracking-[0.16em] text-white/45">
						Buy leg
					</p>
					<p className="mt-2 text-sm text-white/70">
						{path.buyLeg.dex}: {path.buyLeg.amountInFormatted} in,{' '}
						{path.buyLeg.amountOutFormatted} out
					</p>
				</div>

				<div>
					<p className="text-xs uppercase tracking-[0.16em] text-white/45">
						Sell leg
					</p>
					<p className="mt-2 text-sm text-white/70">
						{path.sellLeg.dex}: {path.sellLeg.amountInFormatted} in,{' '}
						{path.sellLeg.amountOutFormatted} out
					</p>
				</div>
			</div>

			<div className="mt-4 grid gap-3 md:grid-cols-3">
				<div>
					<p className="text-xs uppercase tracking-[0.16em] text-white/45">
						Gross profit
					</p>
					<p className="mt-2 text-sm text-white">${path.grossProfitUsdc}</p>
				</div>

				<div>
					<p className="text-xs uppercase tracking-[0.16em] text-white/45">
						Net profit
					</p>
					<p className="mt-2 text-sm text-white">${path.netProfitUsdc}</p>
				</div>

				<div>
					<p className="text-xs uppercase tracking-[0.16em] text-white/45">
						Margin
					</p>
					<p className="mt-2 text-sm text-white">{path.profitMarginPercent}%</p>
				</div>
			</div>
		</div>
	);

	return (
		<main className="min-h-screen bg-[#020202] text-white px-6 py-10">
			<div className="mx-auto max-w-5xl">
				<div className="flex items-center justify-between border-b border-white/10 pb-6">
					<div>
						<p className="text-xs uppercase tracking-[0.22em] text-[#C6FF91]">
							Session Flow
						</p>
						<h1 className="mt-3 text-4xl font-semibold font-jakarta">
							ARBAgent Dashboard
						</h1>
						<p className="mt-2 text-white/65">
							Authentication is working. This page is now guarded by the
							client session loader.
						</p>
					</div>

					<button
						onClick={() => logoutMutation.mutate()}
						disabled={logoutMutation.isPending}
						className="rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-white hover:bg-white/10 disabled:opacity-60"
					>
						{logoutMutation.isPending ? 'Signing out...' : 'Sign out'}
					</button>
				</div>

				<div className="mt-8 rounded-2xl border border-[#C6FF91]/20 bg-[#0A0A0A] p-6">
					<p className="text-sm text-white/60">Authenticated wallet</p>
					<p className="mt-2 text-xl font-medium text-[#C6FF91]">
						{sessionData?.address
							? shortenAddress(sessionData.address)
							: 'Unknown'}
					</p>
				</div>

				<div className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm text-white/60">Arbitrage scanner</p>
							<h2 className="mt-2 text-xl font-medium text-white">
								Check current spread with a manual amount
							</h2>
						</div>
					</div>

					<form
						className="mt-6 flex flex-col gap-4 md:flex-row md:items-end"
						onSubmit={event => {
							event.preventDefault();
							scanMutation.mutate(scanAmount);
						}}
					>
						<label className="block">
							<span className="text-xs uppercase tracking-[0.16em] text-white/45">
								USDC amount
							</span>
							<input
								type="number"
								min="0.01"
								step="0.01"
								value={scanAmount}
								onChange={event => setScanAmount(event.target.value)}
								className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#C6FF91] md:w-56"
							/>
						</label>

						<button
							type="submit"
							disabled={scanMutation.isPending || Number(scanAmount) <= 0}
							className="rounded-lg bg-[#C6FF91] px-5 py-3 text-sm font-medium text-[#020202] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{scanMutation.isPending ? 'Scanning...' : 'Scan now'}
						</button>
					</form>

					<p className="mt-3 text-sm text-white/55">
						This runs the server-side scanner once and returns the best current
						path for the amount you entered.
					</p>

					{scanMutation.data ? (
						<div className="mt-6 space-y-4">
							<div className="rounded-xl border border-white/8 bg-black/20 p-4">
								<p className="text-xs uppercase tracking-[0.16em] text-white/45">
									Recommendation
								</p>
								<p className="mt-2 text-lg font-medium text-white">
									{scanMutation.data.recommendation.action} /{' '}
									{scanMutation.data.recommendation.direction}
								</p>
								<p className="mt-2 text-sm text-white/65">
									{scanMutation.data.recommendation.reason}
								</p>
								<div className="mt-4 grid gap-3 md:grid-cols-3">
									<div>
										<p className="text-xs uppercase tracking-[0.16em] text-white/45">
											Trade size
										</p>
										<p className="mt-2 text-sm text-white">
											${scanMutation.data.tradeSizeUsdc}
										</p>
									</div>
									<div>
										<p className="text-xs uppercase tracking-[0.16em] text-white/45">
											Expected gross
										</p>
										<p className="mt-2 text-sm text-white">
											$
											{
												scanMutation.data.recommendation
													.expectedGrossProfitUsdc
											}
										</p>
									</div>
									<div>
										<p className="text-xs uppercase tracking-[0.16em] text-white/45">
											Expected net
										</p>
										<p className="mt-2 text-sm text-white">
											$
											{scanMutation.data.recommendation.expectedNetProfitUsdc}
										</p>
									</div>
								</div>
							</div>

							<div className="grid gap-4 md:grid-cols-2">
								{renderPathCard(
									scanMutation.data.paths.uniToAero,
									'Path 1'
								)}
								{renderPathCard(
									scanMutation.data.paths.aeroToUni,
									'Path 2'
								)}
							</div>

							{bestPath ? (
								<div className="rounded-xl border border-[#C6FF91]/20 bg-[#C6FF91]/5 p-4 text-sm text-white/70">
									Best current path: {bestPath.direction} with estimated net
									profit of ${bestPath.netProfitUsdc}.
								</div>
							) : null}
						</div>
					) : null}
				</div>

				<div className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-sm text-white/60">Agent wallet</p>
							<h2 className="mt-2 text-xl font-medium text-white">
								Server execution identity
							</h2>
						</div>

						<div className="rounded-full border border-[#C6FF91]/30 bg-[#C6FF91]/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#C6FF91]">
							{walletData?.wallet.mode ?? 'loading'}
						</div>
					</div>

					<div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white/70">
						Spend permissions:{' '}
						<span className="ml-1 font-medium text-[#C6FF91]">
							{walletData?.wallet.spendPermissionsEnabled ? 'enabled' : 'not enabled'}
						</span>
					</div>

					<div className="mt-6 grid gap-4 md:grid-cols-2">
						<div className="rounded-xl border border-white/8 bg-black/20 p-4">
							<p className="text-xs uppercase tracking-[0.16em] text-white/45">
								Owner Address
							</p>
							<p className="mt-3 text-lg font-medium text-white">
								{isWalletLoading
									? 'Creating...'
									: walletData?.wallet.ownerAddress
										? shortenAddress(walletData.wallet.ownerAddress)
										: 'Unavailable'}
							</p>
						</div>

						<div className="rounded-xl border border-white/8 bg-black/20 p-4">
							<p className="text-xs uppercase tracking-[0.16em] text-white/45">
								Smart Account
							</p>
							<p className="mt-3 text-lg font-medium text-white">
								{isWalletLoading
									? 'Creating...'
									: walletData?.wallet.smartAccountAddress
										? shortenAddress(walletData.wallet.smartAccountAddress)
										: 'Unavailable'}
							</p>
						</div>
					</div>
				</div>

				<div className="mt-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-6">
					<div className="flex items-center justify-between gap-4">
						<div>
							<p className="text-sm text-white/60">Spend permissions</p>
							<h2 className="mt-2 text-xl font-medium text-white">
								Authorize the smart account to use your USDC
							</h2>
						</div>
					</div>

					<div className="mt-6 flex flex-col gap-4 md:flex-row md:items-end">
						<label className="block">
							<span className="text-xs uppercase tracking-[0.16em] text-white/45">
								Daily limit
							</span>
							<input
								type="number"
								min={1}
								value={dailyLimit}
								onChange={event => setDailyLimit(Number(event.target.value))}
								className="mt-2 w-full rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-white outline-none focus:border-[#C6FF91] md:w-56"
							/>
						</label>

						<button
							onClick={() => grantPermissionMutation.mutate()}
							disabled={
								grantPermissionMutation.isPending ||
								!walletData?.wallet.spendPermissionsEnabled ||
								dailyLimit < 1
							}
							className="rounded-lg bg-[#C6FF91] px-5 py-3 text-sm font-medium text-[#020202] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{grantPermissionMutation.isPending
								? 'Granting...'
								: `Grant $${dailyLimit}/day`}
						</button>
					</div>

					<p className="mt-3 text-sm text-white/55">
						The user keeps custody. The permission only lets the smart account
						spend up to the approved USDC limit.
					</p>

					<div className="mt-6 space-y-3">
						{isPermissionsLoading ? (
							<div className="rounded-xl border border-white/8 bg-black/20 p-4 text-sm text-white/60">
								Loading saved permissions...
							</div>
						) : permissionsData?.permissions.length ? (
							permissionsData.permissions.map(permission => {
								const liveStatus =
									permissionStatuses?.[permission.permissionHash];

								return (
									<div
										key={permission.permissionHash}
										className="rounded-xl border border-white/8 bg-black/20 p-4"
									>
										<div className="flex items-start justify-between gap-4">
											<div>
												<p className="text-sm font-medium text-white">
													${formatAllowance(permission.allowance)} USDC / day
												</p>
												<p className="mt-1 text-xs text-white/45">
													Hash: {shortenAddress(permission.permissionHash)}
												</p>
												<p className="mt-1 text-xs text-white/45">
													Spender:{' '}
													{shortenAddress(permission.smartAccountAddress)}
												</p>
											</div>

											<div className="text-right">
												<p className="text-xs uppercase tracking-[0.16em] text-white/45">
													Status
												</p>
												<p className="mt-1 text-sm text-[#C6FF91]">
													{permission.status === 'revoked'
														? 'revoked'
														: liveStatus?.isActive
															? 'active'
															: 'saved'}
												</p>
											</div>
										</div>

										<div className="mt-4 flex items-center justify-between gap-4">
											<p className="text-xs text-white/45">
												{liveStatus?.remainingSpend !== undefined
													? `Remaining: $${(
															Number(liveStatus.remainingSpend) / 1_000_000
													  ).toFixed(2)}`
													: 'Remaining spend will load after status check'}
											</p>

											<button
												onClick={() =>
													revokePermissionMutation.mutate(permission)
												}
												disabled={
													revokePermissionMutation.isPending ||
													permission.status === 'revoked'
												}
												className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
											>
												{revokePermissionMutation.isPending
													? 'Revoking...'
													: 'Revoke'}
											</button>
										</div>
									</div>
								);
							})
						) : (
							<div className="rounded-xl border border-white/8 bg-black/20 p-4 text-sm text-white/60">
								No saved spend permissions yet.
							</div>
						)}
					</div>
				</div>
			</div>
		</main>
	);
}

export default Dashboard;
