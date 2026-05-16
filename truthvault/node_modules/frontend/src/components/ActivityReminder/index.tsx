"use client";

import { useAppStore } from "@/store/useAppStore";
import { confirmActivity } from "@/lib/contracts";

export function ActivityReminder() {
  const { records, setRecords } = useAppStore();

  const now = Math.floor(Date.now() / 1000);
  const atRisk = records.filter(r => {
    const deadline = Number(r.lastActiveAt) + Number(r.inactivityPeriod);
    return !r.isPublic && now > deadline - 7 * 24 * 60 * 60;
  });

  if (atRisk.length === 0) return null;

  const handleConfirm = async (recordId: bigint) => {
    try {
      await confirmActivity(recordId);
      setRecords(records.map(r => 
        r.nftTokenId === recordId 
          ? { ...r, lastActiveAt: BigInt(now) }
          : r
      ));
    } catch (err) {
      console.error("Failed to confirm activity:", err);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {atRisk.map((record, i) => (
        <div key={i} className="bg-yellow-900/50 border border-yellow-600 p-4 rounded-lg">
          <p className="text-yellow-500 font-medium">
            ⚠️ Evidence #{i} becomes public in less than 7 days. Confirm activity to reset the timer.
          </p>
          <button
            onClick={() => handleConfirm(record.nftTokenId)}
            className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Confirm Activity
          </button>
        </div>
      ))}
    </div>
  );
}