# TruthVault — Tech Stack

> Simple, durable, battle-tested. No unnecessary moving parts.

---

## Frontend

| Concern | Choice | Why |
|---|---|---|
| Framework | **Next.js 14** (App Router) | Mature, large ecosystem, easy deployment |
| Language | **TypeScript** | Catches contract ABI mismatches early |
| Styling | **Tailwind CSS** | No build complexity; easy to maintain |
| State management | **Zustand** | Lightweight; no boilerplate |
| Wallet connection | **wagmi v2 + viem** | Best-in-class EVM wallet abstraction; type-safe |
| Wallet UI | **RainbowKit** | Handles MetaMask + WalletConnect UI out of the box |

---

## Cryptography

| Concern | Choice | Why |
|---|---|---|
| File encryption | **Web Crypto API** (AES-256-GCM) | Native browser API; zero dependencies; audited by default |
| File hashing | **Web Crypto API** (SHA-256) | Same — no extra library needed |

No third-party crypto libraries. The browser already ships everything required.

---

## ZK Identity

| Concern | Choice | Why |
|---|---|---|
| Primary provider | **World ID** (IDKit v2) | Production-ready; on-chain Monad-compatible verifier; strong Sybil resistance |
| Integration method | **IDKit React widget** | Drop-in component; handles proof generation |

World ID is sufficient for MVP. The provider interface is abstracted so alternatives (zkPass, Semaphore) can be added later without touching core logic.

---

## Storage

| Concern | Choice | Why |
|---|---|---|
| Decentralized storage | **IPFS** | Content-addressed; immutable CIDs; widely supported |
| Pinning service | **Pinata** | Reliable, simple REST API, free tier covers MVP volume |

Only encrypted blobs are stored. Plaintext never reaches IPFS.

---

## Blockchain

| Concern | Choice | Why |
|---|---|---|
| Network | **Monad** (testnet → mainnet) | EVM-compatible; high throughput; low fees |
| Contract language | **Solidity ^0.8.20** | Industry standard; extensive tooling |
| Dev framework | **Hardhat** | Stable; good plugin ecosystem; easy local testing |
| Contract testing | **Hardhat + ethers.js** | Co-located with the framework; no extra setup |
| ZK verifier | **World ID on-chain verifier** (deployed on Monad) | Provided by World ID; no custom ZK circuit needed |
| NFT standard | **ERC-721** | Simple ownership proof; well-understood |

---

## Deployment

| Concern | Choice | Why |
|---|---|---|
| Frontend hosting | **Vercel** | Zero-config Next.js deployment; good free tier |
| Contract deployment | **Hardhat scripts** to Monad RPC | Standard; reproducible |
| Environment config | **`.env.local`** (Vercel env vars in prod) | Simple; no secrets manager needed at MVP scale |

---

## Development Tooling

| Concern | Choice | Why |
|---|---|---|
| Package manager | **pnpm** | Faster than npm; strict dependency resolution |
| Linting | **ESLint + Prettier** | Standard; Tailwind plugin handles class sorting |
| Contract linting | **Solhint** | Catches common Solidity pitfalls |

---

## What's Deliberately Left Out

| Skipped | Reason |
|---|---|
| Backend / API server | Nothing to serve — all logic is on-chain or in the browser |
| Database | On-chain state is the database |
| Redis / queues | No async jobs in MVP |
| GraphQL / subgraph | Direct RPC calls are sufficient at MVP scale; add The Graph in v2 if needed |
| Docker | Vercel + Hardhat handle environments; no containers needed |
| Threshold encryption (Lit Protocol) | Deferred to v2; adds significant complexity |
| Keeper network (Chainlink Automation) | Deferred to v2; disclosure can be triggered manually for MVP |

---

## Dependency Count Summary

```
Frontend:   Next.js, Tailwind, Zustand, wagmi, viem, RainbowKit, IDKit   (~7 core libs)
Crypto:     Web Crypto API (built-in)                                      (0 libs)
Storage:    Pinata SDK                                                      (1 lib)
Contracts:  Solidity, Hardhat, ethers.js, Solhint                          (3 tools)
```

Fewer dependencies = smaller attack surface, easier upgrades, longer shelf life.