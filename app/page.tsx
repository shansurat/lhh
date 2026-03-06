"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  MapPin,
  Star,
  Search,
  X,
  CheckCircle2,
  Ticket,
  Menu,
  List,
  Eye,
} from "lucide-react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import libraryHopListData from "./library-hop-list.json";

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

function MapController({
  selectedLibrary,
  isSidebarOpen,
}: {
  selectedLibrary: LibraryStop | null;
  isSidebarOpen: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedLibrary) {
      map.setView(selectedLibrary.coords, 17);
    }
  }, [map, selectedLibrary]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timerId);
  }, [map, isSidebarOpen]);

  return null;
}

export default function App() {
  const [selectedLibrary, setSelectedLibrary] = useState<LibraryStop | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showStampPinsOnly, setShowStampPinsOnly] = useState(false);
  const [visited, setVisited] = useState<Set<number>>(new Set());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const markerIcons = useMemo(
    () => ({
      green: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="background:#014421"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
      red: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="background:#7b1113"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
      gray: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="background:#64748b"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
    }),
    [],
  );

  const getMarkerIcon = (lib: LibraryStop) => {
    if (!lib.hasStamp) {
      return markerIcons.gray;
    }

    return visited.has(lib.id) ? markerIcons.green : markerIcons.red;
  };

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

  const handleLibraryClick = (lib: LibraryStop) => {
    setSelectedLibrary(lib);
    // Auto-close sidebar on mobile after selection
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  const toggleVisit = (id: number) => {
    const next = new Set(visited);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setVisited(next);
  };

  return (
    <div className="flex flex-col h-screen bg-[#fdfaf6] text-slate-900 overflow-hidden font-serif">
      <style>{`
        .leaflet-container { font-family: inherit; cursor: crosshair; background: #fdfaf6; }
        .custom-div-icon { background: transparent; border: none; }
      `}</style>

      {/* Header */}
      <header className="bg-[#7b1113] border-b-4 border-[#014421] p-3 sticky top-0 z-1100 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-1.5 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <Menu className="size-5" />
          </button>
          <div className="font-sans">
            <h1 className="text-base sm:text-xl font-black tracking-tight text-white uppercase leading-none">
              Library Hop <span className="text-[#f1c40f]">Checklist</span>
            </h1>
            <p className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.16em] text-[#bdc3c7]">
              By Shan Surat
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-white/10 px-2.5 sm:px-3 py-1.5 rounded-lg border border-white/20">
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
          className={`
          fixed lg:relative inset-y-0 left-0 w-72 sm:w-80 bg-white z-1050 transition-transform duration-300 ease-in-out border-r border-slate-200 flex flex-col font-sans
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-0 lg:opacity-0 lg:pointer-events-none"}
        `}
        >
          {/* <div className="p-3 bg-[#fdfaf6] border-b border-slate-200 flex items-center justify-end">
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1 text-slate-400 hover:text-slate-600"
            >
              <X className="size-5" />
            </button>
          </div> */}

          <div className="p-3">
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

          <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1.5">
            {filteredLibraries.map((lib) => (
              <button
                key={lib.id}
                onClick={() => handleLibraryClick(lib)}
                className={`w-full text-left p-3 rounded-lg transition-all flex items-start gap-3 border group ${
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
          <MapContainer
            center={[14.6535, 121.0715]}
            zoom={16}
            zoomControl={false}
            className="h-full w-full"
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            />
            <MapController
              selectedLibrary={selectedLibrary}
              isSidebarOpen={isSidebarOpen}
            />
            {LIBRARY_HOP_LIST.filter((lib) => !showStampPinsOnly || lib.hasStamp).map((lib) => (
              <Marker
                key={lib.id}
                position={lib.coords}
                icon={getMarkerIcon(lib)}
                eventHandlers={{
                  click: () => handleLibraryClick(lib),
                }}
              />
            ))}
          </MapContainer>

          {/* Floating Mobile Toggle (if sidebar is closed) */}
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden absolute top-3 left-3 z-1000 p-2 bg-white rounded-lg shadow-xl text-[#7b1113] border border-slate-100"
            >
              <List className="size-5" />
            </button>
          )}

          {/* Stop Detail Overlay */}
          {selectedLibrary && (
            <div className="absolute bottom-4 inset-x-3 lg:left-auto lg:right-4 lg:w-96 bg-white p-4 rounded-xl shadow-[0_30px_60px_-12px_rgba(123,17,19,0.3)] z-1001 border-t-4 border-[#7b1113] animate-in slide-in-from-bottom-8 duration-500">
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
                  onClick={() => setSelectedLibrary(null)}
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
