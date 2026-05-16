"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ActivityReminder } from "@/components/ActivityReminder";
import { useAppStore, EvidenceRecord } from "@/store/useAppStore";
import { publicClient, VAULT_ADDRESS, vaultAbi, checkAndTrigger, delay } from "@/lib/contracts";
import { ipfsGatewayUrl } from "@/lib/ipfs";

export default function DashboardPage() {
  const { records, setRecords } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<number | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        await delay(1000);
        const count = await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: vaultAbi,
          functionName: "recordCount",
        }) as bigint;

        const total = Number(count);
        if (total === 0) {
          setRecords([]);
          setLoading(false);
          return;
        }

        const fetchedRecords: EvidenceRecord[] = [];
        for (let i = 0; i < total; i++) {
          await delay(800);
          const record = await publicClient.readContract({
            address: VAULT_ADDRESS,
            abi: vaultAbi,
            functionName: "records",
            args: [BigInt(i)],
          }) as any;

          await delay(800);
          const fileCount = await publicClient.readContract({
            address: VAULT_ADDRESS,
            abi: vaultAbi,
            functionName: "getFileCount",
            args: [BigInt(i)],
          }) as bigint;

          const ipfsCIDs: string[] = [];
          for (let j = 0; j < Number(fileCount); j++) {
            await delay(800);
            const cid = await publicClient.readContract({
              address: VAULT_ADDRESS,
              abi: vaultAbi,
              functionName: "recordIpfsCIDs",
              args: [BigInt(i), BigInt(j)],
            }) as string;
            ipfsCIDs.push(cid);
          }

          fetchedRecords.push({
            fileHashes: [],
            ipfsCIDs,
            timestamp: record[0],
            owner: record[1],
            metadataURI: record[2],
            zkVerified: record[3],
            lastActiveAt: record[4],
            inactivityPeriod: record[5],
            isPublic: record[6],
            nftTokenId: record[7],
            title: record[8],
            description: record[9],
            isImmediate: record[10],
          });
        }

        setRecords(fetchedRecords);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      } finally {
        setLoading(false);
      }
    };

    if (VAULT_ADDRESS && VAULT_ADDRESS !== "0x") {
      fetchRecords();
    }
  }, [setRecords]);

  const handleTriggerDisclosure = async (recordId: number) => {
    try {
      setTriggering(recordId);
      await checkAndTrigger(BigInt(recordId));
      await delay(2000);
      const record = await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: vaultAbi,
        functionName: "records",
        args: [BigInt(recordId)],
      }) as any;

      const updated = records.map((r, idx) =>
        idx === recordId ? { ...r, isPublic: Boolean(record[6]) } : r
      );
      setRecords(updated);
    } catch (err) {
      console.error("Failed to trigger disclosure:", err);
    } finally {
      setTriggering(null);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-2">Evidence Dashboard</h1>
      <p className="text-gray-400 mb-8">Manage your evidence records</p>

      <ActivityReminder />

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400 mt-8">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          Loading...
        </div>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-center mt-8">No evidence records found.</p>
      ) : (
        <div className="grid gap-4 w-full max-w-2xl mt-8">
          {records.map((record, i) => (
            <div key={i} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold">{record.title || `Evidence #${i}`}</h3>
                  {record.description && (
                    <p className="text-gray-400 text-sm mt-1">{record.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs ${record.isPublic ? (record.isImmediate ? "bg-purple-600" : "bg-red-600") : "bg-green-600"}`}>
                  {record.isPublic ? (record.isImmediate ? "Public" : "Disclosed") : "Private"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-gray-400">Files</p>
                  <p>{record.ipfsCIDs?.length || 0} file(s)</p>
                </div>

                <div>
                  <p className="text-gray-400">Upload Date</p>
                  <p>{new Date(Number(record.timestamp) * 1000).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-gray-400">Inactivity Period</p>
                  <p>{record.isImmediate ? "N/A" : `${Number(record.inactivityPeriod)} seconds`}</p>
                </div>

                <div>
                  <p className="text-gray-400">NFT Token ID</p>
                  <p>#{record.nftTokenId.toString()}</p>
                </div>
              </div>

              {!record.isPublic && !record.isImmediate && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => handleTriggerDisclosure(i)}
                    disabled={triggering === i}
                    className="px-3 py-1 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 text-sm"
                  >
                    {triggering === i ? "Triggering..." : "Trigger Disclosure"}
                  </button>
                  <p className="text-gray-500 text-xs">
                    Eligible after inactivity period elapses
                  </p>
                </div>
              )}

              {record.ipfsCIDs && record.ipfsCIDs.length > 0 && (
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">Files:</p>
                  <div className="flex flex-wrap gap-2">
                    {record.ipfsCIDs.map((cid, j) => (
                      <a
                        key={j}
                        href={ipfsGatewayUrl(cid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-gray-800 rounded-lg text-xs text-green-400 hover:bg-gray-700 transition-colors"
                      >
                        File {j + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <Link href="/upload" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Upload New Evidence
        </Link>
        <Link href="/public" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
          View Public Evidence
        </Link>
      </div>

      <Link href="/" className="mt-4 text-gray-400 hover:text-white">
        ← Back to Home
      </Link>
    </main>
  );
}
