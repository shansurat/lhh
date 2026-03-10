"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LocateFixed } from "lucide-react";
import "leaflet/dist/leaflet.css";
import type { Library } from "../types/library";

export default function LibraryMap({
  libraries,
  selectedLibrary,
  isSidebarOpen,
  showStampPinsOnly,
  visitedIds,
  onLibraryClick,
}: {
  libraries: Library[];
  selectedLibrary: Library | null;
  isSidebarOpen: boolean;
  showStampPinsOnly: boolean;
  visitedIds: number[];
  onLibraryClick: (lib: Library) => void;
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const libraryMarkersRef = useRef<import("leaflet").Marker[]>([]);
  const userMarkerRef = useRef<import("leaflet").Marker | null>(null);
  const visitedSet = useMemo(() => new Set(visitedIds), [visitedIds]);
  const visibleLibraries = useMemo(
    () => libraries.filter((lib) => !showStampPinsOnly || lib.hasStamp),
    [libraries, showStampPinsOnly],
  );
  const [currentLocation, setCurrentLocation] = useState<
    [number, number] | null
  >(null);
  const [locateTarget, setLocateTarget] = useState<[number, number] | null>(
    null,
  );
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
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

  useEffect(() => {
    let isDisposed = false;

    const initMap = async () => {
      if (!mapContainerRef.current || mapRef.current) {
        return;
      }

      const leaflet = await import("leaflet");
      if (isDisposed || !mapContainerRef.current) {
        return;
      }

      leafletRef.current = leaflet;

      const map = leaflet.map(mapContainerRef.current, {
        zoomControl: false,
      });
      map.setView([14.6535, 121.0715], 16);

      leaflet
        .tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
          attribution:
            '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 19,
        })
        .addTo(map);

      mapRef.current = map;
      setIsMapReady(true);
    };

    void initMap();

    return () => {
      isDisposed = true;
      libraryMarkersRef.current.forEach((marker) => marker.remove());
      libraryMarkersRef.current = [];

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      mapRef.current?.remove();
      mapRef.current = null;
      setIsMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    if (selectedLibrary) {
      map.flyTo([selectedLibrary.coords[0], selectedLibrary.coords[1]], 17, {
        duration: 0.5,
      });
    }
  }, [isMapReady, selectedLibrary]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady || !locateTarget) {
      return;
    }

    map.flyTo([locateTarget[0], locateTarget[1]], 17, {
      duration: 0.5,
    });
  }, [isMapReady, locateTarget]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    const timerId = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => clearTimeout(timerId);
  }, [isMapReady, isSidebarOpen]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    const leaflet = leafletRef.current;
    if (!leaflet) {
      return;
    }

    libraryMarkersRef.current.forEach((marker) => marker.remove());
    libraryMarkersRef.current = [];

    const iconSvg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M8 7h6"/><path d="M8 11h8"/></svg>';

    visibleLibraries.forEach((lib) => {
      const isSelected = selectedLibrary?.id === lib.id;
      const isVisited = visitedSet.has(lib.id);

      const color = !lib.hasStamp
        ? "#64748b"
        : isVisited
          ? "#014421"
          : "#7b1113";
      const size = isSelected ? 40 : 32;
      const borderWidth = isSelected ? 4 : 2;
      const borderColor = isSelected ? "#f1c40f" : "#ffffff";
      const shadow = isSelected
        ? "0 10px 20px rgba(15, 23, 42, 0.35)"
        : "0 6px 12px rgba(15, 23, 42, 0.25)";

      const markerIcon = leaflet.divIcon({
        className: "",
        html: `<div aria-label="${lib.name}" style="width:${size}px;height:${size}px;border-radius:9999px;background:${color};border:${borderWidth}px solid ${borderColor};display:flex;align-items:center;justify-content:center;color:white;box-shadow:${shadow};cursor:pointer;">${iconSvg}</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size],
      });

      const marker = leaflet.marker([lib.coords[0], lib.coords[1]], {
        icon: markerIcon,
        title: lib.name,
      })
        .addTo(map);

      marker.on("click", () => onLibraryClick(lib));
      marker.setZIndexOffset(isSelected ? 1000 : 0);

      libraryMarkersRef.current.push(marker);
    });
  }, [isMapReady, onLibraryClick, selectedLibrary, visibleLibraries, visitedSet]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !isMapReady) {
      return;
    }

    const leaflet = leafletRef.current;
    if (!leaflet) {
      return;
    }

    if (!currentLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const markerIcon = leaflet.divIcon({
      className: "",
      html: '<div style="width:24px;height:24px;border-radius:9999px;background:#2563eb;border:2px solid #ffffff;box-shadow:0 6px 12px rgba(15, 23, 42, 0.25);"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    userMarkerRef.current = leaflet
      .marker([currentLocation[0], currentLocation[1]], {
        icon: markerIcon,
      })
      .addTo(map);
  }, [currentLocation, isMapReady]);

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
        (error.code === error.TIMEOUT ||
          error.code === error.POSITION_UNAVAILABLE)
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
        (error.code === error.TIMEOUT ||
          error.code === error.POSITION_UNAVAILABLE)
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

      if (
        error.code === error.TIMEOUT ||
        error.code === error.POSITION_UNAVAILABLE
      ) {
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

  return (
    <div className="relative h-full w-full">
      <div ref={mapContainerRef} className="h-full w-full" />

      <div className="absolute right-3 bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-1000 flex flex-col items-end gap-2 lg:right-4 lg:top-4 lg:bottom-auto">
        <button
          type="button"
          onClick={handleLocateMe}
          className="h-12 w-12 rounded-full bg-white/95 text-slate-700 shadow-lg border border-slate-200 hover:bg-white disabled:opacity-70 flex items-center justify-center lg:h-10 lg:w-auto lg:rounded-lg lg:px-3"
          aria-label="Show current location"
          title="Show current location"
          disabled={isLocating}
        >
          <span className="lg:hidden">
            <LocateFixed
              className={`size-4 ${isLocating ? "animate-pulse" : ""}`}
            />
          </span>
          <span className="hidden lg:inline">
            {isLocating ? "Locating..." : "Locate me"}
          </span>
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
