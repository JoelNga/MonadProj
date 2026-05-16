"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ActivityReminder } from "@/components/ActivityReminder";
import { useAppStore, EvidenceRecord } from "@/store/useAppStore";
import { publicClient, VAULT_ADDRESS, vaultAbi } from "@/lib/contracts";

export default function DashboardPage() {
  const { records, setRecords } = useAppStore();

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const count = await publicClient.readContract({
          address: VAULT_ADDRESS,
          abi: vaultAbi,
          functionName: "recordCount",
        }) as bigint;

        const fetchedRecords: EvidenceRecord[] = [];
        for (let i = 0; i < Number(count); i++) {
          const record = await publicClient.readContract({
            address: VAULT_ADDRESS,
            abi: vaultAbi,
            functionName: "records",
            args: [BigInt(i)],
          }) as any;
          
          fetchedRecords.push({
            fileHash: record[0],
            ipfsCID: record[1],
            timestamp: record[2],
            owner: record[3],
            metadataURI: record[4],
            zkVerified: record[5],
            lastActiveAt: record[6],
            inactivityPeriod: record[7],
            isPublic: record[8],
            nftTokenId: record[9],
          });
        }
        
        setRecords(fetchedRecords);
      } catch (err) {
        console.error("Failed to fetch records:", err);
      }
    };

    if (VAULT_ADDRESS && VAULT_ADDRESS !== "0x") {
      fetchRecords();
    }
  }, [setRecords]);

  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Evidence Dashboard</h1>

      <ActivityReminder />

      <div className="grid gap-4 w-full max-w-2xl mt-8">
        {records.length === 0 ? (
          <p className="text-gray-400 text-center">No evidence records found.</p>
        ) : (
          records.map((record, i) => (
            <div key={i} className="bg-gray-900 p-6 rounded-lg border border-gray-800">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-semibold">Evidence #{i}</h3>
                <span className={`px-2 py-1 rounded text-xs ${record.isPublic ? "bg-red-600" : "bg-green-600"}`}>
                  {record.isPublic ? "Public" : "Private"}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400">IPFS CID</p>
                  <a 
                    href={`https://gateway.pinata.cloud/ipfs/${record.ipfsCID}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-400 hover:underline break-all"
                  >
                    {record.ipfsCID.slice(0, 20)}...
                  </a>
                </div>
                
                <div>
                  <p className="text-gray-400">Upload Date</p>
                  <p>{new Date(Number(record.timestamp) * 1000).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <p className="text-gray-400">Inactivity Period</p>
                  <p>{Number(record.inactivityPeriod) / (24 * 60 * 60)} days</p>
                </div>
                
                <div>
                  <p className="text-gray-400">NFT Token ID</p>
                  <p>#{record.nftTokenId.toString()}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Link 
        href="/upload"
        className="mt-8 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
      >
        Upload New Evidence
      </Link>

      <Link href="/" className="mt-4 text-gray-400 hover:text-white">
        ← Back to Home
      </Link>
    </main>
  );
}