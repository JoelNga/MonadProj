# TruthVault

TruthVault is a blockchain-based tamper-proof evidence vault on the Monad testnet.

## Getting Started (Fresh Git Clone)

If you have just cloned the repository, follow these steps to run the full stack locally:

### 1. Install Dependencies
Navigate into the `truthvault` directory and run install. We use npm workspaces, so this single command installs dependencies for both the smart contracts and the frontend:

```bash
cd truthvault
npm install
```

### 2. Set Up Environment Variables
You need to set up environment variables for both the smart contracts and the frontend. 

In `truthvault/contracts`, copy `.env.example` to `.env` and fill in the values:
```bash
MONAD_RPC_URL=
DEPLOYER_PRIVATE_KEY=
WORLD_ID_VERIFIER_ADDRESS=
```

In `truthvault/frontend`, copy `.env.example` to `.env.local` and fill in the values:
```bash
NEXT_PUBLIC_EVIDENCE_VAULT_ADDRESS=
NEXT_PUBLIC_EVIDENCE_NFT_ADDRESS=
NEXT_PUBLIC_MONAD_RPC_URL=
NEXT_PUBLIC_PINATA_JWT=
NEXT_PUBLIC_WORLD_ID_APP_ID=
NEXT_PUBLIC_WORLD_ID_ACTION=
```

### 3. Run the Project
To start both the local Hardhat blockchain and the Next.js development server simultaneously:

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`.
