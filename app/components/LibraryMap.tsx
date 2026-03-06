"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

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

function MapController({
  selectedLibrary,
  isSidebarOpen,
  locateTarget,
}: {
  selectedLibrary: LibraryStop | null;
  isSidebarOpen: boolean;
  locateTarget: [number, number] | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedLibrary) {
      map.setView(selectedLibrary.coords, 17);
    }
  }, [map, selectedLibrary]);

  useEffect(() => {
    if (locateTarget) {
      map.setView(locateTarget, 17);
    }
  }, [locateTarget, map]);

  useEffect(() => {
    const timerId = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timerId);
  }, [map, isSidebarOpen]);

  return null;
}

export default function LibraryMap({
  libraries,
  selectedLibrary,
  isSidebarOpen,
  showStampPinsOnly,
  visitedIds,
  onLibraryClick,
}: {
  libraries: LibraryStop[];
  selectedLibrary: LibraryStop | null;
  isSidebarOpen: boolean;
  showStampPinsOnly: boolean;
  visitedIds: number[];
  onLibraryClick: (lib: LibraryStop) => void;
}) {
  const visitedSet = useMemo(() => new Set(visitedIds), [visitedIds]);
  const [currentLocation, setCurrentLocation] = useState<[number, number] | null>(
    null,
  );
  const [locateTarget, setLocateTarget] = useState<[number, number] | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const watchTimeoutRef = useRef<number | null>(null);

  const clearWatchFallback = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (watchTimeoutRef.current !== null) {
      window.clearTimeout(watchTimeoutRef.current);
      watchTimeoutRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearWatchFallback();
    };
  }, []);

  const markerIcons = useMemo(
    () => ({
      green: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="background:#014421"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
      greenSelected: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-10 h-10 rounded-full border-4 border-[#f1c40f] shadow-xl flex items-center justify-center text-white" style="background:#014421"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
      red: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="background:#7b1113"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
      redSelected: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-10 h-10 rounded-full border-4 border-[#f1c40f] shadow-xl flex items-center justify-center text-white" style="background:#7b1113"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
      gray: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white" style="background:#64748b"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
      graySelected: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-10 h-10 rounded-full border-4 border-[#f1c40f] shadow-xl flex items-center justify-center text-white" style="background:#64748b"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg></div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40],
      }),
      blue: L.divIcon({
        className: "custom-div-icon",
        html: `<div class="w-6 h-6 rounded-full border-2 border-white shadow-lg" style="background:#2563eb"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    }),
    [],
  );

  const handleLocateMe = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationError("Geolocation is not supported on this device.");
      return;
    }

    const onSuccess = (position: GeolocationPosition) => {
      clearWatchFallback();
      const coords: [number, number] = [
        position.coords.latitude,
        position.coords.longitude,
      ];
      setCurrentLocation(coords);
      setLocateTarget(coords);
      setLocationError(null);
      setIsLocating(false);
    };

    const handleTerminalError = (message: string) => {
      clearWatchFallback();
      setLocationError(message);
      setIsLocating(false);
    };

    const onError = (
      error: GeolocationPositionError,
      stage: "coarse" | "high-accuracy" | "watch",
    ) => {
      const isInsecureContext =
        typeof window !== "undefined" && !window.isSecureContext;

      if (isInsecureContext) {
        handleTerminalError(
          "Location requires HTTPS on mobile. Open this app from an https:// URL.",
        );
        return;
      }

      if (error.code === error.PERMISSION_DENIED) {
        handleTerminalError(
          "Location is blocked. Tap the lock/site icon and set Location to Allow, then reload and try again.",
        );
        return;
      }

      if (
        stage === "coarse" &&
        (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)
      ) {
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (retryError) => onError(retryError, "high-accuracy"),
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          },
        );
        return;
      }

      if (
        stage === "high-accuracy" &&
        (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE)
      ) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          onSuccess,
          (watchError) => onError(watchError, "watch"),
          {
            enableHighAccuracy: false,
            maximumAge: 600000,
          },
        );

        watchTimeoutRef.current = window.setTimeout(() => {
          handleTerminalError(
            "Location request timed out. Try again or check desktop location services.",
          );
        }, 20000);
        return;
      }

      if (error.code === error.TIMEOUT || error.code === error.POSITION_UNAVAILABLE) {
        handleTerminalError(
          "Location request timed out. Try again or check desktop location services.",
        );
        return;
      }

      handleTerminalError("Unable to get current location.");
    };

    clearWatchFallback();
    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (error) => onError(error, "coarse"),
      {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 600000,
      },
    );
  };

  const getMarkerIcon = (lib: LibraryStop) => {
    const isSelected = selectedLibrary?.id === lib.id;

    if (!lib.hasStamp) {
      return isSelected ? markerIcons.graySelected : markerIcons.gray;
    }

    if (visitedSet.has(lib.id)) {
      return isSelected ? markerIcons.greenSelected : markerIcons.green;
    }

    return isSelected ? markerIcons.redSelected : markerIcons.red;
  };

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={[14.6535, 121.0715]}
        zoom={16}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <MapController
          selectedLibrary={selectedLibrary}
          isSidebarOpen={isSidebarOpen}
          locateTarget={locateTarget}
        />
        {currentLocation && (
          <Marker position={currentLocation} icon={markerIcons.blue} />
        )}
        {libraries
          .filter((lib) => !showStampPinsOnly || lib.hasStamp)
          .map((lib) => (
            <Marker
              key={lib.id}
              position={lib.coords}
              icon={getMarkerIcon(lib)}
              zIndexOffset={selectedLibrary?.id === lib.id ? 1000 : 0}
              eventHandlers={{
                click: () => onLibraryClick(lib),
              }}
            />
          ))}
      </MapContainer>

      <div className="absolute right-4 top-4 z-1000 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          className="h-10 rounded-lg bg-white/95 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-700 shadow-lg border border-slate-200 hover:bg-white disabled:opacity-70"
          aria-label="Show current location"
          title="Show current location"
          disabled={isLocating}
        >
          {isLocating ? "Locating..." : "Locate me"}
        </button>
        {locationError && (
          <p className="max-w-52 rounded-md bg-[#7b1113] px-2 py-1 text-[10px] font-semibold text-white shadow-md">
            {locationError}
          </p>
        )}
      </div>
    </div>
  );
}
