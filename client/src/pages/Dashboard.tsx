import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { authService } from '@/services/auth.service';
import showToast from '@/utils/toast.util';
import { shortenAddress } from '@/lib/web3/format';

function Dashboard() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();

	const { data: sessionData } = useQuery({
		queryKey: ['auth-session'],
		queryFn: () => authService.getSession(),
	});

	const logoutMutation = useMutation({
		mutationFn: () => authService.logout(),
		onSuccess: async () => {
			queryClient.setQueryData(['auth-session'], {
				authenticated: false,
			});
			showToast.success('Signed out');
			navigate('/auth', { replace: true });
		},
		onError: error => {
			showToast.error(
				error instanceof Error ? error.message : 'Failed to sign out'
			);
		},
	});

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
			</div>
		</main>
	);
}

export default Dashboard;
