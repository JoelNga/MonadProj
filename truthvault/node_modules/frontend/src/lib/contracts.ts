import { createPublicClient, createWalletClient, custom, http } from "viem";
import { monadTestnet } from "@/lib/wagmi";

export const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_EVIDENCE_VAULT_ADDRESS || "0x") as `0x${string}`;
export const NFT_ADDRESS = (process.env.NEXT_PUBLIC_EVIDENCE_NFT_ADDRESS || "0x") as `0x${string}`;

export const publicClient = createPublicClient({
  chain: monadTestnet,
  transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz", {
    retryCount: 3,
    retryDelay: 2000,
  }),
});

export async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

export const vaultAbi = [
  {
    inputs: [
      { name: "_worldId", type: "address" },
      { name: "_nftContract", type: "address" },
      { name: "_groupId", type: "uint256" },
      { name: "_externalNullifierHash", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: false, name: "timestamp", type: "uint256" },
    ],
    name: "ActivityConfirmed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [{ indexed: true, name: "id", type: "uint256" }],
    name: "EvidenceDisclosed",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "owner", type: "address" },
      { indexed: false, name: "title", type: "string" },
    ],
    name: "EvidenceRegistered",
    type: "event",
  },
  { name: "externalNullifierHash", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { name: "getFileCount", inputs: [{ name: "recordId", type: "uint256" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { name: "groupId", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { name: "nftContract", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { name: "recordCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  {
    inputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }],
    name: "recordFileHashes",
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }, { name: "", type: "uint256" }],
    name: "recordIpfsCIDs",
    outputs: [{ name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "", type: "uint256" }],
    name: "records",
    outputs: [
      { name: "timestamp", type: "uint256" },
      { name: "owner", type: "address" },
      { name: "metadataURI", type: "string" },
      { name: "zkVerified", type: "bool" },
      { name: "lastActiveAt", type: "uint256" },
      { name: "inactivityPeriod", type: "uint256" },
      { name: "isPublic", type: "bool" },
      { name: "nftTokenId", type: "uint256" },
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "isImmediate", type: "bool" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "fileHashes", type: "bytes32[]" },
      { name: "ipfsCIDs", type: "string[]" },
      { name: "metadataURI", type: "string" },
      { name: "inactivityPeriod", type: "uint256" },
      { name: "zkRoot", type: "uint256" },
      { name: "nullifierHash", type: "uint256" },
      { name: "zkProof", type: "uint256[8]" },
      { name: "title", type: "string" },
      { name: "description", type: "string" },
      { name: "isImmediate", type: "bool" },
    ],
    name: "registerEvidence",
    outputs: [{ name: "recordId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "recordId", type: "uint256" }],
    name: "checkAndTrigger",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "recordId", type: "uint256" }],
    name: "confirmActivity",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [{ name: "", type: "address" }], name: "uploadCount", outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "", type: "uint256" }], name: "usedNullifiers", outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { name: "worldId", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
] as const;

export const nftAbi = [
  { inputs: [], stateMutability: "nonpayable", type: "constructor" },
  { name: "approve", inputs: [{ name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "balanceOf", inputs: [{ name: "owner", type: "address" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "view", type: "function" },
  { name: "getApproved", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { name: "isApprovedForAll", inputs: [{ name: "owner", type: "address" }, { name: "operator", type: "address" }], outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { name: "mint", inputs: [{ name: "to", type: "address" }, { name: "tokenURI_", type: "string" }], outputs: [{ name: "", type: "uint256" }], stateMutability: "nonpayable", type: "function" },
  { name: "name", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { name: "owner", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { name: "ownerOf", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
  { name: "renounceOwnership", outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "safeTransferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "setApprovalForAll", inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "setVaultAddress", inputs: [{ name: "_vault", type: "address" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "supportsInterface", inputs: [{ name: "interfaceId", type: "bytes4" }], outputs: [{ name: "", type: "bool" }], stateMutability: "view", type: "function" },
  { name: "symbol", outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { name: "tokenURI", inputs: [{ name: "tokenId", type: "uint256" }], outputs: [{ name: "", type: "string" }], stateMutability: "view", type: "function" },
  { name: "transferFrom", inputs: [{ name: "from", type: "address" }, { name: "to", type: "address" }, { name: "tokenId", type: "uint256" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "transferOwnership", inputs: [{ name: "newOwner", type: "address" }], outputs: [], stateMutability: "nonpayable", type: "function" },
  { name: "vaultAddress", outputs: [{ name: "", type: "address" }], stateMutability: "view", type: "function" },
] as const;

export async function registerEvidence(params: {
  fileHashes: `0x${string}`[];
  ipfsCIDs: string[];
  metadataURI: string;
  inactivityPeriod: bigint;
  zkRoot: bigint;
  nullifierHash: bigint;
  zkProof: readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
  title: string;
  description: string;
  isImmediate: boolean;
}) {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("No wallet");
  const walletClient = createWalletClient({ chain: monadTestnet, transport: custom(window.ethereum) });
  const [account] = await walletClient.getAddresses();

  return walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "registerEvidence",
    args: [
      params.fileHashes,
      params.ipfsCIDs,
      params.metadataURI,
      params.inactivityPeriod,
      params.zkRoot,
      params.nullifierHash,
      params.zkProof,
      params.title,
      params.description,
      params.isImmediate,
    ],
    account,
  });
}

export async function confirmActivity(recordId: bigint) {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("No wallet");
  const walletClient = createWalletClient({ chain: monadTestnet, transport: custom(window.ethereum) });
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "confirmActivity",
    args: [recordId],
    account,
  });
}

export async function checkAndTrigger(recordId: bigint) {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("No wallet");
  const walletClient = createWalletClient({ chain: monadTestnet, transport: custom(window.ethereum) });
  const [account] = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: VAULT_ADDRESS,
    abi: vaultAbi,
    functionName: "checkAndTrigger",
    args: [recordId],
    account,
  });
}
