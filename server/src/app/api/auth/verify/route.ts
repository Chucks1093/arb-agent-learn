import { NextRequest } from "next/server";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { fail, ok } from "@/lib/api";
import { consumeNonce, createNonce } from "@/lib/auth/auth-store";
import { env } from "@/lib/env";
import { setSessionCookieOnResponse } from "@/lib/auth/session";

const client = createPublicClient({
  chain: base,
  transport: http(env.baseRpcUrl),
});

type VerifyBody = {
  address?: string;
  message?: string;
  signature?: string;
};

function extractNonce(message: string) {
  const inlineNonce = message.match(/Nonce:\s*(\w+)/i)?.[1];
  if (inlineNonce) {
    return inlineNonce;
  }

  return message.match(/at\s+(\w{32,})$/i)?.[1] ?? null;
}

export async function GET() {
  const nonce = await createNonce();
  return ok({ nonce });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as VerifyBody | null;

  if (!body?.address || !body.message || !body.signature) {
    return fail("Missing required auth payload", 400);
  }

  const nonce = extractNonce(body.message);
  if (!nonce || !(await consumeNonce(nonce))) {
    return fail("Invalid or reused nonce", 401);
  }

  const valid = await client.verifyMessage({
    address: body.address as `0x${string}`,
    message: body.message,
    signature: body.signature as `0x${string}`,
  });

  if (!valid) {
    return fail("Invalid signature", 401);
  }

  const response = ok({ address: body.address });
  return setSessionCookieOnResponse(response, body.address);
}
