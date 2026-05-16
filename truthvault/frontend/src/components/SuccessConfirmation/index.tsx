"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";

interface Props {
  txHash: string;
  ipfsCIDs: string[];
  encryptionKeys: string[];
  recordId: string;
  nftTokenId: string;
}

export function SuccessConfirmation({ txHash, ipfsCIDs, encryptionKeys, recordId, nftTokenId }: Props) {
  const { reset } = useAppStore();
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const fields = [
    { label: "Transaction Hash", value: txHash, key: "tx" },
    { label: "Record ID", value: recordId, key: "record" },
    { label: "NFT Token ID", value: nftTokenId, key: "nft" },
  ];

  const handleDone = () => {
    reset();
  };

  return (
    <div className="flex flex-col gap-6 items-center">
      <h2 className="text-2xl font-bold text-green-500">Evidence Registered Successfully!</h2>

      <div className="flex flex-col gap-4 w-full max-w-md">
        {fields.map(field => (
          <div key={field.key} className="flex flex-col gap-1">
            <p className="text-gray-400 text-sm">{field.label}</p>
            <div className="flex items-center gap-2">
              <code className="text-green-400 text-xs break-all flex-1">{field.value}</code>
              <button
                onClick={() => copyToClipboard(field.value, field.key)}
                className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700"
              >
                {copied === field.key ? "✓" : "Copy"}
              </button>
            </div>
          </div>
        ))}

        {encryptionKeys.length > 0 && (
          <div className="flex flex-col gap-2 mt-4">
            <p className="text-yellow-500 text-sm font-bold">⚠️ Encryption Keys (save these!)</p>
            {encryptionKeys.map((key, i) => (
              <div key={i} className="flex flex-col gap-1">
                <p className="text-gray-500 text-xs">File {i + 1}</p>
                <div className="flex items-center gap-2">
                  <code className="text-green-400 text-xs break-all flex-1">{key}</code>
                  <button
                    onClick={() => copyToClipboard(key, `key-${i}`)}
                    className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700"
                  >
                    {copied === `key-${i}` ? "✓" : "Copy"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {ipfsCIDs.length > 0 && (
          <div className="flex flex-col gap-2 mt-2">
            <p className="text-gray-400 text-sm">IPFS CIDs</p>
            {ipfsCIDs.map((cid, i) => (
              <div key={i} className="flex items-center gap-2">
                <code className="text-green-400 text-xs break-all flex-1">{cid}</code>
                <button
                  onClick={() => copyToClipboard(cid, `cid-${i}`)}
                  className="px-2 py-1 text-xs bg-gray-800 rounded hover:bg-gray-700"
                >
                  {copied === `cid-${i}` ? "✓" : "Copy"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="confirmKey"
          checked={confirmed}
          onChange={e => setConfirmed(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor="confirmKey" className="text-sm text-gray-400">
          I have saved my encryption key(s) in a secure location.
        </label>
      </div>

      <button
        onClick={handleDone}
        disabled={!confirmed}
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Done
      </button>
    </div>
  );
}
