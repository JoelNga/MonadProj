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
    files,
    setFiles,
    addFiles,
    removeFile,
    encryptionKeys,
    setEncryptionKeys,
    ipfsCIDs,
    setIPFSCIDs,
    fileHashes,
    setFileHashes,
    inactivityPeriod,
    zkProof,
    title,
    setTitle,
    description,
    setDescription,
    isImmediate,
    setIsImmediate,
  } = useAppStore();

  const [encryptedBlobs, setEncryptedBlobs] = useState<Blob[]>([]);
  const [metadataURI, setMetadataURI] = useState<string>("");
  const [loading, setLoading] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [encryptingIndex, setEncryptingIndex] = useState<number>(-1);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;

    const oversized = selected.find(f => f.size > 104_857_600);
    if (oversized) {
      setError(`${oversized.name} exceeds 100MB limit`);
      return;
    }

    const allowedTypes = ["image/", "video/", "audio/", "application/pdf", "text/plain"];
    const invalid = selected.find(f => !allowedTypes.some(type => f.type.startsWith(type)));
    if (invalid) {
      setError(`${invalid.name} has an unsupported file type`);
      return;
    }

    setError("");
    addFiles(selected);
    e.target.value = "";
  };

  const handleEncryptAll = async () => {
    if (files.length === 0) return;
    try {
      setLoading("Encrypting files...");
      const keys: string[] = [];
      const blobs: Blob[] = [];
      const hashes: `0x${string}`[] = [];

      for (let i = 0; i < files.length; i++) {
        setEncryptingIndex(i);
        const { cryptoKey, hexKey } = await generateEncryptionKey();
        keys.push(hexKey);
        const encrypted = await encryptFile(files[i], cryptoKey);
        blobs.push(encrypted);
        const hash = await hashFile(files[i]);
        hashes.push(hash);
      }

      setEncryptionKeys(keys);
      setEncryptedBlobs(blobs);
      setFileHashes(hashes);
      setEncryptingIndex(-1);
      setLoading("");
    } catch {
      setError("Encryption failed");
      setLoading("");
      setEncryptingIndex(-1);
    }
  };

  const handleUploadIPFS = async () => {
    if (encryptedBlobs.length === 0) return;
    try {
      setLoading("Uploading to IPFS...");
      const cids: string[] = [];

      for (let i = 0; i < encryptedBlobs.length; i++) {
        const cid = await uploadToIPFS(encryptedBlobs[i], files[i].name);
        cids.push(cid);
      }

      setIPFSCIDs(cids);
      setLoading("");
    } catch {
      setError("IPFS upload failed");
      setLoading("");
    }
  };

  const handleRegister = async () => {
    if (ipfsCIDs.length === 0 || fileHashes.length === 0 || !title) return;
    try {
      setLoading("Registering on blockchain...");

      const metadata = {
        name: title,
        description: description || "Tamper-proof evidence record.",
        attributes: [
          { trait_type: "File Count", value: files.length.toString() },
          { trait_type: "Upload Timestamp", value: new Date().toISOString() },
          { trait_type: "ZK Verified", value: isImmediate ? "No (Immediate)" : "Yes" },
          { trait_type: "Disclosure Status", value: isImmediate ? "Public" : "Private" },
        ],
      };

      const metadataCID = await uploadJSONToIPFS(metadata);
      const uri = `ipfs://${metadataCID}`;
      setMetadataURI(uri);

      const proof = zkProof as any;

      const txHash = await registerEvidence({
        fileHashes,
        ipfsCIDs,
        metadataURI: uri,
        inactivityPeriod: BigInt(inactivityPeriod),
        zkRoot: BigInt(proof?.merkle_root || 0),
        nullifierHash: BigInt(proof?.nullifier_hash || 0),
        zkProof: [
          BigInt(proof?.proof_a?.[0] || 0),
          BigInt(proof?.proof_a?.[1] || 0),
          BigInt(proof?.proof_b?.[0]?.[0] || 0),
          BigInt(proof?.proof_b?.[0]?.[1] || 0),
          BigInt(proof?.proof_b?.[1]?.[0] || 0),
          BigInt(proof?.proof_b?.[1]?.[1] || 0),
          BigInt(proof?.proof_c?.[0] || 0),
          BigInt(proof?.proof_c?.[1] || 0),
        ],
        title,
        description,
        isImmediate,
      });

      setLoading("");
      onSuccess?.({ txHash, recordId: "0", nftTokenId: "0" });
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading("");
    }
  };

  const allEncrypted = encryptionKeys.length === files.length && files.length > 0;
  const allUploaded = ipfsCIDs.length === files.length && files.length > 0;

  return (
    <div className="flex flex-col gap-4 w-full max-w-md">
      <div>
        <input
          type="file"
          multiple
          accept="image/*,video/*,audio/*,application/pdf,text/plain"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
        />
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {files.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-3">
          <p className="text-sm text-gray-400 mb-2">{files.length} file(s) selected:</p>
          <ul className="space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex justify-between items-center text-xs text-gray-300">
                <span className="truncate flex-1">{f.name} ({(f.size / 1024).toFixed(1)} KB)</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-red-400 hover:text-red-300 ml-2"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <label className="text-sm text-gray-400 block mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Evidence title..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
      </div>

      <div>
        <label className="text-sm text-gray-400 block mb-1">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description of this evidence..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="immediate"
          checked={isImmediate}
          onChange={e => setIsImmediate(e.target.checked)}
          className="w-4 h-4 accent-indigo-600"
        />
        <label htmlFor="immediate" className="text-sm text-gray-300">
          Make public immediately (skip ZK verification)
        </label>
      </div>

      {files.length > 0 && encryptionKeys.length === 0 && (
        <button
          onClick={handleEncryptAll}
          disabled={!!loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading && encryptingIndex >= 0 ? `Encrypting ${encryptingIndex + 1}/${files.length}...` : "Encrypt All Files"}
        </button>
      )}

      {allEncrypted && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-yellow-500 text-sm font-bold mb-2">⚠️ Save these keys! They cannot be recovered.</p>
          <div className="space-y-2">
            {encryptionKeys.map((key, i) => (
              <div key={i}>
                <p className="text-xs text-gray-500">{files[i]?.name}</p>
                <code className="text-green-400 text-xs break-all">{key}</code>
              </div>
            ))}
          </div>
        </div>
      )}

      {allEncrypted && !allUploaded && (
        <button
          onClick={handleUploadIPFS}
          disabled={!!loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          Upload to IPFS
        </button>
      )}

      {allUploaded && (
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">IPFS CIDs:</p>
          {ipfsCIDs.map((cid, i) => (
            <code key={i} className="text-green-400 text-xs block break-all">{cid}</code>
          ))}
        </div>
      )}

      {allUploaded && (
        <button
          onClick={handleRegister}
          disabled={!!loading || !title}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {isImmediate ? "Publish Publicly" : "Register on Blockchain"}
        </button>
      )}

      {loading && encryptingIndex < 0 && (
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          <span className="text-gray-400">{loading}</span>
        </div>
      )}
    </div>
  );
}
