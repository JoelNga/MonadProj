# TruthVault — Design Document
**Version:** 1.0 (MVP)
**Last Updated:** May 2026
**Status:** Draft

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Technology Stack](#3-technology-stack)
4. [Component Design](#4-component-design)
   - 4.1 Frontend
   - 4.2 Smart Contracts
   - 4.3 Storage Layer
   - 4.4 ZK Identity Layer
5. [Data Models](#5-data-models)
6. [Smart Contract Design](#6-smart-contract-design)
7. [Encryption Design](#7-encryption-design)
8. [ZK Verification Flow](#8-zk-verification-flow)
9. [Dead-Man-Switch Design](#9-dead-man-switch-design)
10. [NFT Design](#10-nft-design)
11. [User Flow — Technical Mapping](#11-user-flow--technical-mapping)
12. [API & Interface Contracts](#12-api--interface-contracts)
13. [Security Design](#13-security-design)
14. [Error Handling](#14-error-handling)
15. [Scalability & Future Considerations](#15-scalability--future-considerations)
16. [Open Questions & Risks](#16-open-questions--risks)

---

## 1. Introduction

### 1.1 Purpose
This document defines the technical design for TruthVault MVP — a decentralized, censorship-resistant evidence preservation platform. It is intended for engineers and auditors who will build, review, and maintain the system.

### 1.2 Scope
This document covers the MVP as defined in the PRD: wallet authentication, ZK identity verification, client-side encryption, IPFS storage, Monad blockchain proof registration, NFT minting, and the dead-man-switch disclosure mechanism.

### 1.3 Design Principles
- **Privacy-first:** No plaintext data ever leaves the user's device or touches a server.
- **Trustless:** All verification logic lives in auditable smart contracts.
- **Modular:** ZK providers and storage backends are swappable without redesigning the core.
- **Minimal attack surface:** The backend (if any) holds no secrets and no user data.

---

## 2. System Architecture Overview

```
┌──────────────────────────────────────────────────────┐
│                    User Browser                       │
│                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │   Wallet    │  │  ZK Identity │  │  Encryption │ │
│  │  (MetaMask) │  │   (World ID  │  │  (AES-256)  │ │
│  └──────┬──────┘  │   / zkPass)  │  └──────┬──────┘ │
│         │         └──────┬───────┘         │         │
│         └────────────────┼─────────────────┘         │
│                          │                            │
└──────────────────────────┼────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
  ┌──────────────┐  ┌────────────┐  ┌─────────────┐
  │    Monad     │  │    IPFS    │  │  ZK Provider│
  │  Blockchain  │  │  (Storage) │  │  (External) │
  │              │  │            │  │             │
  │ EvidenceVault│  │ Encrypted  │  │ World ID /  │
  │ EvidenceNFT  │  │ File Blobs │  │ zkPass etc. │
  └──────────────┘  └────────────┘  └─────────────┘
```

All sensitive operations (encryption, key derivation, proof generation) happen client-side. The blockchain stores only hashes, CIDs, and proof validity flags. The IPFS layer stores only ciphertext.

---

## 3. Technology Stack

| Layer | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js (React) | SSR optional; strong wallet lib ecosystem |
| Wallet integration | wagmi + viem | Modern, type-safe EVM wallet abstraction |
| ZK identity (primary) | World ID (IDKit) | Battle-tested, Sybil-resistant, on-chain verifier available |
| ZK identity (fallback) | zkPass / Semaphore | Modularity; different trust models |
| Client-side encryption | Web Crypto API (AES-256-GCM) | Native browser, no third-party dependency |
| Decentralized storage | IPFS via Web3.Storage or Pinata | Reliable pinning, CID generation |
| Blockchain | Monad (EVM-compatible) | High throughput, low fees, EVM compatibility |
| Smart contract language | Solidity ^0.8.20 | Standard; tooling is mature |
| Smart contract framework | Hardhat + ethers.js | Testing, deployment, scripting |
| NFT standard | ERC-721 | Ownership proof; transferable |
| State management | Zustand | Lightweight; sufficient for MVP |

---

## 4. Component Design

### 4.1 Frontend

The frontend is a single-page application with no backend. All server communication goes to IPFS pinning services and blockchain RPC nodes.

**Key modules:**

`/components/WalletConnector` — Handles wallet connection via wagmi. Persists session. Displays connected address (truncated).

`/components/ZKVerifier` — Embeds the ZK provider widget (e.g., World ID IDKit). Stores proof result in component state. Does not persist proof data beyond the session.

`/components/EvidenceUploader` — File picker with validation (type, size). Triggers the encryption pipeline. Displays upload progress.

`/lib/encryption.ts` — Pure functions: `encryptFile(file, key)` → `{ciphertext, iv}`, `deriveKey()` → `CryptoKey`. Uses Web Crypto API only.

`/lib/ipfs.ts` — Wraps the chosen IPFS client. Exports `uploadToIPFS(encryptedBlob)` → `CID`.

`/lib/contracts.ts` — Typed contract bindings via viem. Exports `registerEvidence(...)` and `mintNFT(...)`.

`/lib/hash.ts` — `hashFile(file)` → `bytes32` using SHA-256 via Web Crypto.

### 4.2 Smart Contracts

Two primary contracts:

**EvidenceVault.sol** — Stores evidence records, validates ZK proofs, manages the dead-man-switch timer, enforces upload quotas per verified identity.

**EvidenceNFT.sol** — ERC-721 contract. Minted by EvidenceVault after successful evidence registration. Metadata URI points to IPFS.

A ZK verifier contract (provided by the chosen ZK provider, e.g., World ID's `IWorldID` interface) is called from EvidenceVault.

### 4.3 Storage Layer

Only encrypted blobs are uploaded to IPFS. The upload flow:

1. User selects file in browser.
2. AES-256-GCM key generated locally.
3. File encrypted in-browser; plaintext never leaves the device.
4. `{iv, ciphertext}` packaged as a single blob.
5. Blob uploaded to IPFS via pinning service API.
6. Returned CID stored on-chain alongside the file hash.

The decryption key is the user's responsibility to store. For the MVP, the key is displayed once and the user is instructed to save it. Future versions may support threshold encryption or social recovery.

### 4.4 ZK Identity Layer

The ZK layer is designed as a pluggable interface:

```typescript
interface ZKProvider {
  verify(): Promise<ZKProof>;
  getOnChainVerifierAddress(): Address;
}
```

MVP ships with a World ID adapter. Additional adapters (zkPass, Semaphore) can be added without modifying EvidenceVault's core logic, since the contract accepts a verifier address as a parameter.

---

## 5. Data Models

### On-Chain Evidence Record

```solidity
struct EvidenceRecord {
    bytes32   fileHash;          // SHA-256 of original plaintext file
    string    ipfsCID;           // IPFS content identifier (encrypted blob)
    uint256   timestamp;         // Block timestamp at registration
    address   owner;             // Uploader wallet address
    string    metadataURI;       // IPFS URI to NFT metadata JSON
    bool      zkVerified;        // Whether uploader passed ZK check
    uint256   lastActiveAt;      // Last confirmed activity timestamp
    uint256   inactivityPeriod;  // Seconds before dead-man-switch triggers
    bool      isPublic;          // Disclosure state
    uint256   nftTokenId;        // Token ID of the minted NFT
}
```

### IPFS Encrypted Blob (binary)

```
[ 12 bytes IV ][ N bytes AES-256-GCM ciphertext ][ 16 bytes auth tag ]
```

### NFT Metadata JSON (stored on IPFS)

```json
{
  "name": "TruthVault Evidence #<tokenId>",
  "description": "Tamper-proof evidence record.",
  "attributes": [
    { "trait_type": "File Hash",    "value": "0x..." },
    { "trait_type": "IPFS CID",     "value": "bafy..." },
    { "trait_type": "Timestamp",    "value": "2026-05-16T..." },
    { "trait_type": "ZK Verified",  "value": true }
  ]
}
```

### Frontend Session State

```typescript
interface AppState {
  walletAddress:    string | null;
  zkProof:          ZKProof | null;
  currentUpload: {
    file:           File | null;
    encryptionKey:  string | null;   // hex-encoded, shown once
    ipfsCID:        string | null;
    fileHash:       string | null;
    txHash:         string | null;
    nftTokenId:     bigint | null;
  };
  inactivityPeriod: number;          // seconds, user-configured
}
```

---

## 6. Smart Contract Design

### 6.1 EvidenceVault.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IZKVerifier {
    function verifyProof(
        address signal,
        uint256 root,
        uint256 nullifierHash,
        uint256[8] calldata proof
    ) external;
}

contract EvidenceVault {
    // --- State ---
    mapping(uint256 => EvidenceRecord) public records;
    mapping(address => uint256)        public uploadCount;
    mapping(uint256 => bool)           public usedNullifiers; // Sybil prevention
    uint256 public recordCount;
    uint256 public constant MAX_UPLOADS_PER_IDENTITY = 10;

    IZKVerifier public zkVerifier;
    EvidenceNFT  public nftContract;

    // --- Events ---
    event EvidenceRegistered(uint256 indexed id, address indexed owner, string cid);
    event ActivityConfirmed(uint256 indexed id, uint256 timestamp);
    event EvidenceDisclosed(uint256 indexed id);

    // --- Core Functions ---

    function registerEvidence(
        bytes32 fileHash,
        string calldata ipfsCID,
        string calldata metadataURI,
        uint256 inactivityPeriod,
        // ZK proof params
        uint256 zkRoot,
        uint256 nullifierHash,
        uint256[8] calldata zkProof
    ) external returns (uint256 recordId);

    function confirmActivity(uint256 recordId) external;

    function triggerDisclosure(uint256 recordId) external;

    function checkAndTrigger(uint256 recordId) external;
}
```

**Key invariants:**
- `nullifierHash` must not have been used before (prevents duplicate identities).
- `uploadCount[owner]` must be below `MAX_UPLOADS_PER_IDENTITY`.
- Only the evidence owner can call `confirmActivity`.
- Anyone can call `checkAndTrigger` after the inactivity period has elapsed; this makes disclosure permissionless and censorship-resistant.

### 6.2 EvidenceNFT.sol

Standard ERC-721. Minting is restricted to the `EvidenceVault` contract address via an `onlyVault` modifier. Token URI returns the IPFS metadata JSON URI stored at mint time.

### 6.3 Access Control

No admin keys or owner roles in the MVP. Contracts are immutable post-deployment for the MVP to maximize trustlessness. Upgradability (via proxy) is deferred to v2.

---

## 7. Encryption Design

### Algorithm
AES-256-GCM — provides both confidentiality and integrity (authentication tag detects tampering).

### Key Derivation
For MVP: a random 256-bit key is generated per upload using `crypto.getRandomValues`. The user is shown the hex-encoded key and instructed to store it securely.

```typescript
async function generateEncryptionKey(): Promise<{ cryptoKey: CryptoKey; hexKey: string }> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const cryptoKey = await crypto.subtle.importKey("raw", raw, "AES-GCM", true, ["encrypt", "decrypt"]);
  const hexKey = Array.from(raw).map(b => b.toString(16).padStart(2, "0")).join("");
  return { cryptoKey, hexKey };
}
```

### Encryption Flow

```typescript
async function encryptFile(file: File, key: CryptoKey): Promise<Blob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = await file.arrayBuffer();
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  // Prepend IV to ciphertext for storage
  const result = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(ciphertext), iv.byteLength);
  return new Blob([result]);
}
```

### File Hash
SHA-256 hash of the **original plaintext** file is computed before encryption. This hash is what is registered on-chain and embedded in the NFT metadata, allowing third parties to verify file integrity if the decryption key is ever released.

---

## 8. ZK Verification Flow

### World ID (Primary)

1. Frontend loads World ID IDKit widget.
2. User scans QR code with World App → proof generated locally on their phone.
3. IDKit returns `{ merkle_root, nullifier_hash, proof }` to the frontend.
4. Frontend passes these as parameters to `EvidenceVault.registerEvidence(...)`.
5. EvidenceVault calls `IWorldID.verifyProof(...)` on the World ID on-chain verifier.
6. If verification passes, `nullifier_hash` is recorded as used.
7. Evidence is registered.

### Nullifier Hash
The `nullifier_hash` is derived from the user's World ID identity and the app-specific action ID. It is deterministic per user per action, meaning the same person cannot register twice under the same action without being detected — while revealing nothing about their identity.

### Quota Enforcement
Each verified `nullifier_hash` maps to a quota counter. Once `MAX_UPLOADS_PER_IDENTITY` is reached, further uploads from the same identity are rejected on-chain.

---

## 9. Dead-Man-Switch Design

### State Machine

```
PRIVATE (active)
    │
    │  inactivity > inactivityPeriod
    │  (or manual trigger)
    ▼
PUBLIC (disclosed)
```

Disclosure is one-way and irreversible in the MVP.

### Timer Mechanics

- `lastActiveAt` is set to `block.timestamp` when evidence is registered and when `confirmActivity` is called.
- `inactivityPeriod` is set by the user at upload time (e.g., 90 days = `7776000` seconds). Min/max bounds enforced by the contract (e.g., 7 days minimum, 2 years maximum).
- Anyone (including the uploader, third parties, or a keeper bot) can call `checkAndTrigger(recordId)`. The contract checks `block.timestamp > lastActiveAt + inactivityPeriod` and flips `isPublic = true` if the condition holds.

### Frontend Reminder UX

The frontend tracks the user's evidence records and their inactivity deadlines. It displays a prominent reminder banner when any record is within 7 days of its threshold, prompting the user to call `confirmActivity`.

### Decryption Key Release (MVP)
For MVP, the decryption key is stored only with the user. Disclosure on-chain changes `isPublic` to true, but the key must be separately published for evidence to be readable by others. The recommended pattern is for the user to publish the key alongside a pre-written disclosure message stored in encrypted form on IPFS, triggered manually or via a future keeper integration.

> **Future:** Use threshold encryption (e.g., Lit Protocol or Shamir's Secret Sharing stored across nodes) so the key is automatically released when `isPublic` flips on-chain.

---

## 10. NFT Design

### Standard
ERC-721. One NFT per evidence record.

### Metadata (stored on IPFS, referenced by `tokenURI`)

```json
{
  "name": "TruthVault Evidence #42",
  "description": "Immutable, timestamped evidence record preserved on the Monad blockchain.",
  "image": "ipfs://bafyrei.../badge.png",
  "attributes": [
    { "trait_type": "File Hash",        "value": "0xabc123..." },
    { "trait_type": "IPFS CID",         "value": "bafy..." },
    { "trait_type": "Upload Timestamp", "value": "2026-05-16T10:30:00Z" },
    { "trait_type": "ZK Verified",      "value": "Yes" },
    { "trait_type": "Disclosure Status","value": "Private" }
  ]
}
```

### Transferability
NFTs are transferable. Ownership transfer does NOT change the `owner` field in `EvidenceRecord` (the original uploader remains the authority for `confirmActivity`). The NFT represents proof of evidence existence, not administrative control.

---

## 11. User Flow — Technical Mapping

| Step | User Action | System Action |
|---|---|---|
| 1 | Connect wallet | wagmi connects MetaMask; wallet address stored in state |
| 2 | Complete ZK verification | IDKit widget opens; user verifies with World App; ZK proof returned to frontend |
| 3 | Select evidence file | File picker; client validates type and size (≤100MB) |
| 4 | Encrypt file client-side | `generateEncryptionKey()` + `encryptFile()`; hex key displayed to user |
| 5 | Upload encrypted file to IPFS | `uploadToIPFS(encryptedBlob)` → CID returned |
| 6 | Generate file hash | `hashFile(originalFile)` → bytes32 (SHA-256) |
| 7 | Store proof on Monad | `EvidenceVault.registerEvidence(...)` called; transaction sent; event `EvidenceRegistered` emitted |
| 8 | Mint NFT | Triggered internally by `registerEvidence`; `EvidenceNFT.mint(owner, metadataURI)` called |
| 9 | Configure inactivity timer | User selects duration; passed as `inactivityPeriod` in step 7 |
| 10 | Display success confirmation | `txHash`, `recordId`, `tokenId`, `CID`, hex key shown; user prompted to save key |

---

## 12. API & Interface Contracts

### IPFS Pinning Service
The platform wraps Web3.Storage (or Pinata) behind a thin client module. The module interface:

```typescript
interface IPFSClient {
  upload(blob: Blob): Promise<string>;   // returns CID
  getUrl(cid: string): string;           // returns gateway URL
}
```

No backend relay is required; uploads go directly from the browser to the pinning service API using a publishable API key (scoped to upload-only).

### Smart Contract ABI (key functions)

```typescript
// registerEvidence
{
  name: "registerEvidence",
  inputs: [
    { name: "fileHash",         type: "bytes32"    },
    { name: "ipfsCID",          type: "string"     },
    { name: "metadataURI",      type: "string"     },
    { name: "inactivityPeriod", type: "uint256"    },
    { name: "zkRoot",           type: "uint256"    },
    { name: "nullifierHash",    type: "uint256"    },
    { name: "zkProof",          type: "uint256[8]" }
  ],
  outputs: [{ name: "recordId", type: "uint256" }]
}

// confirmActivity
{
  name: "confirmActivity",
  inputs: [{ name: "recordId", type: "uint256" }]
}

// checkAndTrigger
{
  name: "checkAndTrigger",
  inputs: [{ name: "recordId", type: "uint256" }]
}
```

---

## 13. Security Design

### Threat Model

| Threat | Mitigation |
|---|---|
| Identity exposure | ZK proofs; no personal data on-chain |
| Evidence tampering | On-chain hash; IPFS content-addressed storage |
| Spam / Sybil attacks | Nullifier-based quota; ZK uniqueness proof |
| Plaintext evidence leak | AES-256-GCM client-side; ciphertext-only storage |
| Smart contract exploit | Audited before mainnet; immutable MVP contracts |
| IPFS content removal | Redundant pinning; CID is permanent reference |
| Replay attacks | Nullifier hashes are single-use |
| Disclosure race condition | `checkAndTrigger` is idempotent; duplicate calls are no-ops |

### Key Management Risk
The biggest MVP risk is key loss. If the user loses their AES key, evidence is permanently inaccessible. This is mitigated by clear UX warnings and is addressed architecturally in v2 via threshold encryption.

### Front-end Supply Chain
All cryptographic operations use the native Web Crypto API (no third-party crypto libraries). Pinning service interaction uses a narrowly scoped API key.

---

## 14. Error Handling

| Failure Point | Handling |
|---|---|
| Wallet not connected | Gate all upload actions; prompt connection |
| ZK proof invalid | Display provider error; do not proceed to upload |
| File too large / wrong type | Client-side validation before encryption begins |
| Encryption failure | Catch Web Crypto error; display retry prompt |
| IPFS upload failure | Retry up to 3 times with exponential backoff; surface error with CID status |
| Transaction reverted | Parse revert reason from contract (quota exceeded, duplicate nullifier, etc.); display human-readable message |
| Inactivity timer not reset | Frontend reminder banner; warn 7 days before threshold |

---

## 15. Scalability & Future Considerations

### v2 Roadmap (Post-MVP)

**Threshold encryption for key release** — Replace manual key storage with Lit Protocol or a similar threshold network so the decryption key is automatically published when `isPublic` flips.

**Keeper network for dead-man-switch** — Integrate Chainlink Automation or Gelato to call `checkAndTrigger` without relying on third-party users.

**Multi-file evidence packages** — Allow bundling multiple files into a single evidence record with a Merkle tree of hashes.

**Upgradeable contracts** — Use OpenZeppelin Transparent Proxy for post-audit upgrades.

**Additional ZK providers** — Implement `ZKProvider` adapters for zkPass, Polygon ID, Self.xyz.

**Evidence categories and metadata** — Allow optional encrypted metadata (title, description, tags) stored alongside the file.

**Social recovery for keys** — Shamir's Secret Sharing split across trusted contacts.

---

## 16. Open Questions & Risks

| # | Question / Risk | Owner | Status |
|---|---|---|---|
| 1 | Which IPFS pinning service is selected? (Web3.Storage vs Pinata vs self-hosted) | Engineering | Open |
| 2 | World ID is the primary ZK provider — is a fallback required for MVP launch? | Product | Open |
| 3 | What is the minimum/maximum inactivity period? Contract-enforced bounds TBD. | Engineering | Open |
| 4 | Monad testnet vs mainnet for launch target | Product | Open |
| 5 | Key display UX — show once with confirmation, or allow re-display from encrypted local store? | Design | Open |
| 6 | Is a backend relay needed for IPFS pinning (to protect API key), or can a publishable key be used? | Engineering | Open |
| 7 | Smart contract audit scope and timeline | Engineering | Open |
| 8 | What constitutes "activity"? Only `confirmActivity` calls, or any on-chain transaction? | Product | Open |

---

*End of TruthVault Design Document v1.0*