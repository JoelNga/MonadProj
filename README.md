# TruthVault

A ZK-powered decentralized evidence preservation system for anonymous, tamper-proof, and censorship-resistant whistleblowing.

---

## Overview

TruthVault is a Web3 application that allows users to securely upload sensitive evidence (videos, images, documents, audio) while preserving anonymity and ensuring data integrity.

Every upload is:
- encrypted client-side
- stored on decentralized storage (IPFS)
- anchored on-chain (Monad blockchain)
- optionally verified via Zero-Knowledge identity proofs

The system ensures that evidence cannot be tampered with, censored, or deleted once submitted.

---

## Problem

Whistleblowers and witnesses often avoid reporting misconduct due to:
- fear of retaliation
- identity exposure
- centralized censorship
- evidence manipulation or deletion

Existing systems either lack privacy or lack trustless verification.

---

## Solution

TruthVault provides:
- Anonymous evidence submission
- Cryptographic proof of existence
- ZK-based human verification (Sybil resistance)
- Decentralized storage (IPFS)
- On-chain immutability (Monad)
- Automatic evidence disclosure via inactivity-based dead-man switch

---

## Key Features

### 🔐 Client-Side Encryption
All files are encrypted in the browser before upload. The platform never sees raw data.

### 🌐 Decentralized Storage
Encrypted evidence is stored on IPFS with content-addressed hashes.

### ⛓ On-Chain Proof (Monad)
Each submission is recorded on-chain with:
- file hash
- timestamp
- CID reference
- owner wallet

### 🧠 Zero-Knowledge Identity Verification
Users can prove they are real humans without revealing personal identity.

Prevents:
- spam uploads
- bot attacks
- fake submissions

### 📜 NFT Evidence Proof
Each evidence submission is represented as an NFT for ownership and traceability.

### ⏳ Dead-Man Switch
If a user becomes inactive beyond a defined period, their evidence is automatically released publicly.

---

## User Flow

1. Connect wallet
2. Complete ZK identity verification
3. Upload evidence file
4. File is encrypted in browser
5. Encrypted file uploaded to IPFS
6. Hash stored on Monad blockchain
7. NFT is minted
8. Evidence becomes verifiable on-chain
9. Optional: set inactivity-based auto-release timer

---

## Dead-Man Switch Mechanism

- Each user sets an inactivity threshold
- System tracks last wallet activity
- If user does not reconnect within threshold:
  - evidence becomes publicly accessible
  - disclosure event is logged on-chain

---

## Security Model

- No plaintext data stored server-side
- All evidence encrypted client-side
- ZK proofs prevent identity leakage
- Blockchain ensures immutability
- IPFS ensures decentralized storage

---

## What Makes It Special

- Anonymous but Sybil-resistant via ZK proofs
- Immutable evidence preservation
- Fully decentralized storage + verification
- Automatic evidence disclosure mechanism
- Privacy-first whistleblowing infrastructure

---

## Limitations (MVP)

- Does not verify truth of evidence
- No legal moderation layer
- No AI analysis of content
- Requires user discipline for encryption key safety

---

## Future Improvements

- DAO-based governance system
- AI-based evidence classification
- Multi-chain deployment
- Secure investigator collaboration layer
- Advanced anonymity routing (Tor-like integration)

---

## License

MIT License (or hackathon open-source license)

---

## One-Line Summary

TruthVault is a privacy-preserving Web3 evidence system enabling anonymous, tamper-proof whistleblowing using ZK identity verification, encryption, and blockchain immutability.