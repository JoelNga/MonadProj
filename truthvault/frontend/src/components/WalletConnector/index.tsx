"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";

export function WalletConnector() {
  const { address, isConnected } = useAccount();

  return (
    <div className="flex flex-col items-center gap-2">
      <ConnectButton />
      {isConnected && address && (
        <p className="text-sm text-gray-400">
          {address.slice(0, 6)}...{address.slice(-4)}
        </p>
      )}
    </div>
  );
}

export function useIsConnected() {
  const { isConnected } = useAccount();
  return isConnected;
}