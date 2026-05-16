"use client";

import { useState } from "react";
import Link from "next/link";
import { WalletConnector, useIsConnected } from "@/components/WalletConnector";
import { ZKVerifier } from "@/components/ZKVerifier";
import { EvidenceUploader } from "@/components/EvidenceUploader";
import { InactivityTimer } from "@/components/InactivityTimer";
import { SuccessConfirmation } from "@/components/SuccessConfirmation";
import { useAppStore } from "@/store/useAppStore";

const steps = ["Connect", "Verify", "Upload", "Encrypt", "Register"];

export default function UploadPage() {
  const isConnected = useIsConnected();
  const { zkProof, encryptionKey, ipfsCID, txHash, file } = useAppStore();
  const [error, setError] = useState<string>("");
  const [successData, setSuccessData] = useState<{
    txHash: string;
    ipfsCID: string;
    encryptionKey: string;
    recordId: string;
    nftTokenId: string;
  } | null>(null);

  const getCurrentStep = () => {
    if (successData) return 4;
    if (txHash) return 4;
    if (ipfsCID) return 3;
    if (encryptionKey) return 2;
    if (zkProof) return 1;
    if (isConnected) return 0;
    return -1;
  };

  const currentStep = getCurrentStep();

  if (successData) {
    return (
      <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
        <SuccessConfirmation
          txHash={successData.txHash}
          ipfsCID={successData.ipfsCID}
          encryptionKey={successData.encryptionKey}
          recordId={successData.recordId}
          nftTokenId={successData.nftTokenId}
        />
        <Link href="/dashboard" className="mt-8 text-indigo-400 hover:underline">
          Go to Dashboard →
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">TruthVault Upload</h1>

      <div className="flex gap-4 mb-8">
        {steps.map((step, i) => (
          <div
            key={step}
            className={`flex items-center gap-2 ${
              i <= currentStep ? "text-green-500" : "text-gray-500"
            }`}
          >
            {i <= currentStep && <span>✓</span>}
            <span className={i === currentStep ? "font-bold" : ""}>{step}</span>
            {i < steps.length - 1 && <span className="text-gray-600">→</span>}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-600 p-4 rounded-lg mb-4 w-full max-w-md">
          <p className="text-red-500">{error}</p>
          <button onClick={() => setError("")} className="text-gray-400 text-sm mt-2">
            Dismiss
          </button>
        </div>
      )}

      <div className="flex flex-col gap-8 w-full max-w-md">
        <section className="flex flex-col items-center gap-4">
          <h2 className="text-xl font-semibold">1. Connect Wallet</h2>
          <WalletConnector />
        </section>

        {isConnected && (
          <section className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">2. Verify Identity</h2>
            <ZKVerifier />
          </section>
        )}

        {zkProof && (
          <section className="flex flex-col items-center gap-4">
            <h2 className="text-xl font-semibold">3. Upload & Encrypt</h2>
            <EvidenceUploader
              onSuccess={data => setSuccessData({
                txHash: data.txHash,
                ipfsCID: ipfsCID || "",
                encryptionKey: encryptionKey || "",
                recordId: data.recordId,
                nftTokenId: data.nftTokenId,
              })}
            />
            <InactivityTimer />
          </section>
        )}
      </div>

      <Link href="/dashboard" className="mt-12 text-indigo-400 hover:underline">
        Go to Dashboard →
      </Link>
    </main>
  );
}