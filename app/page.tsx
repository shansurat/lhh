"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  MapPin,
  Star,
  Search,
  X,
  CheckCircle2,
  Ticket,
  Eye,
  Menu,
} from "lucide-react";
import dynamic from "next/dynamic";
import libraryHopListData from "./library-hop-list.json";
import PwaInstallButton from "./components/PwaInstallButton";

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
  const [showStampPinsOnly, setShowStampPinsOnly] = useState(true);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [keyboardInset, setKeyboardInset] = useState(0);
  const [headerHeight, setHeaderHeight] = useState(88);
  const [selectionSource, setSelectionSource] = useState<"list" | "map" | null>(
    null,
  );
  const headerRef = useRef<HTMLElement | null>(null);

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

    const updateHeaderHeight = () => {
      const measured = headerRef.current?.offsetHeight;
      if (measured && measured > 0) {
        setHeaderHeight(measured);
      }
    };

    updateHeaderHeight();
    window.addEventListener("resize", updateHeaderHeight);

    let observer: ResizeObserver | null = null;
    if (headerRef.current && "ResizeObserver" in window) {
      observer = new ResizeObserver(updateHeaderHeight);
      observer.observe(headerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateHeaderHeight);
      observer?.disconnect();
    };
  }, []);

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

  return (
    <div className="flex flex-col h-dvh min-h-dvh bg-[#fdfaf6] text-slate-900 overflow-hidden font-serif">
      <style>{`
        .leaflet-container { font-family: inherit; cursor: crosshair; background: #fdfaf6; }
        .custom-div-icon { background: transparent; border: none; }
        @keyframes softFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes softSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fabPopIn {
          from { opacity: 0; transform: translateY(8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-soft-fade { animation: softFadeIn 220ms ease-out both; }
        .animate-soft-slide-up { animation: softSlideUp 260ms ease-out both; }
        .animate-fab-pop { animation: fabPopIn 220ms ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .animate-soft-fade,
          .animate-soft-slide-up,
          .animate-fab-pop {
            animation: none;
          }
        }
      `}</style>

      {/* Header */}
      <header
        ref={headerRef}
        className="bg-[#7b1113] border-b-4 border-[#014421] px-3 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sticky top-0 z-1100 flex items-center justify-between shadow-xl animate-soft-fade"
      >
        <div className="flex items-center gap-3">
          <div className="font-sans">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white uppercase leading-none">
              Library Hop <span className="text-[#f1c40f]">Checklist</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.16em] text-[#bdc3c7]">
              Unofficial assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/20">
          <PwaInstallButton />
          <button
            type="button"
            onClick={() => setShowStampPinsOnly((prev) => !prev)}
            aria-label="Toggle stamp-only libraries"
            title="Toggle stamp-only libraries"
            className={`h-7 w-7 shrink-0 flex items-center justify-center rounded-md border transition-colors ${showStampPinsOnly ? "border-[#f1c40f] text-[#f1c40f] bg-white/10" : "border-white/30 text-white/70 hover:text-white"}`}
          >
            <Star className={`size-4 ${showStampPinsOnly ? "fill-current" : ""}`} />
          </button>
          <div className="hidden xs:block size-2 bg-[#014421] rounded-full animate-pulse" />
          <span className="text-[11px] sm:text-xs font-bold text-white font-sans">
            {collectedStamps}/{totalStamps} Stamps
          </span>
        </div>
      </header>

      <div className="flex flex-1 relative overflow-hidden">
        {/* Sidebar - Visible on Desktop, Toggleable on Mobile */}
        <aside
          style={
            isSidebarOpen && keyboardInset > 0
              ? {
                  bottom: `${keyboardInset}px`,
                  maxHeight: `calc(100dvh - ${headerHeight + keyboardInset + 4}px)`,
                }
              : undefined
          }
          className={`
          fixed lg:relative left-0 right-0 bottom-0 top-auto h-[58vh] lg:h-full lg:inset-y-0 lg:top-0 lg:bottom-auto lg:right-auto w-full lg:w-72 sm:lg:w-80 bg-white z-1050 transition-[transform,bottom] duration-300 ease-in-out border-t lg:border-t-0 border-slate-200 lg:border-r rounded-t-2xl lg:rounded-none shadow-2xl lg:shadow-none flex flex-col font-sans pb-[env(safe-area-inset-bottom)]
          lg:translate-x-0 lg:opacity-100 lg:pointer-events-auto
          ${isSidebarOpen && !selectedLibrary ? "translate-y-0 pointer-events-auto animate-soft-slide-up" : "translate-y-full pointer-events-none"}
          ${isSidebarOpen && keyboardInset > 0 ? "h-[72dvh]" : "h-[58vh]"}
          lg:translate-y-0
        `}
        >
          <div className="p-3 border-b border-slate-200 bg-white sticky top-0 z-10">
            <div className="lg:hidden flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Libraries
              </p>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 group-focus-within:text-[#7b1113] transition-colors" />
              <input
                type="text"
                placeholder="Search libraries..."
                className="w-full h-10 pl-10 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:border-[#7b1113] focus:bg-white transition-all outline-none shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5 pb-4 animate-soft-fade">
            {filteredLibraries.map((lib) => (
              <button
                key={lib.id}
                onClick={() => handleLibraryClick(lib, "list")}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ease-out hover:-translate-y-px flex items-start gap-3 border group ${
                  selectedLibrary?.id === lib.id
                    ? "bg-[#7b1113]/5 border-[#7b1113]"
                    : "bg-white border-transparent hover:border-slate-100 hover:bg-slate-50"
                }`}
              >
                <div
                  className={`mt-0.5 size-8 rounded-lg flex items-center justify-center transition-colors shadow-sm shrink-0 ${
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
                      className={`font-bold text-[13px] transition-colors truncate ${selectedLibrary?.id === lib.id ? "text-[#7b1113]" : "text-slate-800"}`}
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
        </aside>

        {/* Map Area */}
        <main className="flex-1 relative">
          <LibraryMap
            libraries={LIBRARY_HOP_LIST}
            selectedLibrary={selectedLibrary}
            isSidebarOpen={isSidebarOpen}
            showStampPinsOnly={showStampPinsOnly}
            visitedIds={Array.from(visited)}
            onLibraryClick={(lib) => handleLibraryClick(lib, "map")}
          />

          {!selectedLibrary && (
            <button
              onClick={() => setIsSidebarOpen((prev) => !prev)}
              className="lg:hidden absolute right-4 bottom-[calc(env(safe-area-inset-bottom)+1rem)] z-1100 h-12 w-12 rounded-full bg-[#7b1113] text-white shadow-xl border border-white/30 flex items-center justify-center transition-transform duration-200 active:scale-95 hover:scale-105 animate-fab-pop"
              aria-label="Toggle library list"
              title="Toggle library list"
            >
              {isSidebarOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          )}

          {/* Stop Detail Overlay */}
          {selectedLibrary && (
            <div className="absolute bottom-4 inset-x-3 lg:left-auto lg:right-4 lg:w-96 bg-white p-4 rounded-xl shadow-[0_30px_60px_-12px_rgba(123,17,19,0.3)] z-1001 border-t-4 border-[#7b1113] animate-soft-slide-up">
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
                  onClick={() => {
                    setSelectedLibrary(null);
                    setSelectionSource(null);
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      setIsSidebarOpen(selectionSource === "list");
                    }
                  }}
                  className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400"
                >
                  <X className="size-4" />
                </button>
              </div>

              <h3 className="font-bold text-lg sm:text-xl text-[#7b1113] leading-tight mb-1 serif">
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
                  className={`flex-1 py-3 rounded-lg text-xs font-black flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md ${
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
          className="h-full bg-[#014421] transition-all duration-700 ease-out"
          style={{
            width: `${(visited.size / LIBRARY_HOP_LIST.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
}
