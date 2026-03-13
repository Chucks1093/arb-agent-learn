declare global {
  var __arbAgentLearnNonces: Set<string> | undefined;
}

export const nonceStore = globalThis.__arbAgentLearnNonces ?? new Set<string>();

globalThis.__arbAgentLearnNonces = nonceStore;

export function createNonce() {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  nonceStore.add(nonce);
  return nonce;
}

export function consumeNonce(nonce: string) {
  if (!nonceStore.has(nonce)) {
    return false;
  }

  nonceStore.delete(nonce);
  return true;
}
