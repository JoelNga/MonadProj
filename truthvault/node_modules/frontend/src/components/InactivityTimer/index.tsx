"use client";

import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";

const unitOptions = [
  { label: "Seconds", multiplier: 1, max: 31536000 },
  { label: "Minutes", multiplier: 60, max: 525600 },
  { label: "Hours", multiplier: 3600, max: 8760 },
  { label: "Days", multiplier: 86400, max: 365 },
  { label: "Months", multiplier: 2592000, max: 12 },
] as const;

export function InactivityTimer() {
  const { inactivityPeriod, setInactivityPeriod, isImmediate } = useAppStore();
  const [value, setValue] = useState("1");
  const [unit, setUnit] = useState<"Seconds" | "Minutes" | "Hours" | "Days" | "Months">("Days");

  const currentUnit = unitOptions.find(u => u.label === unit)!;
  const seconds = Math.floor(Number(value) * currentUnit.multiplier);
  const maxSeconds = 365 * 24 * 60 * 60;
  const isValid = seconds > 0 && seconds <= maxSeconds && !isNaN(seconds);

  const handleApply = () => {
    if (isValid) {
      setInactivityPeriod(seconds);
    }
  };

  const disclosureDate = new Date(Date.now() + inactivityPeriod * 1000);

  if (isImmediate) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <p className="text-indigo-400 text-sm font-medium">Evidence will be public immediately upon registration.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          max={currentUnit.max}
          value={value}
          onChange={e => setValue(e.target.value)}
          className="w-24 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <select
          value={unit}
          onChange={e => setUnit(e.target.value as typeof unit)}
          className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        >
          {unitOptions.map(opt => (
            <option key={opt.label} value={opt.label}>{opt.label}</option>
          ))}
        </select>
        <button
          onClick={handleApply}
          disabled={!isValid}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm"
        >
          Apply
        </button>
      </div>

      <p className="text-gray-400 text-sm">
        Current: <span className="text-white">{inactivityPeriod >= 86400 ? `${(inactivityPeriod / 86400).toFixed(1)} days` : `${inactivityPeriod} seconds`}</span>
      </p>

      <p className="text-yellow-500 text-sm">
        If you become inactive, your evidence will become public on approximately{" "}
        {disclosureDate.toLocaleDateString()}.
      </p>
    </div>
  );
}
