"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { generateEncryptionKey, encryptFile } from "@/lib/encryption";
import { hashFile } from "@/lib/hash";
import { uploadToIPFS, uploadJSONToIPFS } from "@/lib/ipfs";
import { registerEvidence } from "@/lib/contracts";

interface Props {
  onSuccess?: (data: { txHash: string; recordId: string; nftTokenId: string }) => void;
}

export function EvidenceUploader({ onSuccess }: Props) {
  const {
    file,
    setFile,
    encryptionKey,
    setEncryptionKey,
    ipfsCID,
    setIPFSCID,
    fileHash,
    setFileHash,
    inactivityPeriod,
    zkProof,
  } = useAppStore();

  const [encryptedBlob, setEncryptedBlob] = useState<Blob | null>(null);
  const [metadataURI, setMetadataURI] = useState<string>("");
  const [loading, setLoading] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > 104_857_600) {
      setError("File size must be less than 100MB");
      return;
    }

    const allowedTypes = [
      "image/",
      "video/",
      "audio/",
      "application/pdf",
      "text/plain",
    ];
    if (!allowedTypes.some(type => selected.type.startsWith(type))) {
      setError("Invalid file type");
      return;
    }

    setError("");
    setFile(selected);
  };

  const handleEncrypt = async () => {
    if (!file) return;
    try {
      setLoading("Encrypting...");
      const { cryptoKey, hexKey } = await generateEncryptionKey();
      setEncryptionKey(hexKey);
      
      const encrypted = await encryptFile(file, cryptoKey);
      setEncryptedBlob(encrypted);
      
      const hash = await hashFile(file);
      setFileHash(hash);
      
      setLoading("");
    } catch (err) {
      setError("Encryption failed");
      setLoading("");
    }
  };

  const handleUploadIPFS = async () => {
    if (!encryptedBlob) return;
    try {
      setLoading("Uploading to IPFS...");
      const cid = await uploadToIPFS(encryptedBlob, file!.name);
      setIPFSCID(cid);
      setLoading("");
    } catch (err) {
      setError("IPFS upload failed");
      setLoading("");
    }
  };

  const handleRegister = async () => {
    if (!ipfsCID || !fileHash || !zkProof || !encryptionKey) return;
    try {
      setLoading("Registering on blockchain...");
      
      const metadata = {
        name: "TruthVault Evidence #pending",
        description: "Tamper-proof evidence record.",
        attributes: [
          { trait_type: "File Hash", value: fileHash },
          { trait_type: "IPFS CID", value: ipfsCID },
          { trait_type: "Upload Timestamp", value: new Date().toISOString() },
          { trait_type: "ZK Verified", value: "Yes" },
          { trait_type: "Disclosure Status", value: "Private" },
        ],
      };
      
      const metadataCID = await uploadJSONToIPFS(metadata);
      const uri = `ipfs://${metadataCID}`;
      setMetadataURI(uri);

      const proof = zkProof as any;
      
      const txHash = await registerEvidence({
        fileHash,
        ipfsCID,
        metadataURI: uri,
        inactivityPeriod: BigInt(inactivityPeriod),
        zkRoot: BigInt(proof.merkle_root || 0),
        nullifierHash: BigInt(proof.nullifier_hash || 0),
        zkProof: [
          BigInt(proof.proof_a?.[0] || 0),
          BigInt(proof.proof_a?.[1] || 0),
          BigInt(proof.proof_b?.[0]?.[0] || 0),
          BigInt(proof.proof_b?.[0]?.[1] || 0),
          BigInt(proof.proof_b?.[1]?.[0] || 0),
          BigInt(proof.proof_b?.[1]?.[1] || 0),
          BigInt(proof.proof_c?.[0] || 0),
          BigInt(proof.proof_c?.[1] || 0),
        ],
      });

      setLoading("");
      onSuccess?.({ txHash, recordId: "0", nftTokenId: "0" });
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading("");
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div>
        <input
          type="file"
          accept="image/*,video/*,audio/*,application/pdf,text/plain"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {file && !encryptionKey && (
        <button
          onClick={handleEncrypt}
          disabled={!!loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Encrypt
        </button>
      )}

      {encryptionKey && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-yellow-500 text-sm font-bold mb-2">⚠️ Save this key! It cannot be recovered.</p>
          <div className="flex items-center gap-2">
            <code className="text-green-400 text-xs break-all">{encryptionKey}</code>
          </div>
        </div>
      )}

      {encryptionKey && !ipfsCID && (
        <button
          onClick={handleUploadIPFS}
          disabled={!!loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Upload to IPFS
        </button>
      )}

      {ipfsCID && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">IPFS CID:</p>
          <code className="text-green-400 text-xs">{ipfsCID}</code>
        </div>
      )}

      {ipfsCID && zkProof && (
        <button
          onClick={handleRegister}
          disabled={!!loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          Register on Blockchain
        </button>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-400">{loading}</span>
        </div>
      )}
    </div>
  );
}