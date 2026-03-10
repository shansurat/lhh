"use client";

import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import dynamic from "next/dynamic";
import libraryHopListData from "./libraries.json";
import Sidebar from "./components/Sidebar";
import MobileHeader from "./components/MobileHeader";
import MobileSearchOverlay from "./components/MobileSearchOverlay";
import MobileLibraryDetailOverlay from "./components/MobileLibraryDetailOverlay";

import type { Library } from "./types/library";

const LibraryMap = dynamic(() => import("./components/LibraryMap"), {
  ssr: false,
});

const LIBRARY_HOP_LIST: Library[] = libraryHopListData as Library[];
const VISITED_STORAGE_KEY = "library-hop-visited-stamps";

export default function App() {
  const [selectedLibrary, setSelectedLibrary] = useState<Library | null>(null);
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

  const handleLibraryClick = (lib: Library, source: "list" | "map") => {
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

          <MobileSearchOverlay
            isOpen={isMobileSearchOpen}
            searchQuery={searchQuery}
            filteredLibraries={filteredLibraries}
            visited={visited}
            onSearchQueryChange={setSearchQuery}
            onClose={() => setIsMobileSearchOpen(false)}
            onLibrarySelect={(lib) => handleLibraryClick(lib, "map")}
          />

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

          <MobileLibraryDetailOverlay
            selectedLibrary={selectedLibrary}
            visited={visited}
            onClose={closeSelectedLibrary}
            onToggleVisit={toggleVisit}
          />
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
