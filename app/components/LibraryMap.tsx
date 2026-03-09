"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { LocateFixed } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Library } from "../types/library";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || "";

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
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const libraryMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
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
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      center: [121.0715, 14.6535],
      zoom: 16,
      attributionControl: false,
      style: "mapbox://styles/mapbox/light-v11",
    });

    mapRef.current = map;

    return () => {
      libraryMarkersRef.current.forEach((marker) => marker.remove());
      libraryMarkersRef.current = [];

      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }

      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (selectedLibrary) {
      map.flyTo({
        center: [selectedLibrary.coords[1], selectedLibrary.coords[0]],
        zoom: 17,
        duration: 500,
      });
    }
  }, [selectedLibrary]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map || !locateTarget) {
      return;
    }

    map.flyTo({
      center: [locateTarget[1], locateTarget[0]],
      zoom: 17,
      duration: 500,
    });
  }, [locateTarget]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    const timerId = setTimeout(() => {
      map.resize();
    }, 250);

    return () => clearTimeout(timerId);
  }, [isSidebarOpen]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
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

      const el = document.createElement("div");
      el.style.width = `${size}px`;
      el.style.height = `${size}px`;
      el.style.borderRadius = "9999px";
      el.style.background = color;
      el.style.border = `${borderWidth}px solid ${borderColor}`;
      el.style.display = "flex";
      el.style.alignItems = "center";
      el.style.justifyContent = "center";
      el.style.color = "white";
      el.style.boxShadow = shadow;
      el.style.cursor = "pointer";
      el.style.zIndex = isSelected ? "1000" : "1";
      el.innerHTML = iconSvg;
      el.setAttribute("aria-label", lib.name);

      el.addEventListener("click", () => onLibraryClick(lib));

      const marker = new mapboxgl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([lib.coords[1], lib.coords[0]])
        .addTo(map);

      libraryMarkersRef.current.push(marker);
    });
  }, [onLibraryClick, selectedLibrary, visibleLibraries, visitedSet]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (!currentLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
        userMarkerRef.current = null;
      }
      return;
    }

    const markerEl = document.createElement("div");
    markerEl.style.width = "24px";
    markerEl.style.height = "24px";
    markerEl.style.borderRadius = "9999px";
    markerEl.style.background = "#2563eb";
    markerEl.style.border = "2px solid #ffffff";
    markerEl.style.boxShadow = "0 6px 12px rgba(15, 23, 42, 0.25)";

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    userMarkerRef.current = new mapboxgl.Marker({
      element: markerEl,
      anchor: "center",
    })
      .setLngLat([currentLocation[1], currentLocation[0]])
      .addTo(map);
  }, [currentLocation]);

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
