"use client";

import { useAppStore } from "@/store/useAppStore";

const periods = [
  { label: "30 days", seconds: 30 * 24 * 60 * 60 },
  { label: "60 days", seconds: 60 * 24 * 60 * 60 },
  { label: "90 days", seconds: 90 * 24 * 60 * 60 },
  { label: "180 days", seconds: 180 * 24 * 60 * 60 },
  { label: "1 year", seconds: 365 * 24 * 60 * 60 },
  { label: "2 years", seconds: 730 * 24 * 60 * 60 },
];

export function InactivityTimer() {
  const { inactivityPeriod, setInactivityPeriod } = useAppStore();

  const selectedPeriod = periods.find(p => p.seconds === inactivityPeriod) || periods[2];
  const disclosureDate = new Date(Date.now() + inactivityPeriod * 1000);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 flex-wrap">
        {periods.map(period => (
          <button
            key={period.seconds}
            onClick={() => setInactivityPeriod(period.seconds)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              inactivityPeriod === period.seconds
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>
      <p className="text-gray-400 text-sm">
        Selected: <span className="text-white">{selectedPeriod.label}</span>
      </p>
      <p className="text-yellow-500 text-sm">
        If you become inactive, your evidence will become public on approximately{" "}
        {disclosureDate.toLocaleDateString()}.
      </p>
    </div>
  );
}