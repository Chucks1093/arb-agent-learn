function getEnv(name: string, fallback?: string): string {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (fallback !== undefined) {
    return fallback;
  }

  throw new Error(`Missing required env var: ${name}`);
}

export const env = {
  supabaseUrl: getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseServiceRoleKey: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  clientOrigin: getEnv("CLIENT_ORIGIN", "http://localhost:5173"),
  baseRpcUrl: getEnv("BASE_RPC_URL", "https://mainnet.base.org"),
  sessionCookieName: getEnv("SESSION_COOKIE_NAME", "arb_agent_session"),
};
