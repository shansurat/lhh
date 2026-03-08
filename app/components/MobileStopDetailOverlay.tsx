"use client";

import { X, CheckCircle2, Ticket, Eye } from "lucide-react";

type LibraryStop = {
  id: number;
  name: string;
  coords: [number, number];
  description: string;
  college: string;
  status: "Active" | "Special Stop";
  hasStamp: boolean;
  features: string[];
};

type MobileStopDetailOverlayProps = {
  selectedLibrary: LibraryStop | null;
  visited: Set<number>;
  onClose: () => void;
  onToggleVisit: (id: number) => void;
};

export default function MobileStopDetailOverlay({
  selectedLibrary,
  visited,
  onClose,
  onToggleVisit,
}: MobileStopDetailOverlayProps) {
  if (!selectedLibrary) {
    return null;
  }

  return (
    <div className="lg:hidden absolute bottom-4 inset-x-3 bg-white p-4 rounded-xl shadow-[0_30px_60px_-12px_rgba(123,17,19,0.3)] z-1001 border-t-4 border-[#7b1113]">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider font-sans ${
              selectedLibrary.status === "Active"
                ? "bg-[#014421]/10 text-[#014421]"
                : "bg-amber-100 text-amber-700"
            }`}
          >
            {selectedLibrary.status}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
        >
          <X className="size-4" />
        </button>
      </div>

      <h3 className="font-bold text-lg sm:text-xl text-[#7b1113] leading-tight mb-1 font-heading">
        {selectedLibrary.name}
      </h3>
      <p className="text-xs text-slate-600 leading-relaxed mb-4 font-sans">
        {selectedLibrary.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5 font-sans">
        {selectedLibrary.features.map((f) => (
          <span
            key={f}
            className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full"
          >
            {f}
          </span>
        ))}
      </div>

      <div className="flex gap-2 font-sans">
        <button
          onClick={() => onToggleVisit(selectedLibrary.id)}
          className={`flex-1 py-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 shadow-md ${
            visited.has(selectedLibrary.id)
              ? "bg-[#014421] text-white shadow-[#014421]/20"
              : selectedLibrary.hasStamp
                ? "bg-[#7b1113] text-white shadow-[#7b1113]/20"
                : "bg-slate-800 text-white shadow-slate-800/20"
          }`}
        >
          {visited.has(selectedLibrary.id) ? (
            <>
              <CheckCircle2 className="size-4" />{" "}
              {selectedLibrary.hasStamp ? "COLLECTED STAMP" : "VISITED"}
            </>
          ) : (
            <>
              {selectedLibrary.hasStamp ? (
                <Ticket className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
              {selectedLibrary.hasStamp ? "STAMP PASSPORT" : "MARK AS VISITED"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
