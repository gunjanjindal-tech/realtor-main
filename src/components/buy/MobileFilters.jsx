"use client";

import { X } from "lucide-react";
import BuyFilters from "./BuyFilters";

export default function MobileFilters({ open, onClose }) {
  if (!open) return null;

  return (
    <>
      {/* OVERLAY */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40"
      />

      {/* PANEL */}
      <div className="fixed right-0 top-0 h-full w-[90%] max-w-[420px] bg-white z-50 px-6 py-6 overflow-y-auto">
        
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#091D35]">
            Filters
          </h2>
          <button onClick={onClose}>
            <X />
          </button>
        </div>

        <BuyFilters />
      </div>
    </>
  );
}
