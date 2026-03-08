"use client";

import { Search, Info, Settings } from "lucide-react";

type MobileHeaderProps = {
  onOpenSearch: () => void;
};

export default function MobileHeader({ onOpenSearch }: MobileHeaderProps) {
  return (
    <div
      style={{ top: "calc(env(safe-area-inset-top) + 0.75rem)" }}
      className="lg:hidden absolute left-3 right-3 z-1100 bg-white/95 border border-slate-200 rounded-xl px-3 py-2.5 shadow-lg backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-base tracking-tight text-[#7b1113] leading-none font-heading">
            <b>IskoLib</b>Map
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            aria-label="About"
            title="About"
            className="h-8 w-8 text-slate-600 flex items-center justify-center"
          >
            <Info className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Settings"
            title="Settings"
            className="h-8 w-8 text-slate-600 flex items-center justify-center"
          >
            <Settings className="size-4" />
          </button>
          <button
            type="button"
            onClick={onOpenSearch}
            aria-label="Open search"
            title="Search libraries"
            className="h-8 w-8 text-slate-600 flex items-center justify-center"
          >
            <Search className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
