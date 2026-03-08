"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import incomingTasksData from "../data/incomingTasks.json";

type QuestMarker = {
  accent: string;
  color: string;
  coordinates: [number, number];
  label: string;
  location: string;
  overlayPosition: {
    x: string;
    y: string;
  };
  reward: string;
  summary: string;
  type: string;
};

type IncomingTask = {
  eta: string;
  id: string;
  lane: string;
  markerLabel: QuestMarker["label"];
  reward: string;
  title: string;
  type: string;
};

const questMarkers = [
  {
    accent: "#b5fff4",
    color: "#4ee6ff",
    coordinates: [139.6996, 35.6585],
    label: "NAV",
    location: "Shibuya Station",
    overlayPosition: { x: "28%", y: "66%" },
    reward: "+24 route XP",
    summary: "Verify a pedestrian detour and capture the fastest accessible path for incoming riders.",
    type: "Navigation",
  },
  {
    accent: "#ddd5ff",
    color: "#8f72ff",
    coordinates: [139.7648, 35.6762],
    label: "TOUR",
    location: "Ginza Corridor",
    overlayPosition: { x: "70%", y: "48%" },
    reward: "+18 local guide XP",
    summary: "Scout a premium shopping route and confirm which storefronts are still open for a live concierge flow.",
    type: "Tourism",
  },
  {
    accent: "#d2e6ff",
    color: "#4e8cff",
    coordinates: [139.7006, 35.6896],
    label: "GIG",
    location: "Shinjuku Grid",
    overlayPosition: { x: "30%", y: "38%" },
    reward: "+31 dispatch XP",
    summary: "Complete a fast physical pickup and confirm handoff readiness for an AI-routed delivery chain.",
    type: "Gig Work",
  },
  {
    accent: "#ffd7fa",
    color: "#f25fff",
    coordinates: [139.7708, 35.6812],
    label: "INSP",
    location: "Tokyo Station East",
    overlayPosition: { x: "73%", y: "40%" },
    reward: "+27 inspection XP",
    summary: "Check signage, queue density, and storefront conditions to validate a real-world operations alert.",
    type: "Inspection",
  },
  {
    accent: "#ddfbff",
    color: "#68d5ff",
    coordinates: [139.7454, 35.658],
    label: "LEARN",
    location: "Tokyo Tower Zone",
    overlayPosition: { x: "58%", y: "67%" },
    reward: "+16 model training XP",
    summary: "Collect a short field report on edge-case wayfinding behavior to improve future quest routing.",
    type: "Learning",
  },
] satisfies QuestMarker[];

const incomingTasks = incomingTasksData as IncomingTask[];

const initialVisibleMarkerLabels: QuestMarker["label"][] = [incomingTasks[0].markerLabel];

const mapCenter: [number, number] = [139.7454, 35.6762];

function buildMarkerElement(marker: QuestMarker, isActive = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `questMarker${isActive ? " questMarkerActive" : ""}`;
  wrapper.style.setProperty("--marker-color", marker.color);
  wrapper.style.setProperty("--marker-accent", marker.accent);
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
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Array<{ label: string; marker: import("leaflet").Marker }>>([]);
  const [isReady, setIsReady] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [visibleMarkerLabels, setVisibleMarkerLabels] =
    useState<QuestMarker["label"][]>(initialVisibleMarkerLabels);

  const activeTask = incomingTasks[taskIndex % incomingTasks.length];
  const activeQuestMarker =
    questMarkers.find((marker) => marker.label === activeTask.markerLabel) ?? questMarkers[0];
  const stackedTasks = [
    activeTask,
    incomingTasks[(taskIndex + 1) % incomingTasks.length],
    incomingTasks[(taskIndex + 2) % incomingTasks.length],
  ];

  useEffect(() => {
    const interval = window.setInterval(() => {
      setTaskIndex((current) => (current + 1) % incomingTasks.length);
    }, 4200);

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    setVisibleMarkerLabels((current) => {
      if (current.includes(activeTask.markerLabel)) {
        return current;
      }

      return [...current, activeTask.markerLabel];
    });
  }, [activeTask.markerLabel]);

  useEffect(() => {
    if (!containerRef.current) {
      return;
    }

    let cancelled = false;
    const container = containerRef.current;

    async function init() {
      const leaflet = await import("leaflet");
      leafletRef.current = leaflet;

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
      mapRef.current = map;

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          subdomains: ["a", "b", "c"],
          attribution: "&copy; OpenStreetMap contributors",
        })
        .addTo(map);

      const markers = questMarkers.map((marker) => {
        const instance = leaflet
          .marker([marker.coordinates[1], marker.coordinates[0]], {
            icon: leaflet.divIcon({
              html: buildMarkerElement(
                marker,
                marker.label === incomingTasks[0].markerLabel &&
                  initialVisibleMarkerLabels.includes(marker.label),
              ).outerHTML,
              className: "questMarkerWrapper",
              iconSize: [32, 52],
              iconAnchor: [16, 44],
            }),
            interactive: true,
            keyboard: true,
            bubblingMouseEvents: true,
            zIndexOffset: 1000,
          })
          .bindPopup(buildPopupContent(marker), {
            autoPan: true,
            closeButton: false,
            className: "questPopupWrapper",
            maxWidth: 320,
            offset: [0, -24],
          });

        if (initialVisibleMarkerLabels.includes(marker.label)) {
          instance.addTo(map);
        }

        return { label: marker.label, marker: instance };
      });

      markersRef.current = markers;

      map.whenReady(() => {
        setIsReady(true);
      });

      return () => {
        leafletRef.current = null;
        mapRef.current = null;
        markersRef.current = [];
        markers.forEach(({ marker }) => marker.remove());
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

  useEffect(() => {
    if (markersRef.current.length === 0 || !leafletRef.current) {
      return;
    }

    const leaflet = leafletRef.current;

    markersRef.current.forEach(({ label, marker }) => {
      const questMarker = questMarkers.find((item) => item.label === label);

      if (!questMarker) {
        return;
      }

      marker.setIcon(
        leaflet.divIcon({
          html: buildMarkerElement(
            questMarker,
            label === activeTask.markerLabel && visibleMarkerLabels.includes(label),
          ).outerHTML,
          className: "questMarkerWrapper",
          iconSize: [32, 52],
          iconAnchor: [16, 44],
        }),
      );

    });
  }, [activeTask.markerLabel, visibleMarkerLabels]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    markersRef.current.forEach(({ label, marker }) => {
      const shouldShow = visibleMarkerLabels.includes(label);

      if (shouldShow && !map.hasLayer(marker)) {
        marker.addTo(map);
      }

      if (!shouldShow && map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
    });
  }, [visibleMarkerLabels]);

  return (
    <>
      <div aria-hidden="true" className="taskIngressLayer">
        <div className="taskNoticeStack" key={activeTask.id}>
          {stackedTasks.map((task, index) => {
            const marker =
              questMarkers.find((item) => item.label === task.markerLabel) ?? activeQuestMarker;
            const isCurrent = index === 0;

            return (
              <div
                className={`taskNoticeCard${isCurrent ? " taskNoticeCardCurrent" : ""}`}
                key={`${task.id}-${index}`}
                style={
                  {
                    "--task-color": marker.color,
                    "--task-accent": marker.accent,
                    "--stack-index": String(index),
                  } as CSSProperties
                }
              >
                <div className="taskNoticeHeader">
                  <span className="taskNoticeApp">Slack</span>
                  <span className="taskNoticeTime">{task.eta}</span>
                </div>
                <div className="taskNoticeMeta">
                  <span className="taskNoticeChannel">#ops-live</span>
                  <span className="taskNoticeBadge">{marker.label}</span>
                </div>
                <div className="taskNoticeBody">
                  <strong>{task.title}</strong>
                  <p>
                    {task.type} task opened for {marker.location}. {task.reward}
                  </p>
                </div>
                <div className="taskNoticeFooter">
                  <span>{task.lane}</span>
                  <span>{isCurrent ? "new task" : "queued"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="mapSurface">
        <div aria-hidden="true" className={`mapFallback ${isReady ? "mapFallbackHidden" : "mapFallbackActive"}`}>
          <div className="mapFallbackGrid" />
        </div>
        <div className="mapCanvas" ref={containerRef} />
      </div>
    </>
  );
}
