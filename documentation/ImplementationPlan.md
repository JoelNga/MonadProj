# TruthVault — Implementation Document
**Version:** 1.0 (MVP)
**Last Updated:** May 2026
**Audience:** AI Developer Agent

---

## How to Read This Document

Each phase is a self-contained unit of work. Each step inside a phase is a single, small task. Every step ends with a **Validation** block — do not move to the next step until the validation passes.

Work strictly in order. Do not skip ahead. Do not combine steps.

---

## Phase Overview

| Phase | Area | Steps |
|---|---|---|
| 0 | Repository & Environment Setup | 0.1 – 0.6 |
| 1 | Smart Contracts — EvidenceNFT | 1.1 – 1.6 |
| 2 | Smart Contracts — EvidenceVault | 2.1 – 2.8 |
| 3 | Contract Deployment Scripts | 3.1 – 3.4 |
| 4 | Frontend Scaffold | 4.1 – 4.5 |
| 5 | Lib — Encryption | 5.1 – 5.4 |
| 6 | Lib — Hashing | 6.1 – 6.2 |
| 7 | Lib — IPFS | 7.1 – 7.3 |
| 8 | Lib — Contract Bindings | 8.1 – 8.3 |
| 9 | Lib — Zustand Store | 9.1 – 9.3 |
| 10 | Component — WalletConnector | 10.1 – 10.4 |
| 11 | Component — ZKVerifier | 11.1 – 11.5 |
| 12 | Component — EvidenceUploader | 12.1 – 12.7 |
| 13 | Component — InactivityTimer | 13.1 – 13.4 |
| 14 | Component — SuccessConfirmation | 14.1 – 14.3 |
| 15 | Component — ActivityReminder | 15.1 – 15.3 |
| 16 | Page — Main Upload Flow | 16.1 – 16.4 |
| 17 | Page — Evidence Dashboard | 17.1 – 17.4 |
| 18 | End-to-End Validation | 18.1 – 18.5 |

---

## Phase 0 — Repository & Environment Setup

### Step 0.1 — Create the monorepo structure

Create a root directory called `truthvault`. Inside it, create two subdirectories: `contracts` and `frontend`.

```
truthvault/
├── contracts/
└── frontend/
```

**Validation:** Run `ls truthvault/`. Output must show both `contracts` and `frontend`.

---

### Step 0.2 — Initialise the contracts package

Inside `truthvault/contracts`, run:

```bash
pnpm init
pnpm add --save-dev hardhat @nomicfoundation/hardhat-toolbox solhint dotenv
npx hardhat init
```

When Hardhat prompts, choose **"Create a TypeScript project"**. Accept all defaults.

**Validation:** A `hardhat.config.ts` file exists inside `truthvault/contracts`. Running `npx hardhat compile` produces no errors (the sample contract compiles cleanly).

---

### Step 0.3 — Initialise the frontend package

Inside `truthvault/frontend`, run:

```bash
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Validation:** Running `pnpm dev` inside `truthvault/frontend` starts the dev server on `localhost:3000` without errors. The default Next.js page loads in the browser.

---

### Step 0.4 — Install frontend dependencies

Inside `truthvault/frontend`, run:

```bash
pnpm add wagmi viem @rainbow-me/rainbowkit zustand @worldcoin/idkit
pnpm add --save-dev @types/node
```

**Validation:** `pnpm dev` still starts without errors after installation. No TypeScript errors on a clean build (`pnpm build` completes).

---

### Step 0.5 — Install OpenZeppelin contracts

Inside `truthvault/contracts`, run:

```bash
pnpm add @openzeppelin/contracts
```

**Validation:** The directory `truthvault/contracts/node_modules/@openzeppelin/contracts/token/ERC721` exists.

---

### Step 0.6 — Create environment variable files

In `truthvault/contracts`, create `.env` with these keys (leave values empty for now):

```
MONAD_RPC_URL=
DEPLOYER_PRIVATE_KEY=
WORLD_ID_VERIFIER_ADDRESS=
```

In `truthvault/frontend`, create `.env.local` with these keys:

```
NEXT_PUBLIC_EVIDENCE_VAULT_ADDRESS=
NEXT_PUBLIC_EVIDENCE_NFT_ADDRESS=
NEXT_PUBLIC_MONAD_RPC_URL=
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_WORLD_ID_APP_ID=
NEXT_PUBLIC_WORLD_ID_ACTION=
```

Add both `.env` and `.env.local` to `.gitignore`.

**Validation:** Running `git status` does not show `.env` or `.env.local` as tracked files.

---

## Phase 1 — Smart Contracts: EvidenceNFT

### Step 1.1 — Create the EvidenceNFT contract file

Inside `truthvault/contracts/contracts`, create `EvidenceNFT.sol`. Delete the sample `Lock.sol` file.

**Validation:** Only `EvidenceNFT.sol` exists in the `contracts/` directory.

---

### Step 1.2 — Write the EvidenceNFT contract header and imports

In `EvidenceNFT.sol`, write the SPDX identifier, pragma, and imports:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 1.3 — Write the EvidenceNFT contract body

Add the contract definition, state variables, constructor, and the `onlyVault` modifier:

```solidity
contract EvidenceNFT is ERC721, ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    address public vaultAddress;

    modifier onlyVault() {
        require(msg.sender == vaultAddress, "EvidenceNFT: caller is not the vault");
        _;
    }

    constructor(address initialOwner)
        ERC721("TruthVault Evidence", "TVE")
        Ownable(initialOwner)
    {}

    function setVaultAddress(address _vault) external onlyOwner {
        vaultAddress = _vault;
    }
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 1.4 — Add the mint function to EvidenceNFT

Inside the contract, add:

```solidity
function mint(address to, string calldata tokenURI_) external onlyVault returns (uint256) {
    uint256 tokenId = _tokenIdCounter;
    _tokenIdCounter++;
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, tokenURI_);
    return tokenId;
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 1.5 — Override required ERC721 functions

Add the required overrides to resolve multiple inheritance:

```solidity
function tokenURI(uint256 tokenId)
    public view override(ERC721, ERC721URIStorage) returns (string memory)
{
    return super.tokenURI(tokenId);
}

function supportsInterface(bytes4 interfaceId)
    public view override(ERC721, ERC721URIStorage) returns (bool)
{
    return super.supportsInterface(interfaceId);
}
```

**Validation:** `npx hardhat compile` produces no errors and no warnings about overrides.

---

### Step 1.6 — Write the EvidenceNFT test file

In `truthvault/contracts/test`, create `EvidenceNFT.test.ts`. Write tests that verify:

- Contract deploys with the correct name (`"TruthVault Evidence"`) and symbol (`"TVE"`).
- `mint` reverts when called by an address that is not the vault.
- `setVaultAddress` sets the vault address correctly.
- After setting vault, `mint` succeeds and returns `tokenId = 0` for the first mint.
- `tokenURI(0)` returns the URI passed to `mint`.

**Validation:** `npx hardhat test test/EvidenceNFT.test.ts` passes all tests with 0 failures.

---

## Phase 2 — Smart Contracts: EvidenceVault

### Step 2.1 — Create the EvidenceVault contract file and imports

Create `truthvault/contracts/contracts/EvidenceVault.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./EvidenceNFT.sol";
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 2.2 — Define the IWorldID interface

At the top of `EvidenceVault.sol`, before the contract body, add the interface:

```solidity
interface IWorldID {
    function verifyProof(
        uint256 root,
        uint256 groupId,
        uint256 signalHash,
        uint256 nullifierHash,
        uint256 externalNullifierHash,
        uint256[8] calldata proof
    ) external view;
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 2.3 — Define the EvidenceRecord struct and contract state

Inside the `EvidenceVault` contract:

```solidity
contract EvidenceVault {
    struct EvidenceRecord {
        bytes32  fileHash;
        string   ipfsCID;
        uint256  timestamp;
        address  owner;
        string   metadataURI;
        bool     zkVerified;
        uint256  lastActiveAt;
        uint256  inactivityPeriod;
        bool     isPublic;
        uint256  nftTokenId;
    }

    uint256 public constant MIN_INACTIVITY = 7 days;
    uint256 public constant MAX_INACTIVITY = 730 days;
    uint256 public constant MAX_UPLOADS     = 10;

    mapping(uint256 => EvidenceRecord) public records;
    mapping(uint256 => bool)           public usedNullifiers;
    mapping(address => uint256)        public uploadCount;

    uint256     public recordCount;
    IWorldID    public worldId;
    EvidenceNFT public nftContract;
    uint256     public groupId;
    uint256     public externalNullifierHash;
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 2.4 — Add the constructor and events

```solidity
event EvidenceRegistered(uint256 indexed id, address indexed owner, string cid);
event ActivityConfirmed(uint256 indexed id, uint256 timestamp);
event EvidenceDisclosed(uint256 indexed id);

constructor(
    address _worldId,
    address _nftContract,
    uint256 _groupId,
    uint256 _externalNullifierHash
) {
    worldId              = IWorldID(_worldId);
    nftContract          = EvidenceNFT(_nftContract);
    groupId              = _groupId;
    externalNullifierHash = _externalNullifierHash;
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 2.5 — Implement registerEvidence

Add the core registration function. It must: validate the inactivity period bounds, reject used nullifiers, enforce the upload quota, call the World ID verifier, mark the nullifier as used, increment the upload count, build the record, mint the NFT, emit `EvidenceRegistered`, and return the record ID.

```solidity
function registerEvidence(
    bytes32          fileHash,
    string calldata  ipfsCID,
    string calldata  metadataURI,
    uint256          inactivityPeriod,
    uint256          zkRoot,
    uint256          nullifierHash,
    uint256[8] calldata zkProof
) external returns (uint256 recordId) {
    require(inactivityPeriod >= MIN_INACTIVITY, "EvidenceVault: inactivity period too short");
    require(inactivityPeriod <= MAX_INACTIVITY, "EvidenceVault: inactivity period too long");
    require(!usedNullifiers[nullifierHash],     "EvidenceVault: nullifier already used");
    require(uploadCount[msg.sender] < MAX_UPLOADS, "EvidenceVault: upload quota exceeded");

    worldId.verifyProof(
        zkRoot,
        groupId,
        uint256(keccak256(abi.encodePacked(msg.sender))),
        nullifierHash,
        externalNullifierHash,
        zkProof
    );

    usedNullifiers[nullifierHash]  = true;
    uploadCount[msg.sender]       += 1;

    recordId = recordCount++;

    uint256 tokenId = nftContract.mint(msg.sender, metadataURI);

    records[recordId] = EvidenceRecord({
        fileHash:         fileHash,
        ipfsCID:          ipfsCID,
        timestamp:        block.timestamp,
        owner:            msg.sender,
        metadataURI:      metadataURI,
        zkVerified:       true,
        lastActiveAt:     block.timestamp,
        inactivityPeriod: inactivityPeriod,
        isPublic:         false,
        nftTokenId:       tokenId
    });

    emit EvidenceRegistered(recordId, msg.sender, ipfsCID);
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 2.6 — Implement confirmActivity

```solidity
function confirmActivity(uint256 recordId) external {
    EvidenceRecord storage rec = records[recordId];
    require(rec.owner == msg.sender, "EvidenceVault: not the owner");
    require(!rec.isPublic,           "EvidenceVault: already disclosed");

    rec.lastActiveAt = block.timestamp;
    emit ActivityConfirmed(recordId, block.timestamp);
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 2.7 — Implement checkAndTrigger

```solidity
function checkAndTrigger(uint256 recordId) external {
    EvidenceRecord storage rec = records[recordId];
    if (rec.isPublic) return; // idempotent

    require(
        block.timestamp > rec.lastActiveAt + rec.inactivityPeriod,
        "EvidenceVault: inactivity period not elapsed"
    );

    rec.isPublic = true;
    emit EvidenceDisclosed(recordId);
}
```

**Validation:** `npx hardhat compile` produces no errors.

---

### Step 2.8 — Write the EvidenceVault test file

Create `truthvault/contracts/test/EvidenceVault.test.ts`. Use a mock `IWorldID` contract that always accepts proofs (to isolate contract logic from the real ZK verifier). Tests must cover:

- `registerEvidence` succeeds with valid inputs and emits `EvidenceRegistered`.
- `registerEvidence` reverts with a duplicate `nullifierHash`.
- `registerEvidence` reverts when upload quota is exceeded (call it `MAX_UPLOADS + 1` times with unique nullifiers).
- `registerEvidence` reverts when `inactivityPeriod < MIN_INACTIVITY`.
- `registerEvidence` reverts when `inactivityPeriod > MAX_INACTIVITY`.
- `confirmActivity` reverts when called by a non-owner.
- `confirmActivity` updates `lastActiveAt`.
- `checkAndTrigger` reverts before the inactivity period has elapsed.
- `checkAndTrigger` sets `isPublic = true` after the inactivity period (use `time.increase` from Hardhat helpers).
- `checkAndTrigger` called twice on a disclosed record is a no-op (does not revert).

**Validation:** `npx hardhat test test/EvidenceVault.test.ts` passes all tests with 0 failures.

---

## Phase 3 — Contract Deployment Scripts

### Step 3.1 — Configure hardhat.config.ts for Monad

Update `hardhat.config.ts` to add the Monad testnet network:

```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    monadTestnet: {
      url:      process.env.MONAD_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};

export default config;
```

**Validation:** `npx hardhat compile` still passes. `npx hardhat run --network monadTestnet` fails gracefully with a network error if `MONAD_RPC_URL` is empty (not a compile error).

---

### Step 3.2 — Write the deployment script

Create `truthvault/contracts/scripts/deploy.ts`:

```typescript
import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  // Deploy EvidenceNFT
  const NFT = await ethers.getContractFactory("EvidenceNFT");
  const nft = await NFT.deploy(deployer.address);
  await nft.waitForDeployment();
  console.log("EvidenceNFT deployed to:", await nft.getAddress());

  // Deploy EvidenceVault
  const worldIdAddress          = process.env.WORLD_ID_VERIFIER_ADDRESS!;
  const groupId                 = 1;
  const externalNullifierHash   = ethers.keccak256(ethers.toUtf8Bytes("app_truthvault_upload"));

  const Vault = await ethers.getContractFactory("EvidenceVault");
  const vault = await Vault.deploy(
    worldIdAddress,
    await nft.getAddress(),
    groupId,
    externalNullifierHash
  );
  await vault.waitForDeployment();
  console.log("EvidenceVault deployed to:", await vault.getAddress());

  // Set vault address on NFT
  await nft.setVaultAddress(await vault.getAddress());
  console.log("Vault address set on EvidenceNFT.");
}

main().catch((e) => { console.error(e); process.exit(1); });
```

**Validation:** Running `npx hardhat run scripts/deploy.ts` against a local Hardhat node (`npx hardhat node` in a separate terminal) completes without errors and prints three log lines.

---

### Step 3.3 — Write a post-deploy address capture script

After deployment, the contract addresses must be stored. Update `deploy.ts` to write a `deployments.json` file to the repo root:

```typescript
import fs from "fs";

// At the end of main(), after both contracts are deployed:
const deployments = {
  EvidenceNFT:   await nft.getAddress(),
  EvidenceVault: await vault.getAddress(),
};
fs.writeFileSync("deployments.json", JSON.stringify(deployments, null, 2));
console.log("Addresses written to deployments.json");
```

**Validation:** After running the deploy script locally, `deployments.json` exists in `truthvault/contracts` and contains valid Ethereum addresses for both contracts.

---

### Step 3.4 — Run the full contract test suite

Run all contract tests together:

```bash
npx hardhat test
```

**Validation:** All tests in both `EvidenceNFT.test.ts` and `EvidenceVault.test.ts` pass. Coverage output shows the `registerEvidence`, `confirmActivity`, and `checkAndTrigger` functions are fully covered.

---

## Phase 4 — Frontend Scaffold

### Step 4.1 — Create the wagmi and RainbowKit config file

Create `truthvault/frontend/src/lib/wagmi.ts`:

```typescript
import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id:   10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL!] },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName:   "TruthVault",
  projectId: "truthvault-mvp",
  chains:    [monadTestnet],
  ssr:       true,
});
```

**Validation:** No TypeScript errors in this file (`pnpm tsc --noEmit` passes).

---

### Step 4.2 — Create the root providers wrapper

Create `truthvault/frontend/src/components/Providers.tsx`:

```tsx
"use client";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "@/lib/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
```

Note: `@tanstack/react-query` is a peer dependency of wagmi. Install it:

```bash
pnpm add @tanstack/react-query
```

**Validation:** `pnpm build` completes without errors.

---

### Step 4.3 — Wrap the root layout with Providers

In `truthvault/frontend/src/app/layout.tsx`, import and wrap `{children}` with `<Providers>`:

```tsx
import { Providers } from "@/components/Providers";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

**Validation:** `pnpm dev` starts without errors. The browser console shows no RainbowKit or wagmi errors.

---

### Step 4.4 — Create the component directory structure

Create the following empty directories under `truthvault/frontend/src/`:

```
components/
  WalletConnector/
  ZKVerifier/
  EvidenceUploader/
  InactivityTimer/
  SuccessConfirmation/
  ActivityReminder/
lib/
  (already exists from wagmi.ts)
store/
```

**Validation:** `ls src/components` shows all six component directories.

---

### Step 4.5 — Confirm Tailwind is working

Replace the contents of `truthvault/frontend/src/app/page.tsx` with:

```tsx
export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
      <h1 className="text-3xl font-bold">TruthVault</h1>
    </main>
  );
}
```

**Validation:** `pnpm dev` renders a dark page with "TruthVault" centered in white bold text. No console errors.

---

## Phase 5 — Lib: Encryption

### Step 5.1 — Create the encryption module file

Create `truthvault/frontend/src/lib/encryption.ts` with an empty export object to start.

**Validation:** `pnpm tsc --noEmit` shows no errors referencing this file.

---

### Step 5.2 — Implement generateEncryptionKey

In `encryption.ts`, add:

```typescript
export async function generateEncryptionKey(): Promise<{ cryptoKey: CryptoKey; hexKey: string }> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const cryptoKey = await crypto.subtle.importKey(
    "raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]
  );
  const hexKey = Array.from(raw).map(b => b.toString(16).padStart(2, "0")).join("");
  return { cryptoKey, hexKey };
}
```

**Validation:** In the browser console (with `pnpm dev` running), import and call `generateEncryptionKey()`. It must return an object with a `CryptoKey` and a 64-character hex string.

---

### Step 5.3 — Implement encryptFile

In `encryption.ts`, add:

```typescript
export async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
  const iv         = crypto.getRandomValues(new Uint8Array(12));
  const plaintext  = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  const result = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.byteLength);
  return new Blob([result], { type: "application/octet-stream" });
}
```

**Validation:** Create a small test: encrypt a `File` containing the text `"hello"`. The resulting blob must have a byte length greater than 5 (ciphertext is larger than plaintext) and must NOT contain the string `"hello"` as plaintext when read as text.

---

### Step 5.4 — Implement decryptFile (for user recovery)

In `encryption.ts`, add:

```typescript
export async function decryptFile(encryptedBlob: Blob, hexKey: string): Promise<ArrayBuffer> {
  const raw = new Uint8Array(hexKey.match(/.{2}/g)!.map(h => parseInt(h, 16)));
  const key = await crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);

  const buffer     = await encryptedBlob.arrayBuffer();
  const iv         = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);

  return crypto.subtle.decrypt({ name: "AES-GCM", iv: new Uint8Array(iv) }, key, ciphertext);
}
```

**Validation:** Using the same `File` and key from Step 5.3: encrypt the file, then decrypt the blob using `decryptFile`. The resulting `ArrayBuffer` must decode to the original plaintext `"hello"`.

---

## Phase 6 — Lib: Hashing

### Step 6.1 — Create the hash module

Create `truthvault/frontend/src/lib/hash.ts`:

```typescript
export async function hashFile(file: File): Promise<`0x${string}`> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const hex    = Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return `0x${hex}`;
}
```

**Validation:** Hash the string `"hello"` (as a File). The output must equal `0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824` — the known SHA-256 of `"hello"`.

---

### Step 6.2 — Confirm the return type is viem-compatible

The return type `0x${string}` is the hex type expected by viem's contract call parameters for `bytes32`. Confirm this by importing `hashFile` in a temporary TypeScript file and assigning the result to a `Hex` type from viem without a type error.

**Validation:** `pnpm tsc --noEmit` produces no type errors.

---

## Phase 7 — Lib: IPFS

### Step 7.1 — Create the IPFS module

Create `truthvault/frontend/src/lib/ipfs.ts`. Define the interface and implement using Pinata's REST API:

```typescript
const PINATA_JWT = process.env.NEXT_PUBLIC_PINATA_JWT!;
const GATEWAY    = "https://gateway.pinata.cloud/ipfs";

export async function uploadToIPFS(blob: Blob, filename = "evidence"): Promise<string> {
  const form = new FormData();
  form.append("file", blob, filename);

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method:  "POST",
    headers: { Authorization: `Bearer ${PINATA_JWT}` },
    body:    form,
  });

  if (!res.ok) throw new Error(`IPFS upload failed: ${res.statusText}`);

  const data = await res.json();
  return data.IpfsHash as string;
}

export function ipfsGatewayUrl(cid: string): string {
  return `${GATEWAY}/${cid}`;
}
```

**Validation:** With a valid Pinata JWT in `.env.local`, call `uploadToIPFS` with a small test blob. The function must return a string starting with `"Qm"` or `"bafy"` (valid IPFS CID formats). Verify the file is accessible via `ipfsGatewayUrl(cid)` in the browser.

---

### Step 7.2 — Add retry logic

Wrap the `fetch` call in a retry loop with exponential backoff (max 3 attempts, delays of 1s, 2s, 4s):

```typescript
async function fetchWithRetry(url: string, options: RequestInit, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(url, options);
    if (res.ok) return res;
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  throw new Error("IPFS upload failed after 3 attempts");
}
```

Replace the raw `fetch` in `uploadToIPFS` with `fetchWithRetry`.

**Validation:** Temporarily pass an invalid JWT. Confirm the function throws after exactly 3 attempts (you can log each attempt). Restore the valid JWT afterwards.

---

### Step 7.3 — Implement uploadJSON for NFT metadata

Add a function to upload a JSON object to IPFS (used for NFT metadata):

```typescript
export async function uploadJSONToIPFS(obj: object): Promise<string> {
  const blob = new Blob([JSON.stringify(obj)], { type: "application/json" });
  return uploadToIPFS(blob, "metadata.json");
}
```

**Validation:** Call `uploadJSONToIPFS({ test: true })`. Fetching the returned CID via the gateway must return `{"test":true}`.

---

## Phase 8 — Lib: Contract Bindings

### Step 8.1 — Copy the contract ABIs to the frontend

After compiling the contracts (`npx hardhat compile`), copy the generated ABI files:

- `contracts/artifacts/contracts/EvidenceVault.sol/EvidenceVault.json` → `frontend/src/lib/abis/EvidenceVault.json`
- `contracts/artifacts/contracts/EvidenceNFT.sol/EvidenceNFT.json` → `frontend/src/lib/abis/EvidenceNFT.json`

**Validation:** Both JSON files exist under `frontend/src/lib/abis/`. Each file has a non-empty `abi` array.

---

### Step 8.2 — Create the contracts lib

Create `truthvault/frontend/src/lib/contracts.ts`:

```typescript
import { createPublicClient, createWalletClient, custom, http } from "viem";
import { monadTestnet } from "@/lib/wagmi";
import EvidenceVaultABI from "@/lib/abis/EvidenceVault.json";
import EvidenceNFTABI   from "@/lib/abis/EvidenceNFT.json";

export const VAULT_ADDRESS = process.env.NEXT_PUBLIC_EVIDENCE_VAULT_ADDRESS as `0x${string}`;
export const NFT_ADDRESS   = process.env.NEXT_PUBLIC_EVIDENCE_NFT_ADDRESS   as `0x${string}`;

export const publicClient = createPublicClient({
  chain:     monadTestnet,
  transport: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL),
});

export const vaultAbi = EvidenceVaultABI.abi;
export const nftAbi   = EvidenceNFTABI.abi;
```

**Validation:** `pnpm tsc --noEmit` produces no errors.

---

### Step 8.3 — Implement the registerEvidence call helper

In `contracts.ts`, add:

```typescript
export async function registerEvidence(params: {
  fileHash:         `0x${string}`;
  ipfsCID:          string;
  metadataURI:      string;
  inactivityPeriod: bigint;
  zkRoot:           bigint;
  nullifierHash:    bigint;
  zkProof:          readonly [bigint, bigint, bigint, bigint, bigint, bigint, bigint, bigint];
}) {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("No wallet");
  const walletClient = createWalletClient({ chain: monadTestnet, transport: custom(window.ethereum) });
  const [account]    = await walletClient.getAddresses();

  return walletClient.writeContract({
    address:      VAULT_ADDRESS,
    abi:          vaultAbi,
    functionName: "registerEvidence",
    args: [
      params.fileHash,
      params.ipfsCID,
      params.metadataURI,
      params.inactivityPeriod,
      params.zkRoot,
      params.nullifierHash,
      params.zkProof,
    ],
    account,
  });
}

export async function confirmActivity(recordId: bigint) {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("No wallet");
  const walletClient = createWalletClient({ chain: monadTestnet, transport: custom(window.ethereum) });
  const [account]    = await walletClient.getAddresses();
  return walletClient.writeContract({
    address: VAULT_ADDRESS, abi: vaultAbi, functionName: "confirmActivity", args: [recordId], account,
  });
}
```

**Validation:** `pnpm tsc --noEmit` produces no TypeScript errors. No `any` types used.

---

## Phase 9 — Lib: Zustand Store

### Step 9.1 — Create the store file

Create `truthvault/frontend/src/store/useAppStore.ts`:

```typescript
import { create } from "zustand";

interface UploadState {
  file:             File | null;
  encryptionKey:    string | null;
  ipfsCID:          string | null;
  fileHash:         `0x${string}` | null;
  txHash:           string | null;
  nftTokenId:       bigint | null;
  inactivityPeriod: number;            // seconds
  zkProof:          object | null;
}

interface AppStore extends UploadState {
  setFile:             (file: File | null) => void;
  setEncryptionKey:    (key: string | null) => void;
  setIPFSCID:          (cid: string | null) => void;
  setFileHash:         (hash: `0x${string}` | null) => void;
  setTxHash:           (hash: string | null) => void;
  setNFTTokenId:       (id: bigint | null) => void;
  setInactivityPeriod: (seconds: number) => void;
  setZKProof:          (proof: object | null) => void;
  reset:               () => void;
}

const initial: UploadState = {
  file:             null,
  encryptionKey:    null,
  ipfsCID:          null,
  fileHash:         null,
  txHash:           null,
  nftTokenId:       null,
  inactivityPeriod: 7776000, // 90 days default
  zkProof:          null,
};

export const useAppStore = create<AppStore>(set => ({
  ...initial,
  setFile:             file             => set({ file }),
  setEncryptionKey:    encryptionKey    => set({ encryptionKey }),
  setIPFSCID:          ipfsCID          => set({ ipfsCID }),
  setFileHash:         fileHash         => set({ fileHash }),
  setTxHash:           txHash           => set({ txHash }),
  setNFTTokenId:       nftTokenId       => set({ nftTokenId }),
  setInactivityPeriod: inactivityPeriod => set({ inactivityPeriod }),
  setZKProof:          zkProof          => set({ zkProof }),
  reset:               ()               => set(initial),
}));
```

**Validation:** `pnpm tsc --noEmit` produces no errors. Import `useAppStore` in a temporary component, call `useAppStore.getState().reset()`, and confirm no runtime errors.

---

### Step 9.2 — Add an evidence records list to the store

Append to the store a `records` array (for the dashboard) and a setter:

```typescript
records:    [] as EvidenceRecord[],
setRecords: (records: EvidenceRecord[]) => set({ records }),
```

Define `EvidenceRecord` as a TypeScript type matching the on-chain struct (all fields, using `bigint` for `uint256`, `boolean` for `bool`, `string` for strings).

**Validation:** `pnpm tsc --noEmit` passes. The `EvidenceRecord` type is exported from the store file.

---

### Step 9.3 — Test the store in isolation

Write a Jest or Vitest unit test (if configured) in `frontend/src/store/useAppStore.test.ts` that:

- Calls `setFile` with a mock `File` and reads it back.
- Calls `reset` and confirms all fields return to `initial`.

**Validation:** Tests pass. If Vitest is not configured, add it now (`pnpm add --save-dev vitest @vitejs/plugin-react`) and run `pnpm vitest run`.

---

## Phase 10 — Component: WalletConnector

### Step 10.1 — Create the WalletConnector component file

Create `truthvault/frontend/src/components/WalletConnector/index.tsx`. The component renders a RainbowKit `ConnectButton`. No custom logic in this step.

```tsx
"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function WalletConnector() {
  return <ConnectButton />;
}
```

**Validation:** Import `WalletConnector` into `page.tsx` and render it. The connect button appears in the browser. Clicking it opens the wallet selection modal.

---

### Step 10.2 — Add connection state feedback

Import `useAccount` from wagmi. If connected, display the truncated address below the button:

```tsx
const { address, isConnected } = useAccount();
```

Show `{address?.slice(0,6)}...{address?.slice(-4)}` when connected.

**Validation:** After connecting MetaMask, the component displays the truncated address.

---

### Step 10.3 — Gate downstream steps on wallet connection

Export a `useIsConnected` hook from this file:

```typescript
export function useIsConnected() {
  const { isConnected } = useAccount();
  return isConnected;
}
```

**Validation:** `useIsConnected()` returns `false` before connecting and `true` after connecting MetaMask.

---

### Step 10.4 — Write a smoke test

Create `WalletConnector/WalletConnector.test.tsx`. Render the component inside a test wrapper that includes `Providers`. Assert the `ConnectButton` renders without throwing.

**Validation:** Test passes with `pnpm vitest run`.

---

## Phase 11 — Component: ZKVerifier

### Step 11.1 — Create the ZKVerifier component file

Create `truthvault/frontend/src/components/ZKVerifier/index.tsx`. The component accepts an `onSuccess` callback:

```tsx
"use client";
import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";

interface Props {
  onSuccess: (proof: ISuccessResult) => void;
}

export function ZKVerifier({ onSuccess }: Props) {
  return (
    <IDKitWidget
      app_id={process.env.NEXT_PUBLIC_WORLD_ID_APP_ID as `app_${string}`}
      action={process.env.NEXT_PUBLIC_WORLD_ID_ACTION!}
      verification_level={VerificationLevel.Device}
      onSuccess={onSuccess}
    >
      {({ open }) => (
        <button onClick={open} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
          Verify Identity
        </button>
      )}
    </IDKitWidget>
  );
}
```

**Validation:** `pnpm tsc --noEmit` passes. The "Verify Identity" button renders in the browser.

---

### Step 11.2 — Store the proof in Zustand on success

In the parent that renders `ZKVerifier`, pass a callback that calls `useAppStore.getState().setZKProof(proof)`. Confirm the proof object is stored in state after a successful World ID verification.

**Validation:** After completing World ID verification in the browser, `useAppStore.getState().zkProof` is not null.

---

### Step 11.3 — Display verification status

Add a `verified` prop or derive it from the store. Show a green checkmark badge when `zkProof !== null`, and a grey pending indicator otherwise.

**Validation:** The UI shows a pending state before verification and a green checkmark after.

---

### Step 11.4 — Block re-verification once verified

If `zkProof` is already set, render a static "Verified ✓" badge instead of the IDKit button.

**Validation:** After verifying once, the button is no longer rendered. Refreshing the page (which resets the store) brings the button back.

---

### Step 11.5 — Write a smoke test

Create `ZKVerifier/ZKVerifier.test.tsx`. Mock `@worldcoin/idkit`. Render the component and assert the "Verify Identity" button exists when `zkProof` is null, and the "Verified ✓" badge exists when a mock proof is pre-set in the store.

**Validation:** Tests pass.

---

## Phase 12 — Component: EvidenceUploader

### Step 12.1 — Create the EvidenceUploader component file

Create `truthvault/frontend/src/components/EvidenceUploader/index.tsx`. Render a file input that accepts the allowed MIME types:

```
image/*, video/*, audio/*, application/pdf, text/plain
```

**Validation:** The file picker appears in the browser. It accepts the correct types and rejects others.

---

### Step 12.2 — Implement file validation

On file selection, validate:

- File size ≤ 100MB (`file.size <= 104_857_600`).
- File type is in the allowed list.

Show an error message inline if either check fails. Do not proceed.

**Validation:** Selecting a file >100MB shows the error. Selecting an invalid type (e.g., `.exe`) shows the error.

---

### Step 12.3 — Store the selected file in Zustand

On valid file selection, call `useAppStore.getState().setFile(file)`.

**Validation:** After selecting a valid file, `useAppStore.getState().file` is not null and has the correct name.

---

### Step 12.4 — Implement the encrypt-and-hash step

Add an "Encrypt" button. When clicked:

1. Call `generateEncryptionKey()` → store `hexKey` in Zustand.
2. Call `encryptFile(file, cryptoKey)` → store the encrypted blob in local state.
3. Call `hashFile(file)` → store the hash in Zustand.
4. Display the hex key with a copy button and a warning: "Save this key. It cannot be recovered."

**Validation:** After clicking "Encrypt", the hex key is displayed (64 characters). The encrypted blob is in local component state. `useAppStore.getState().fileHash` is a 66-character hex string starting with `"0x"`.

---

### Step 12.5 — Implement the IPFS upload step

Add an "Upload to IPFS" button (disabled until encryption is complete). When clicked:

1. Show a spinner.
2. Call `uploadToIPFS(encryptedBlob)`.
3. Store the returned CID in Zustand via `setIPFSCID`.
4. Show the CID and an IPFS gateway link.

**Validation:** After clicking "Upload", a valid CID appears. The IPFS gateway link opens the encrypted blob (which is binary, not readable) in the browser.

---

### Step 12.6 — Implement the NFT metadata upload step

Before calling the contract, build and upload the NFT metadata JSON:

```typescript
const metadata = {
  name:        `TruthVault Evidence #pending`,
  description: "Tamper-proof evidence record.",
  attributes: [
    { trait_type: "File Hash",        value: fileHash },
    { trait_type: "IPFS CID",         value: ipfsCID },
    { trait_type: "Upload Timestamp", value: new Date().toISOString() },
    { trait_type: "ZK Verified",      value: "Yes" },
    { trait_type: "Disclosure Status",value: "Private" },
  ],
};
const metadataCID    = await uploadJSONToIPFS(metadata);
const metadataURI    = `ipfs://${metadataCID}`;
```

Store `metadataURI` in local state.

**Validation:** `metadataURI` is a string starting with `"ipfs://"` and the CID at the gateway returns valid JSON.

---

### Step 12.7 — Implement the on-chain registration call

Add a "Register on Blockchain" button (disabled until IPFS upload and metadata upload are complete). When clicked:

1. Build the `registerEvidence` params from the store and the ZK proof.
2. Call `registerEvidence(params)`.
3. Await the transaction hash.
4. Store `txHash` in Zustand.
5. Pass `txHash` and `recordId` (from the transaction receipt logs) to the `onSuccess` callback prop.

**Validation:** On a local Hardhat node (with the mock World ID verifier), the transaction succeeds. `txHash` is a 66-character hex string. The `EvidenceRegistered` event appears in the Hardhat node logs.

---

## Phase 13 — Component: InactivityTimer

### Step 13.1 — Create the InactivityTimer component

Create `truthvault/frontend/src/components/InactivityTimer/index.tsx`. Render a labeled slider or set of preset buttons for the user to choose their inactivity period:

Options: 30 days, 60 days, 90 days (default), 180 days, 1 year, 2 years.

Display the selected period in human-readable text below the control.

**Validation:** Selecting each option updates the displayed text correctly.

---

### Step 13.2 — Store the selected period in Zustand

On selection, convert the chosen period to seconds and call `setInactivityPeriod(seconds)`.

**Validation:** After selecting "180 days", `useAppStore.getState().inactivityPeriod` equals `15552000`.

---

### Step 13.3 — Show the disclosure deadline preview

Below the selector, show: "If you become inactive, your evidence will become public on approximately [date]."

Calculate the date as `new Date(Date.now() + inactivityPeriod * 1000)`.

**Validation:** Selecting "90 days" shows a date approximately 90 days from today.

---

### Step 13.4 — Enforce contract bounds in the UI

The slider/buttons must not allow values below 7 days or above 730 days (matching `MIN_INACTIVITY` and `MAX_INACTIVITY` in the contract).

**Validation:** No selectable option falls outside the 7–730 day range.

---

## Phase 14 — Component: SuccessConfirmation

### Step 14.1 — Create the SuccessConfirmation component

Create `truthvault/frontend/src/components/SuccessConfirmation/index.tsx`. Accept these props:

```typescript
interface Props {
  txHash:        string;
  ipfsCID:       string;
  encryptionKey: string;
  recordId:      string;
  nftTokenId:    string;
}
```

Render all values clearly. Each field has a copy-to-clipboard button.

**Validation:** All five values render. Clicking copy for `encryptionKey` places the hex string on the clipboard.

---

### Step 14.2 — Add the key-save confirmation gate

Render a checkbox: "I have saved my encryption key in a secure location." The "Done" button is disabled until the checkbox is checked.

**Validation:** The "Done" button is disabled until the checkbox is ticked.

---

### Step 14.3 — Call store reset on Done

When the user clicks "Done", call `useAppStore.getState().reset()` to clear the upload state.

**Validation:** After clicking "Done", `useAppStore.getState().file` is null.

---

## Phase 15 — Component: ActivityReminder

### Step 15.1 — Create the ActivityReminder component

Create `truthvault/frontend/src/components/ActivityReminder/index.tsx`. It reads `records` from the Zustand store and checks which records are within 7 days of their inactivity threshold:

```typescript
const atRisk = records.filter(r =>
  !r.isPublic &&
  Date.now() / 1000 > r.lastActiveAt + r.inactivityPeriod - 7 * 24 * 60 * 60
);
```

**Validation:** With a mock record in the store whose `lastActiveAt` is 83 days ago and `inactivityPeriod` is 90 days, the component renders a warning banner. With a fresh record, no banner appears.

---

### Step 15.2 — Render the reminder banner

For each at-risk record, render a yellow banner:

"⚠ Evidence #{recordId} becomes public in less than 7 days. Confirm activity to reset the timer."

Include a "Confirm Activity" button per record.

**Validation:** The banner renders for at-risk records. No banner renders for healthy records.

---

### Step 15.3 — Wire the Confirm Activity button

When clicked, call `confirmActivity(BigInt(record.id))` from `contracts.ts`. Await the transaction. On success, refresh the record from the chain and update the store.

**Validation:** On a local Hardhat node, clicking "Confirm Activity" sends a transaction. After confirmation, the `lastActiveAt` timestamp for that record is updated in the store.

---

## Phase 16 — Page: Main Upload Flow

### Step 16.1 — Create the upload page

Create `truthvault/frontend/src/app/upload/page.tsx`. Assemble the upload flow in order:

1. `<WalletConnector />`
2. `<ZKVerifier />` (disabled until wallet connected)
3. `<EvidenceUploader />` (disabled until ZK verified)
4. `<InactivityTimer />` (rendered alongside the uploader)
5. `<SuccessConfirmation />` (rendered after tx success, replacing the uploader)

Each section is only interactive when the preceding section is complete.

**Validation:** Walking through the complete flow in the browser — connect wallet → verify → upload → encrypt → IPFS → blockchain — reaches the `SuccessConfirmation` screen with all values populated.

---

### Step 16.2 — Add step indicators

Above the form, render a horizontal stepper with five labeled steps:

`Connect → Verify → Upload → Encrypt → Register`

Highlight the current step. Mark completed steps with a checkmark.

**Validation:** The active step highlights as the user progresses. Completed steps show checkmarks.

---

### Step 16.3 — Add global error display

Add an `error` state. If any step throws, catch it and display a dismissable red error banner at the top of the page with the human-readable message.

**Validation:** Simulating a contract revert (by passing an invalid inactivity period) shows the error message. Clicking dismiss hides it.

---

### Step 16.4 — Add a navigation link to the dashboard

At the bottom of the page, render a link to `/dashboard`.

**Validation:** Clicking the link navigates to `/dashboard` without a full page reload (Next.js client navigation).

---

## Phase 17 — Page: Evidence Dashboard

### Step 17.1 — Create the dashboard page

Create `truthvault/frontend/src/app/dashboard/page.tsx`. On mount, read the connected wallet address and query the `EvidenceRegistered` events from the contract filtered by the user's address. Populate the `records` array in the Zustand store.

**Validation:** After registering one evidence record and navigating to the dashboard, one record card appears.

---

### Step 17.2 — Render record cards

For each record in `records`, render a card showing:

- Record ID
- IPFS CID (with gateway link)
- Timestamp (human-readable)
- Inactivity deadline
- Disclosure status (Private / Public)
- NFT Token ID

**Validation:** All fields display correctly for a test record. The IPFS link opens the encrypted blob.

---

### Step 17.3 — Embed ActivityReminder

Include `<ActivityReminder />` at the top of the dashboard.

**Validation:** For a record within 7 days of its deadline, the banner appears above the record cards.

---

### Step 17.4 — Add a link to the upload page

Render a prominent "Upload New Evidence" button that links to `/upload`.

**Validation:** The button navigates to `/upload`.

---

## Phase 18 — End-to-End Validation

### Step 18.1 — Run all contract tests

```bash
cd truthvault/contracts
npx hardhat test
```

**Validation:** All tests pass. 0 failures.

---

### Step 18.2 — Run all frontend tests

```bash
cd truthvault/frontend
pnpm vitest run
```

**Validation:** All tests pass. 0 failures.

---

### Step 18.3 — Run a TypeScript check

```bash
cd truthvault/frontend
pnpm tsc --noEmit
```

**Validation:** 0 TypeScript errors.

---

### Step 18.4 — Run a production build

```bash
cd truthvault/frontend
pnpm build
```

**Validation:** Build completes with 0 errors. No `any` type warnings in the build output.

---

### Step 18.5 — Manual end-to-end smoke test on local Hardhat node

With Hardhat node running locally and contracts deployed to it:

1. Open `localhost:3000/upload`.
2. Connect MetaMask (pointed at the local Hardhat network).
3. Complete mock World ID verification.
4. Upload a small test file (e.g., a 1KB text file).
5. Encrypt and upload to IPFS (use a real Pinata JWT).
6. Register on the local Hardhat blockchain.
7. Confirm the success screen shows all five values.
8. Navigate to `/dashboard` and confirm the record appears.
9. Confirm the NFT is visible in MetaMask's NFT tab (local network may require manual import by contract address + token ID).

**Validation:** All 9 steps complete without errors. The `EvidenceRegistered` event appears in the Hardhat node console output. The IPFS CID resolves to the encrypted blob via the Pinata gateway.

---

*End of TruthVault Implementation Document v1.0*