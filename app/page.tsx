"use client";

import React, { useState, useEffect } from "react";
import {
  MapPin,
  Star,
  Search,
  X,
  CheckCircle2,
  Ticket,
  Eye,
} from "lucide-react";
import dynamic from "next/dynamic";
import libraryHopListData from "./library-hop-list.json";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";

const LibraryMap = dynamic(() => import("./components/LibraryMap"), {
  ssr: false,
});

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

const LIBRARY_HOP_LIST: LibraryStop[] = libraryHopListData as LibraryStop[];
const VISITED_STORAGE_KEY = "library-hop-visited-stamps";

export default function App() {
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryStop | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [showStampPinsOnly, setShowStampPinsOnly] = useState(true);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [selectionSource, setSelectionSource] = useState<"list" | "map" | null>(
    null,
  );

  const totalStamps = LIBRARY_HOP_LIST.filter((l) => l.hasStamp).length;
  const collectedStamps = Array.from(visited).filter((id) => {
    const lib = LIBRARY_HOP_LIST.find((l) => l.id === id);
    return lib && lib.hasStamp;
  }).length;

  const filteredLibraries = LIBRARY_HOP_LIST.filter(
    (lib) =>
      (lib.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lib.college.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!showStampPinsOnly || lib.hasStamp),
  );

  const handleLibraryClick = (lib: LibraryStop, source: "list" | "map") => {
    setSelectedLibrary(lib);
    setSelectionSource(source);
    // Auto-close sidebar on mobile after selection
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const syncSidebarForViewport = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      }
    };

    syncSidebarForViewport();
    window.addEventListener("resize", syncSidebarForViewport);

    return () => {
      window.removeEventListener("resize", syncSidebarForViewport);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const raw = window.localStorage.getItem(VISITED_STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const numericIds = parsed.filter(
          (value): value is number => typeof value === "number",
        );
        setVisited(new Set(numericIds));
      }
    } catch {
      window.localStorage.removeItem(VISITED_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      VISITED_STORAGE_KEY,
      JSON.stringify(Array.from(visited)),
    );
  }, [visited]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateKeyboardInset = () => {
      if (window.innerWidth >= 1024) {
        setKeyboardInset(0);
        return;
      }

      const inset = Math.max(
        0,
        window.innerHeight - viewport.height - viewport.offsetTop,
      );
      setKeyboardInset(inset);
    };

    updateKeyboardInset();
    viewport.addEventListener("resize", updateKeyboardInset);
    viewport.addEventListener("scroll", updateKeyboardInset);
    window.addEventListener("orientationchange", updateKeyboardInset);

    return () => {
      viewport.removeEventListener("resize", updateKeyboardInset);
      viewport.removeEventListener("scroll", updateKeyboardInset);
      window.removeEventListener("orientationchange", updateKeyboardInset);
    };
  }, []);

  const toggleVisit = (id: number) => {
    const next = new Set(visited);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisited(next);
  };

  const closeSelectedLibrary = () => {
    setSelectedLibrary(null);
    setSelectionSource(null);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setIsSidebarOpen(selectionSource === "list");
    }
  };

  return (
    <div className="relative h-dvh min-h-dvh bg-[#fdfaf6] text-slate-900 overflow-hidden">
      <style>{`
        .leaflet-container { font-family: inherit; cursor: crosshair; background: #fdfaf6; }
        .custom-div-icon { background: transparent; border: none; }
        .minimal-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: transparent transparent;
        }
        .minimal-scrollbar:hover {
          scrollbar-color: rgba(100, 116, 139, 0.45) transparent;
        }
        .minimal-scrollbar::-webkit-scrollbar {
          width: 7px;
        }
        .minimal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .minimal-scrollbar::-webkit-scrollbar-thumb {
          background: transparent;
          border-radius: 9999px;
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .minimal-scrollbar:hover::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.4);
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .minimal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.55);
          border: 2px solid transparent;
          background-clip: content-box;
        }
        .no-scrollbar {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          width: 0;
          height: 0;
        }
        @media (max-width: 1023px) {
          .fab-raised-mobile {
            bottom: calc(env(safe-area-inset-bottom) + 20rem) !important;
          }
        }
      `}</style>

      <div className="relative h-dvh w-dvw">
        <Sidebar
          isSidebarOpen={isSidebarOpen}
          keyboardInset={keyboardInset}
          selectedLibrary={selectedLibrary}
          searchQuery={searchQuery}
          filteredLibraries={filteredLibraries}
          visited={visited}
          onSearchQueryChange={setSearchQuery}
          onLibraryClick={(lib) => handleLibraryClick(lib, "list")}
          onCloseSidebar={() => setIsSidebarOpen(false)}
          onCloseSelectedLibrary={closeSelectedLibrary}
          onToggleVisit={toggleVisit}
        />

        {/* Map Area */}
        <main className="absolute inset-0">
          <LibraryMap
            libraries={LIBRARY_HOP_LIST}
            selectedLibrary={selectedLibrary}
            isSidebarOpen={isSidebarOpen}
            showStampPinsOnly={showStampPinsOnly}
            visitedIds={Array.from(visited)}
            onLibraryClick={(lib) => handleLibraryClick(lib, "map")}
          />

          <MobileHeader onOpenSearch={() => setIsMobileSearchOpen(true)} />

          {isMobileSearchOpen && (
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
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMobileSearchOpen(false)}
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
                            setIsMobileSearchOpen(false);
                            handleLibraryClick(lib, "map");
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
          )}

          <div
            style={{ top: "calc(env(safe-area-inset-top) + 1rem)" }}
            className="hidden lg:block absolute right-4 z-1100 bg-white/95 border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-lg backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowStampPinsOnly((prev) => !prev)}
                aria-label="Toggle stamp-only libraries"
                title="Toggle stamp-only libraries"
                className={`h-7 w-7 shrink-0 flex items-center justify-center rounded-md border ${showStampPinsOnly ? "border-[#f1c40f] text-[#f1c40f] bg-[#7b1113]/5" : "border-slate-300 text-slate-500 hover:text-slate-700"}`}
              >
                <Star
                  className={`size-3.5 ${showStampPinsOnly ? "fill-current" : ""}`}
                />
              </button>
            </div>
          </div>

          <div
            style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}
            className={`flex absolute right-3 lg:right-4 z-1100 group ${selectedLibrary ? "fab-raised-mobile" : ""}`}
          >
            <button
              type="button"
              title={`${collectedStamps}/${totalStamps} stamps collected`}
              aria-label="Collected stamps"
              className="h-14 w-14 rounded-full bg-white/95 border border-slate-200 shadow-lg backdrop-blur-sm text-slate-700 font-sans font-bold text-xs flex items-center justify-center"
            >
              <span className="flex flex-col items-center leading-none">
                <Star className="size-3.5 mb-0.5 text-[#f1c40f]" />
                <span>{collectedStamps}</span>
              </span>
            </button>
            <div className="pointer-events-none absolute right-0 bottom-16 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-[10px] font-bold text-white opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              {collectedStamps}/{totalStamps} stamps collected
            </div>
          </div>

          {/* Stop Detail Overlay */}
          {selectedLibrary && (
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
                  onClick={closeSelectedLibrary}
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
                  onClick={() => toggleVisit(selectedLibrary.id)}
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
        </main>
      </div>

      {/* Mobile Progress Bar */}
      <div className="lg:hidden h-1.5 w-full bg-slate-200">
        <div
          className="h-full bg-[#014421]"
          style={{
            width: `${(visited.size / LIBRARY_HOP_LIST.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
