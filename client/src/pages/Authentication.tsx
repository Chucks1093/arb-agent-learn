import { ScrollArea } from '@/components/ui/scroll-area';

function Authentication() {
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
									<button className="w-full flex items-center justify-center gap-3 border border-gray-300 py-4 px-4 rounded-md hover:bg-gray-50 hover:border-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
										<div className="h-4 w-4 rounded-[3px] bg-blue-600 shrink-0" />
										<span className="text-sm font-jakarta font-medium text-gray-700">
											Sign in with Base
										</span>
									</button>
								</div>
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
