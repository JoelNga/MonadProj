"use client";

import { IDKitWidget, VerificationLevel, ISuccessResult } from "@worldcoin/idkit";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  onSuccess?: (proof: ISuccessResult) => void;
}

export function ZKVerifier({ onSuccess }: Props) {
  const { zkProof, setZKProof } = useAppStore();

  const handleSuccess = (proof: ISuccessResult) => {
    setZKProof(proof);
    onSuccess?.(proof);
  };

  if (zkProof) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <span className="text-xl">✓</span>
        <span className="font-medium">Verified</span>
      </div>
    );
  }

  return (
    <IDKitWidget
      app_id={(process.env.NEXT_PUBLIC_WORLD_ID_APP_ID || "app_test") as `app_${string}`}
      action={process.env.NEXT_PUBLIC_WORLD_ID_ACTION || "verify"}
      verification_level={VerificationLevel.Device}
      onSuccess={handleSuccess}
    >
      {({ open }: { open: () => void }) => (
        <button
          onClick={open}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Verify Identity
        </button>
      )}
    </IDKitWidget>
  );
}