import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function createNonce() {
  const nonce = crypto.randomUUID().replace(/-/g, "");

  const { error } = await supabaseAdmin
    .from("auth_nonces")
    .insert({ nonce });

  if (error) {
    throw new Error(`Failed to persist nonce: ${error.message}`);
  }

  return nonce;
}

export async function consumeNonce(nonce: string) {
  const { data, error } = await supabaseAdmin
    .from("auth_nonces")
    .select("nonce, consumed_at")
    .eq("nonce", nonce)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load nonce: ${error.message}`);
  }

  if (!data || data.consumed_at) {
    return false;
  }

  const { error: updateError } = await supabaseAdmin
    .from("auth_nonces")
    .update({ consumed_at: new Date().toISOString() })
    .eq("nonce", nonce)
    .is("consumed_at", null);

  if (updateError) {
    throw new Error(`Failed to consume nonce: ${updateError.message}`);
  }

  return true;
}
