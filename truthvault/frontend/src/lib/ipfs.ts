const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT || "";
const GATEWAY = "https://gateway.pinata.cloud/ipfs";

async function fetchWithRetry(url: string, options: RequestInit, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  throw new Error("IPFS upload failed after 3 attempts");
}

export async function uploadToIPFS(blob: Blob, filename = "evidence"): Promise<string> {
  const form = new FormData();
  form.append("file", blob, filename);

  const res = await fetchWithRetry("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body: form,
  });

  if (!res.ok) throw new Error(`IPFS upload failed: ${res.statusText}`);

  const data = await res.json();
  return data.IpfsHash as string;
}

export function ipfsGatewayUrl(cid: string): string {
  return `${GATEWAY}/${cid}`;
}

export async function uploadJSONToIPFS(obj: object): Promise<string> {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  return uploadToIPFS(blob, "metadata.json");
}