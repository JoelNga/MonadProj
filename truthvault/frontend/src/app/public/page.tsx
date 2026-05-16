"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { publicClient, VAULT_ADDRESS, vaultAbi } from "@/lib/contracts";
import { ipfsGatewayUrl } from "@/lib/ipfs";

interface PublicRecord {
  id: number;
  title: string;
  description: string;
  ipfsCIDs: string[];
  timestamp: bigint;
  owner: string;
  isImmediate: boolean;
  inactivityPeriod: bigint;
  zkVerified: boolean;
  nftTokenId: bigint;
}

export default function PublicPage() {
  const [records, setRecords] = useState<PublicRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPublicRecords = async () => {
      try {
        const count = await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: vaultAbi,
          functionName: "recordCount",
        }) as bigint;

        const fetched: PublicRecord[] = [];
        for (let i = 0; i < Number(count); i++) {
          const record = await publicClient.readContract({
            address: VAULT_ADDRESS,
            abi: vaultAbi,
            functionName: "records",
            args: [BigInt(i)],
          }) as any;

          if (record[6]) {
            const fileCount = await publicClient.readContract({
              address: VAULT_ADDRESS,
              abi: vaultAbi,
              functionName: "getFileCount",
              args: [BigInt(i)],
            }) as bigint;

            const ipfsCIDs: string[] = [];
            for (let j = 0; j < Number(fileCount); j++) {
              const cid = await publicClient.readContract({
                address: VAULT_ADDRESS,
                abi: vaultAbi,
                functionName: "recordIpfsCIDs",
                args: [BigInt(i), BigInt(j)],
              }) as string;
              ipfsCIDs.push(cid);
            }

            fetched.push({
              id: i,
              title: record[8],
              description: record[9],
              ipfsCIDs,
              timestamp: record[0],
              owner: record[1],
              isImmediate: record[10],
              inactivityPeriod: record[5],
              zkVerified: record[3],
              nftTokenId: record[7],
            });
          }

          if (i < Number(count) - 1) {
            await new Promise(r => setTimeout(r, 500));
          }
        }

        setRecords(fetched.reverse());
      } catch (err) {
        console.error("Failed to fetch public records:", err);
      } finally {
        setLoading(false);
      }
    };

    if (VAULT_ADDRESS && VAULT_ADDRESS !== "0x") {
      fetchPublicRecords();
    }
  }, []);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-2">Public Evidence</h1>
      <p className="text-gray-400 mb-8">Evidence that has been disclosed publicly</p>

      {loading ? (
        <div className="flex items-center gap-2 text-gray-400">
          <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
          Loading...
        </div>
      ) : records.length === 0 ? (
        <p className="text-gray-400 text-center">No public evidence yet.</p>
      ) : (
        <div className="grid gap-4 w-full max-w-2xl">
          {records.map(record => (
            <div key={record.id} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-xl font-semibold">{record.title}</h3>
                  {record.description && (
                    <p className="text-gray-400 text-sm mt-1">{record.description}</p>
                  )}
                </div>
                <span className={`px-2 py-1 rounded text-xs ${record.isImmediate ? "bg-purple-600" : "bg-red-600"}`}>
                  {record.isImmediate ? "Immediate" : "Disclosed"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mt-4">
                <div>
                  <p className="text-gray-400">Files</p>
                  <p>{record.ipfsCIDs.length} file(s)</p>
                </div>

                <div>
                  <p className="text-gray-400">Upload Date</p>
                  <p>{new Date(Number(record.timestamp) * 1000).toLocaleDateString()}</p>
                </div>

                <div>
                  <p className="text-gray-400">Owner</p>
                  <p className="font-mono text-xs">{record.owner.slice(0, 10)}...{record.owner.slice(-8)}</p>
                </div>

                <div>
                  <p className="text-gray-400">NFT Token ID</p>
                  <p>#{record.nftTokenId.toString()}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-gray-400 text-sm mb-2">Files:</p>
                <div className="flex flex-wrap gap-2">
                  {record.ipfsCIDs.map((cid, i) => (
                    <a
                      key={i}
                      href={ipfsGatewayUrl(cid)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-gray-800 rounded-lg text-xs text-green-400 hover:bg-gray-700 transition-colors"
                    >
                      File {i + 1}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-4 mt-8">
        <Link href="/upload" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Upload Evidence
        </Link>
        <Link href="/" className="px-6 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
          ← Back to Home
        </Link>
      </div>
    </main>
  );
}
