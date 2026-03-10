"use client";

import { useState } from "react";
import {
  MapPin,
  Star,
  Search,
  Info,
  Settings,
  List,
  X,
  CheckCircle2,
  Ticket,
  Eye,
} from "lucide-react";
import PwaInstallButton from "./PwaInstallButton";
import AuthActionButton from "./AuthActionButton";
import ManageUsersLink from "./ManageUsersLink";
import type { Library } from "../types/library";

type SidebarProps = {
  isSidebarOpen: boolean;
  keyboardInset: number;
  selectedLibrary: Library | null;
  searchQuery: string;
  filteredLibraries: Library[];
  visited: Set<number>;
  onSearchQueryChange: (value: string) => void;
  onLibraryClick: (library: Library) => void;
  onCloseSidebar: () => void;
  onCloseSelectedLibrary: () => void;
  onToggleVisit: (id: number) => void;
};

export default function Sidebar({
  isSidebarOpen,
  keyboardInset,
  selectedLibrary,
  searchQuery,
  filteredLibraries,
  visited,
  onSearchQueryChange,
  onLibraryClick,
  onCloseSidebar,
  onCloseSelectedLibrary,
  onToggleVisit,
}: SidebarProps) {
  const [showLibraryBrowser, setShowLibraryBrowser] = useState(true);

  return (
    <aside
      style={{
        top: "calc(env(safe-area-inset-top) + 1rem)",
        ...(isSidebarOpen && keyboardInset > 0 && showLibraryBrowser
          ? {
              bottom: `${keyboardInset}px`,
              maxHeight: `calc(100dvh - ${keyboardInset + 16}px)`,
            }
          : {}),
      }}
      className={`
          hidden lg:fixed left-4 right-4 lg:right-auto lg:w-80 bg-white/95 z-1050 border border-slate-200 rounded-2xl shadow-2xl lg:flex flex-col font-sans pb-[env(safe-area-inset-bottom)] backdrop-blur-sm overflow-hidden
          ${showLibraryBrowser ? "lg:bottom-4" : "lg:bottom-auto"}
          ${isSidebarOpen && !selectedLibrary ? "translate-y-0 pointer-events-auto" : "translate-y-full pointer-events-none"}
          ${showLibraryBrowser ? (isSidebarOpen && keyboardInset > 0 ? "h-[72dvh] lg:h-auto" : "h-[58vh] lg:h-auto") : "h-auto"}
          lg:translate-y-0 lg:pointer-events-auto
        `}
    >
      <div
        className={`px-3.5 py-3 border-b border-slate-200 bg-white sticky top-0 z-10 ${selectedLibrary ? "lg:hidden" : ""}`}
      >
        <div className="mb-2.5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg tracking-tight text-[#7b1113] leading-none font-heading">
              <b>IskoLib</b>Map
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.16em] text-slate-500 mt-1.5">
              An Unofficial Guide to UP Diliman Libraries
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              aria-label={
                showLibraryBrowser
                  ? "Hide libraries and search"
                  : "Show libraries and search"
              }
              title={
                showLibraryBrowser
                  ? "Hide libraries and search"
                  : "Show libraries and search"
              }
              onClick={() => setShowLibraryBrowser((prev) => !prev)}
              className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <List className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="About"
              title="About"
              className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <Info className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Settings"
              title="Settings"
              className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            >
              <Settings className="size-3.5" />
            </button>
            <AuthActionButton
              compact
              className="h-7 w-7 shrink-0 rounded-md text-slate-500 hover:text-slate-700 hover:bg-slate-100"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 mb-2.5">
          <PwaInstallButton />
          <ManageUsersLink />
        </div>
        <div className="lg:hidden flex items-center justify-between mb-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Libraries
          </p>
          <button
            onClick={onCloseSidebar}
            className="p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="size-4" />
          </button>
        </div>
        {showLibraryBrowser && (
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-[#7b1113]" />
            <input
              type="text"
              placeholder="Search libraries..."
              className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-[#7b1113] focus:bg-white outline-none shadow-sm"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {showLibraryBrowser && (
        <div
          className={`minimal-scrollbar flex-1 overflow-y-auto px-3 py-3 space-y-2 pb-5 ${selectedLibrary ? "lg:hidden" : ""}`}
        >
          {filteredLibraries.map((lib) => (
            <button
              key={lib.id}
              onClick={() => onLibraryClick(lib)}
              className={`w-full text-left p-2.5 rounded-lg flex items-start gap-2.5 border group ${
                selectedLibrary?.id === lib.id
                  ? "bg-[#7b1113]/5 border-[#7b1113]"
                  : "bg-white border-transparent hover:border-slate-100 hover:bg-slate-50"
              }`}
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
                  <h3
                    className={`font-bold text-[13px] truncate ${selectedLibrary?.id === lib.id ? "text-[#7b1113]" : "text-slate-800"}`}
                  >
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
            </button>
          ))}
        </div>
      )}

      {selectedLibrary && (
        <div className="hidden lg:flex flex-1 flex-col minimal-scrollbar overflow-y-auto p-4">
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
              onClick={onCloseSelectedLibrary}
              className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X className="size-4" />
            </button>
          </div>

          <h3 className="font-bold text-lg text-[#7b1113] leading-tight mb-1.5 font-heading">
            {selectedLibrary.name}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed mb-4 font-sans">
            {selectedLibrary.description}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-4 font-sans">
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
                  {selectedLibrary.hasStamp
                    ? "STAMP PASSPORT"
                    : "MARK AS VISITED"}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}