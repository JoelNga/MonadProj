export async function generateEncryptionKey(): Promise<{ cryptoKey: CryptoKey; hexKey: string }> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const cryptoKey = await crypto.subtle.importKey(
    "raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]
  );
  const hexKey = Array.from(raw).map(b => b.toString(16).padStart(2, "0")).join("");
  return { cryptoKey, hexKey };
}

export async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  const result = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.byteLength);
  return new Blob([result], { type: "application/octet-stream" });
}

export async function decryptFile(encryptedBlob: Blob, hexKey: string): Promise<ArrayBuffer> {
  const raw = new Uint8Array(hexKey.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);

  const buffer = await encryptedBlob.arrayBuffer();
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);

  return crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, ciphertext);
}