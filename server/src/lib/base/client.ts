import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { env } from "@/lib/env";

export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(env.baseRpcUrl),
});
