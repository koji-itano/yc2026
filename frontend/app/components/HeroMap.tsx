"use client";

import { useEffect, useRef, useState } from "react";

type QuestMarker = {
  color: string;
  coordinates: [number, number];
  label: string;
  location: string;
  reward: string;
  summary: string;
  type: string;
};

const questMarkers: QuestMarker[] = [
  {
    color: "#4ee6ff",
    coordinates: [139.6996, 35.6585],
    label: "NAV",
    location: "Shibuya Station",
    reward: "+24 route XP",
    summary: "Verify a pedestrian detour and capture the fastest accessible path for incoming riders.",
    type: "Navigation",
  },
  {
    color: "#8f72ff",
    coordinates: [139.7648, 35.6762],
    label: "TOUR",
    location: "Ginza Corridor",
    reward: "+18 local guide XP",
    summary: "Scout a premium shopping route and confirm which storefronts are still open for a live concierge flow.",
    type: "Tourism",
  },
  {
    color: "#4e8cff",
    coordinates: [139.7006, 35.6896],
    label: "GIG",
    location: "Shinjuku Grid",
    reward: "+31 dispatch XP",
    summary: "Complete a fast physical pickup and confirm handoff readiness for an AI-routed delivery chain.",
    type: "Gig Work",
  },
  {
    color: "#f25fff",
    coordinates: [139.7708, 35.6812],
    label: "INSP",
    location: "Tokyo Station East",
    reward: "+27 inspection XP",
    summary: "Check signage, queue density, and storefront conditions to validate a real-world operations alert.",
    type: "Inspection",
  },
  {
    color: "#68d5ff",
    coordinates: [139.7454, 35.658],
    label: "LEARN",
    location: "Tokyo Tower Zone",
    reward: "+16 model training XP",
    summary: "Collect a short field report on edge-case wayfinding behavior to improve future quest routing.",
    type: "Learning",
  },
];

const mapCenter: [number, number] = [139.7454, 35.6762];

function buildMarkerElement(marker: QuestMarker) {
  const wrapper = document.createElement("div");
  wrapper.className = "questMarker";
  wrapper.style.setProperty("--marker-color", marker.color);
  wrapper.setAttribute("aria-label", `${marker.type} quest marker`);

  const pulse = document.createElement("span");
  pulse.className = "questMarkerPulse";

  const core = document.createElement("span");
  core.className = "questMarkerCore";

  const label = document.createElement("span");
  label.className = "questMarkerLabel";
  label.textContent = marker.label;

  wrapper.append(pulse, core, label);
  return wrapper;
}

function buildPopupContent(marker: QuestMarker) {
  return `
    <div class="questPopup">
      <span class="questPopupType">${marker.type}</span>
      <h2>${marker.location}</h2>
      <p>${marker.summary}</p>
      <div class="questPopupMeta">
        <span>${marker.label}</span>
        <span>${marker.reward}</span>
      </div>
    </div>
  `;
}

export function HeroMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;
    const container = containerRef.current;

    async function init() {
      const leaflet = await import("leaflet");

      if (cancelled) {
        return;
      }

      const map = leaflet.map(container, {
        center: [mapCenter[1], mapCenter[0]],
        zoom: 14,
        zoomControl: true,
        attributionControl: true,
        dragging: true,
        touchZoom: true,
        doubleClickZoom: true,
        scrollWheelZoom: true,
        boxZoom: true,
        keyboard: true,
        tapHold: false,
      });

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          subdomains: ["a", "b", "c"],
          attribution: "&copy; OpenStreetMap contributors",
        })
        .addTo(map);

      const markers = questMarkers.map((marker) =>
        leaflet
          .marker([marker.coordinates[1], marker.coordinates[0]], {
            icon: leaflet.divIcon({
              html: buildMarkerElement(marker).outerHTML,
              className: "questMarkerWrapper",
              iconSize: [32, 52],
              iconAnchor: [16, 44],
            }),
            interactive: true,
            keyboard: true,
            bubblingMouseEvents: true,
            zIndexOffset: 1000,
          })
          .addTo(map)
          .bindPopup(buildPopupContent(marker), {
            autoPan: true,
            closeButton: false,
            className: "questPopupWrapper",
            maxWidth: 320,
            offset: [0, -24],
          }),
      );

      map.whenReady(() => {
        setIsReady(true);
      });

      return () => {
        markers.forEach((marker) => marker.remove());
        map.remove();
      };
    }

    let cleanup: (() => void) | undefined;

    init().then((teardown) => {
      cleanup = teardown;
    });

    return () => {
      cancelled = true;
      if (cleanup) {
        cleanup();
      }
    };
  }, []);

  return (
    <>
      <div aria-hidden="true" className={`mapFallback ${isReady ? "mapFallbackHidden" : "mapFallbackActive"}`}>
        <div className="mapFallbackGrid" />
      </div>
      <div className="mapCanvas" ref={containerRef} />
    </>
  );
}
