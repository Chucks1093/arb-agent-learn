import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  BASE_RPC_URL: z.string().default("https://mainnet.base.org"),
  SESSION_COOKIE_NAME: z.string().default("arb_agent_session"),
});

const parsedEnv = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  BASE_RPC_URL: process.env.BASE_RPC_URL,
  SESSION_COOKIE_NAME: process.env.SESSION_COOKIE_NAME,
});

export const env = {
  supabaseUrl: parsedEnv.NEXT_PUBLIC_SUPABASE_URL,
  supabaseServiceRoleKey: parsedEnv.SUPABASE_SERVICE_ROLE_KEY,
  clientOrigin: parsedEnv.CLIENT_ORIGIN,
  baseRpcUrl: parsedEnv.BASE_RPC_URL,
  sessionCookieName: parsedEnv.SESSION_COOKIE_NAME,
};
