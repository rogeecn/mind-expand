export function createId() {
  if (typeof globalThis !== "undefined") {
    const cryptoObject = globalThis.crypto as Crypto | undefined;
    if (cryptoObject?.randomUUID) {
      return cryptoObject.randomUUID();
    }
  }

  const timePart = Date.now().toString(36);
  const randomPart = Math.random().toString(36).slice(2, 10);
  return `id-${timePart}-${randomPart}`;
}
