"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  onSuccess?: () => void;
}

export function ZKVerifier({ onSuccess }: Props) {
  const { zkProof, setZKProof } = useAppStore();
  const [sessionId, setSessionId] = useState<string>("");
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = crypto.randomUUID();
    setSessionId(id);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!sessionId || scanned) return;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/verify-status?session=${sessionId}`);
        const data = await res.json();
        if (data.scanned) {
          setScanned(true);
          setZKProof({ verified: true, sessionId, timestamp: Date.now() });
          onSuccess?.();
          clearInterval(poll);
        }
      } catch {
        // ignore poll errors
      }
    }, 2000);

    return () => clearInterval(poll);
  }, [sessionId, scanned, setZKProof, onSuccess]);

  if (zkProof) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <span className="text-xl">✓</span>
        <span className="font-medium">Verified</span>
      </div>
    );
  }

  const baseUrl = typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(`${baseUrl}/api/verify?session=${sessionId}`)}&bgcolor=111827&color=22c55e`;

  const handleSkip = () => {
    setScanned(true);
    setZKProof({ verified: true, sessionId: "skipped", timestamp: Date.now() });
    onSuccess?.();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {loading ? (
        <div className="animate-pulse bg-gray-800 w-64 h-64 rounded-lg" />
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg">
            <img src={qrUrl} alt="Scan to verify" className="w-64 h-64" />
          </div>
          <p className="text-gray-400 text-sm text-center">
            Scan this QR code with your phone to verify
          </p>
          {scanned && (
            <div className="flex items-center gap-2 text-green-500 animate-pulse">
              <span className="text-xl">✓</span>
              <span className="font-medium">Verified!</span>
            </div>
          )}
          <button
            onClick={handleSkip}
            className="text-gray-500 text-sm hover:text-gray-300 underline mt-2"
          >
            Skip verification (demo mode)
          </button>
        </>
      )}
    </div>
  );
}