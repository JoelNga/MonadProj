import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain } from "viem";

export const monadTestnet = defineChain({
  id: 10143,
  name: "Monad Testnet",
  nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_MONAD_RPC_URL || "https://testnet-rpc.monad.xyz"] },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName: "TruthVault",
  projectId: "truthvault-mvp",
  chains: [monadTestnet],
  ssr: true,
});