import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  BASE_RPC_URL: z.string().default("https://mainnet.base.org"),
  SESSION_COOKIE_NAME: z.string().default("arb_agent_session"),
  MOCK_WEB3: z
    .string()
    .optional()
    .transform((value) => value === "true"),
  CDP_API_KEY_ID: z.string().optional(),
  CDP_API_KEY_SECRET: z.string().optional(),
  CDP_WALLET_SECRET: z.string().optional(),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  BASE_RPC_URL: process.env.BASE_RPC_URL,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
  MOCK_WEB3: process.env.MOCK_WEB3,
  CDP_API_KEY_ID: process.env.CDP_API_KEY_ID,
  CDP_API_KEY_SECRET: process.env.CDP_API_KEY_SECRET,
  CDP_WALLET_SECRET: process.env.CDP_WALLET_SECRET,
});

export const env = {
  supabaseUrl: parsedEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
  clientOrigin: parsedEnv.CLIENT_ORIGIN,
  baseRpcUrl: parsedEnv.BASE_RPC_URL,
  sessionCookieName: parsedEnv.SESSION_COOKIE_NAME,
  mockWeb3: parsedEnv.MOCK_WEB3 ?? false,
  cdpApiKeyId: parsedEnv.CDP_API_KEY_ID,
  cdpApiKeySecret: parsedEnv.CDP_API_KEY_SECRET,
  cdpWalletSecret: parsedEnv.CDP_WALLET_SECRET,
};
