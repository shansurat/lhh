"use client";

import { Search, X, CheckCircle2, MapPin, Star } from "lucide-react";

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

type MobileSearchOverlayProps = {
  isOpen: boolean;
  searchQuery: string;
  filteredLibraries: LibraryStop[];
  visited: Set<number>;
  onSearchQueryChange: (value: string) => void;
  onClose: () => void;
  onLibrarySelect: (library: LibraryStop) => void;
};

export default function MobileSearchOverlay({
  isOpen,
  searchQuery,
  filteredLibraries,
  visited,
  onSearchQueryChange,
  onClose,
  onLibrarySelect,
}: MobileSearchOverlayProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="lg:hidden fixed inset-0 z-1200 bg-black/25">
      <div className="absolute inset-x-3 top-[calc(env(safe-area-inset-top)+0.75rem)] bottom-3 bg-white rounded-xl border border-slate-200 shadow-xl flex flex-col overflow-hidden">
        <div className="p-2 border-b border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                autoFocus
                type="text"
                placeholder="Search libraries..."
                className="w-full h-10 pl-10 bg-slate-50 rounded-lg text-xs focus:bg-white outline-none"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search"
              className="h-10 w-10  text-slate-500 flex items-center justify-center"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div className="no-scrollbar flex-1 overflow-y-auto px-3">
          <ul>
            {filteredLibraries.map((lib) => (
              <li
                key={`mobile-search-${lib.id}`}
                className="border-b-[0.5px] border-slate-200/60 last:border-b-0"
              >
                <div
                  onClick={() => {
                    onClose();
                    onLibrarySelect(lib);
                  }}
                  className="w-full text-left py-3.5 flex items-start gap-2.5 active:opacity-80"
                >
                  <div
                    className={`mt-0.5 size-8 rounded-lg flex items-center justify-center shadow-sm shrink-0 ${
                      visited.has(lib.id)
                        ? "bg-[#014421] text-white"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {visited.has(lib.id) ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <MapPin className="size-4" />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h3 className="font-bold text-[13px] truncate text-slate-800">
                        {lib.name}
                      </h3>
                      {lib.hasStamp && (
                        <Star className="size-3.5 text-[#f1c40f] fill-current shrink-0" />
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 truncate">
                      {lib.college}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {filteredLibraries.length === 0 && (
            <p className="text-xs text-slate-500 text-center py-4">
              No matching libraries found.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
