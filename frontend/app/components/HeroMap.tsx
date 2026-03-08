"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import incomingTasksData from "../data/incomingTasks.json";
import type { AdminTask } from "../lib/adminMatching";

type QuestMarker = {
  accent: string;
  color: string;
  coordinates: [number, number];
  label: string;
  overlayPosition: {
    x: string;
    y: string;
  };
};

type AcceptanceConversationMessage = {
  content: string;
  role: "assistant" | "user";
};

type AcceptanceLanguage = "en" | "ja";
type AcceptanceState = "briefing" | "confirmed" | "declined" | "idle" | "listening" | "needs_help" | "speaking" | "thinking";
type AcceptanceStatusHint = "confirmed" | "continue" | "declined" | "needs_help";
type AcceptanceStep = "availability" | "briefing" | "eta" | "final" | "safety";
type NoticePhase = "enter" | "exit";

type AcceptanceReply = {
  assistantText: string;
  nextStep: AcceptanceStep;
  statusHint: AcceptanceStatusHint;
};

type BrowserSpeechRecognition = {
  abort: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onend: null | (() => void);
  onerror: null | (() => void);
  onresult: null | ((event: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal?: boolean }> }) => void);
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionCtor = new () => BrowserSpeechRecognition;

type TaskNotice = {
  id: string;
  marker: QuestMarker;
  phase: NoticePhase;
  task: AdminTask;
};

const questMarkers = [
  {
    accent: "#b5fff4",
    color: "#4ee6ff",
    coordinates: [139.6996, 35.6585],
    label: "NAV",
    overlayPosition: { x: "28%", y: "66%" },
  },
  {
    accent: "#ddd5ff",
    color: "#8f72ff",
    coordinates: [139.7648, 35.6762],
    label: "TOUR",
    overlayPosition: { x: "70%", y: "48%" },
  },
  {
    accent: "#d2e6ff",
    color: "#4e8cff",
    coordinates: [139.7006, 35.6896],
    label: "GIG",
    overlayPosition: { x: "30%", y: "38%" },
  },
  {
    accent: "#ffd7fa",
    color: "#f25fff",
    coordinates: [139.7708, 35.6812],
    label: "INSP",
    overlayPosition: { x: "73%", y: "40%" },
  },
  {
    accent: "#ddfbff",
    color: "#68d5ff",
    coordinates: [139.7454, 35.658],
    label: "LEARN",
    overlayPosition: { x: "58%", y: "67%" },
  },
] satisfies QuestMarker[];

const incomingTasks = incomingTasksData as AdminTask[];
const initialVisibleMarkerLabels: QuestMarker["label"][] = [incomingTasks[0].markerLabel];
const mapCenter: [number, number] = [139.7454, 35.6762];
const TASK_NOTICE_ENTER_MS = 260;
const TASK_NOTICE_HOLD_MS = 3000;
const TASK_NOTICE_EXIT_MS = 320;
const TASK_NOTICE_MAX_VISIBLE = 2;

function buildMarkerElement(marker: QuestMarker, isActive = false) {
  const wrapper = document.createElement("div");
  wrapper.className = `questMarker${isActive ? " questMarkerActive" : ""}`;
  wrapper.style.setProperty("--marker-color", marker.color);
  wrapper.style.setProperty("--marker-accent", marker.accent);
  wrapper.setAttribute("aria-label", `${marker.label} quest marker`);

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

function buildPopupContent(task: AdminTask, marker: QuestMarker) {
  return `
    <div class="questPopup">
      <span class="questPopupType">${task.type}</span>
      <h2>${task.location}</h2>
      <p>${task.summary}</p>
      <div class="questPopupMeta">
        <span>${marker.label}</span>
        <span>${task.reward}</span>
      </div>
      <button class="questPopupAction" type="button">Accept with voice</button>
    </div>
  `;
}

function getLanguageCode(language: AcceptanceLanguage) {
  return language === "ja" ? "ja-JP" : "en-US";
}

function getRecognitionCtor() {
  if (typeof window === "undefined") {
    return null;
  }

  const recognitionWindow = window as typeof window & {
    SpeechRecognition?: BrowserSpeechRecognitionCtor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionCtor;
  };

  return recognitionWindow.SpeechRecognition ?? recognitionWindow.webkitSpeechRecognition ?? null;
}

function getAcceptanceStateFromReply(statusHint: AcceptanceStatusHint) {
  if (statusHint === "confirmed") {
    return "confirmed" as const;
  }

  if (statusHint === "declined") {
    return "declined" as const;
  }

  if (statusHint === "needs_help") {
    return "needs_help" as const;
  }

  return "briefing" as const;
}

export function HeroMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const leafletRef = useRef<typeof import("leaflet") | null>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Array<{ label: string; marker: import("leaflet").Marker }>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const conversationRef = useRef<AcceptanceConversationMessage[]>([]);
  const selectedLanguageRef = useRef<AcceptanceLanguage>("ja");
  const selectedTaskIdRef = useRef<string | null>(null);
  const textReplyRef = useRef<HTMLInputElement>(null);
  const taskNoticeSeqRef = useRef(0);

  const [isReady, setIsReady] = useState(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [visibleMarkerLabels, setVisibleMarkerLabels] = useState<QuestMarker["label"][]>(initialVisibleMarkerLabels);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAcceptanceOpen, setIsAcceptanceOpen] = useState(false);
  const [acceptanceState, setAcceptanceState] = useState<AcceptanceState>("idle");
  const [conversation, setConversation] = useState<AcceptanceConversationMessage[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<AcceptanceLanguage>("ja");
  const [isVoiceSupported, setIsVoiceSupported] = useState(false);
  const [isSpeechOutputEnabled, setIsSpeechOutputEnabled] = useState(true);
  const [textReply, setTextReply] = useState("");
  const [transcriptPreview, setTranscriptPreview] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<AcceptanceStep>("briefing");
  const [taskNotices, setTaskNotices] = useState<TaskNotice[]>([]);

  const activeTask = incomingTasks[taskIndex % incomingTasks.length];
  const selectedTask = selectedTaskId ? incomingTasks.find((task) => task.id === selectedTaskId) ?? null : null;
  const highlightedMarkerLabel = selectedTask?.markerLabel ?? activeTask.markerLabel;
  const highlightedMarker =
    questMarkers.find((marker) => marker.label === highlightedMarkerLabel) ?? questMarkers[0];

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId;
  }, [selectedTaskId]);

  useEffect(() => {
    setIsVoiceSupported(Boolean(getRecognitionCtor()));
    setIsSpeechOutputEnabled(typeof window !== "undefined" && typeof window.Audio !== "undefined");
  }, []);

  useEffect(() => {
    return () => {
      stopRecognition();
      stopAudioPlayback();
    };
  }, []);

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
    const marker = questMarkers.find((item) => item.label === activeTask.markerLabel) ?? questMarkers[0];
    const noticeId = `${activeTask.id}-${taskNoticeSeqRef.current}`;
    taskNoticeSeqRef.current += 1;

    setTaskNotices((current) => {
      const next: TaskNotice[] = [{ id: noticeId, marker, phase: "enter", task: activeTask }, ...current];
      return next.slice(0, TASK_NOTICE_MAX_VISIBLE);
    });

    const exitTimer = window.setTimeout(() => {
      setTaskNotices((current) =>
        current.map((notice) => (notice.id === noticeId ? { ...notice, phase: "exit" } : notice)),
      );
    }, TASK_NOTICE_ENTER_MS + TASK_NOTICE_HOLD_MS);

    const removeTimer = window.setTimeout(() => {
      setTaskNotices((current) => current.filter((notice) => notice.id !== noticeId));
    }, TASK_NOTICE_ENTER_MS + TASK_NOTICE_HOLD_MS + TASK_NOTICE_EXIT_MS);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(removeTimer);
    };
  }, [activeTask]);

  useEffect(() => {
    if (!isAcceptanceOpen || !selectedTask || conversation.length > 0) {
      return;
    }

    const controller = new AbortController();
    const task = selectedTask;

    async function loadBriefing() {
      setAcceptanceState("thinking");
      setVoiceError(null);

      const response = await fetch("/api/voice/acceptance", {
        body: JSON.stringify({
          history: [],
          language: selectedLanguage,
          taskId: task.id,
          userTranscript: "",
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
        signal: controller.signal,
      });

      const payload = (await response.json()) as AcceptanceReply & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Voice assistance is unavailable right now.");
      }

      setConversation([
        {
          content: payload.assistantText,
          role: "assistant",
        },
      ]);
      setCurrentStep(payload.nextStep);

      // Auto-speak briefing and start listening
      await speakAssistantText(payload.assistantText, getAcceptanceStateFromReply(payload.statusHint));
      startListening();
    }

    loadBriefing().catch((error: unknown) => {
      if (controller.signal.aborted) {
        return;
      }

      setVoiceError(error instanceof Error ? error.message : "Voice assistance is unavailable right now.");
      setAcceptanceState("needs_help");
    });

    return () => {
      controller.abort();
    };
  }, [conversation.length, isAcceptanceOpen, selectedLanguage, selectedTask]);

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
        attributionControl: true,
        boxZoom: true,
        center: [mapCenter[1], mapCenter[0]],
        doubleClickZoom: true,
        dragging: true,
        keyboard: true,
        scrollWheelZoom: true,
        tapHold: false,
        touchZoom: true,
        zoom: 14,
        zoomControl: true,
      });
      mapRef.current = map;

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 19,
          subdomains: ["a", "b", "c"],
        })
        .addTo(map);

      const markers = questMarkers.map((marker) => {
        const task = incomingTasks.find((item) => item.markerLabel === marker.label);

        const instance = leaflet
          .marker([marker.coordinates[1], marker.coordinates[0]], {
            bubblingMouseEvents: true,
            icon: leaflet.divIcon({
              className: "questMarkerWrapper",
              html: buildMarkerElement(
                marker,
                marker.label === incomingTasks[0].markerLabel && initialVisibleMarkerLabels.includes(marker.label),
              ).outerHTML,
              iconAnchor: [16, 44],
              iconSize: [32, 52],
            }),
            interactive: true,
            keyboard: true,
            zIndexOffset: 1000,
          })
          .bindPopup(
            task ? buildPopupContent(task, marker) : "",
            {
              autoPan: true,
              className: "questPopupWrapper",
              closeButton: false,
              maxWidth: 320,
              offset: [0, -24],
            },
          );

        if (task) {
          instance.on("click", () => {
            setSelectedTaskId(task.id);
            setIsAcceptanceOpen(true);
            setConversation([]);
            setTextReply("");
            setTranscriptPreview("");
            setVoiceError(null);
            setCurrentStep("briefing");
            setAcceptanceState("briefing");
          });

          instance.on("popupopen", (event) => {
            const popupElement = event.popup.getElement();
            const actionButton = popupElement?.querySelector<HTMLButtonElement>(".questPopupAction");

            if (actionButton) {
              actionButton.onclick = () => {
                setSelectedTaskId(task.id);
                setIsAcceptanceOpen(true);
                setConversation([]);
                setTextReply("");
                setTranscriptPreview("");
                setVoiceError(null);
                setCurrentStep("briefing");
                setAcceptanceState("briefing");
              };
            }
          });
        }

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
          className: "questMarkerWrapper",
          html: buildMarkerElement(
            questMarker,
            label === highlightedMarkerLabel && visibleMarkerLabels.includes(label),
          ).outerHTML,
          iconAnchor: [16, 44],
          iconSize: [32, 52],
        }),
      );
    });
  }, [highlightedMarkerLabel, visibleMarkerLabels]);

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

  function focusTaskPin(task: AdminTask, markerLabel: QuestMarker["label"]) {
    const map = mapRef.current;
    const markerEntry = markersRef.current.find((item) => item.label === markerLabel);
    const questMarker = questMarkers.find((item) => item.label === markerLabel);

    stopRecognition();
    stopAudioPlayback();
    setIsAcceptanceOpen(false);
    setAcceptanceState("idle");
    setSelectedTaskId(task.id);
    setVisibleMarkerLabels((current) => (current.includes(markerLabel) ? current : [...current, markerLabel]));
    setTranscriptPreview("");
    setVoiceError(null);

    if (!map || !markerEntry || !questMarker) {
      return;
    }

    map.flyTo([questMarker.coordinates[1], questMarker.coordinates[0]], Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.85,
    });
    markerEntry.marker.openPopup();
  }

  function dismissTaskNotice(noticeId: string) {
    setTaskNotices((current) => current.filter((notice) => notice.id !== noticeId));
  }

  function stopRecognition() {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
  }

  function stopAudioPlayback() {
    audioRef.current?.pause();
    audioRef.current = null;

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function closeAcceptanceSheet() {
    stopRecognition();
    stopAudioPlayback();
    setIsAcceptanceOpen(false);
    setAcceptanceState("idle");
    setSelectedTaskId(null);
    setTranscriptPreview("");
    setVoiceError(null);
    setTextReply("");
    setConversation([]);
    setCurrentStep("briefing");
  }

  async function speakAssistantText(text: string, nextState: AcceptanceState) {
    if (!isSpeechOutputEnabled || typeof window === "undefined") {
      setAcceptanceState(nextState);
      return;
    }

    stopAudioPlayback();
    setAcceptanceState("speaking");

    try {
      const response = await fetch("/api/voice/tts", {
        body: JSON.stringify({
          language: selectedLanguageRef.current,
          text,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Speech output is unavailable right now.");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);

      audioRef.current = audio;
      audioUrlRef.current = audioUrl;

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => {
          stopAudioPlayback();
          setAcceptanceState(nextState);
          resolve();
        };
        audio.onerror = () => {
          stopAudioPlayback();
          setAcceptanceState(nextState);
          setVoiceError("Speech output is unavailable right now.");
          reject(new Error("Speech output is unavailable right now."));
        };

        audio.play().catch(reject);
      });
    } catch (error) {
      stopAudioPlayback();
      setAcceptanceState(nextState);
      setVoiceError(error instanceof Error ? error.message : "Speech output is unavailable right now.");
    }
  }

  async function requestAssistantReply(userTranscript: string) {
    const task = selectedTaskIdRef.current
      ? incomingTasks.find((item) => item.id === selectedTaskIdRef.current) ?? null
      : null;

    if (!task) {
      return;
    }

    const nextConversation =
      userTranscript.trim().length > 0
        ? [
            ...conversationRef.current,
            {
              content: userTranscript,
              role: "user" as const,
            },
          ]
        : conversationRef.current;

    if (userTranscript.trim().length > 0) {
      setConversation(nextConversation);
    }

    setAcceptanceState("thinking");
    setVoiceError(null);

    try {
      const response = await fetch("/api/voice/acceptance", {
        body: JSON.stringify({
          history: nextConversation,
          language: selectedLanguageRef.current,
          taskId: task.id,
          userTranscript,
        }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      const payload = (await response.json()) as AcceptanceReply & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Voice assistance is unavailable right now.");
      }

      const finalConversation = [
        ...nextConversation,
        {
          content: payload.assistantText,
          role: "assistant" as const,
        },
      ];

      setConversation(finalConversation);
      setCurrentStep(payload.nextStep);
      await speakAssistantText(payload.assistantText, getAcceptanceStateFromReply(payload.statusHint));
    } catch (error) {
      setVoiceError(error instanceof Error ? error.message : "Voice assistance is unavailable right now.");
      setAcceptanceState("needs_help");
    }
  }

  function startListening() {
    const RecognitionCtor = getRecognitionCtor();

    if (!RecognitionCtor) {
      setVoiceError("Voice input is not supported in this browser. Please use text reply.");
      return;
    }

    stopRecognition();
    setVoiceError(null);
    setTranscriptPreview("");

    const recognition = new RecognitionCtor();
    let finalTranscript = "";

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = getLanguageCode(selectedLanguageRef.current);
    recognition.onerror = () => {
      setAcceptanceState("needs_help");
      setVoiceError("Microphone access failed. Please try again or use text reply.");
    };
    recognition.onresult = (event) => {
      let interimTranscript = "";

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript ?? "";

        if (result.isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setTranscriptPreview((finalTranscript || interimTranscript).trim());

      if (finalTranscript.trim().length > 0) {
        recognition.stop();
      }
    };
    recognition.onend = () => {
      recognitionRef.current = null;

      if (finalTranscript.trim().length > 0) {
        setTranscriptPreview(finalTranscript.trim());
        void requestAssistantReply(finalTranscript.trim());
      } else {
        setAcceptanceState("briefing");
      }
    };

    recognitionRef.current = recognition;
    setAcceptanceState("listening");
    recognition.start();
  }

  function handleVoiceStart() {
    if (!selectedTask) {
      return;
    }

    const latestAssistantMessage = [...conversation].reverse().find((message) => message.role === "assistant");

    if (latestAssistantMessage && isSpeechOutputEnabled) {
      void speakAssistantText(latestAssistantMessage.content, "briefing").then(() => {
        startListening();
      });
      return;
    }

    startListening();
  }

  function handleLanguageChange(language: AcceptanceLanguage) {
    setSelectedLanguage(language);
    if (!selectedTask) {
      return;
    }

    stopRecognition();
    stopAudioPlayback();

    setConversation([]);
    setTextReply("");
    setTranscriptPreview("");
    setVoiceError(null);
    setCurrentStep("briefing");
    setAcceptanceState("briefing");
  }

  function handleDecline() {
    stopRecognition();
    stopAudioPlayback();
    setAcceptanceState("declined");
    setConversation((current) => [
      ...current,
      {
        content:
          selectedLanguage === "ja"
            ? "了解しました。この仕事は見送ります。必要なら後で再確認できます。"
            : "Understood. I will mark this task as declined. You can review it again later.",
        role: "assistant",
      },
    ]);
  }

  async function handleTextSubmit() {
    if (!textReply.trim()) {
      return;
    }

    const reply = textReply.trim();
    setTextReply("");
    setTranscriptPreview(reply);
    await requestAssistantReply(reply);
  }

  return (
    <>
      <div className="taskIngressLayer">
        <div className="taskNoticeStack">
          {taskNotices.map((notice, index) => {
            const isCurrent = index === 0;
            const { marker, task } = notice;
            return (
              <div
                className={`taskNoticeCard taskNoticeCard${notice.phase === "enter" ? "Enter" : "Exit"}${isCurrent ? " taskNoticeCardCurrent" : ""}`}
                key={notice.id}
                style={
                  {
                    "--task-accent": marker.accent,
                    "--task-color": marker.color,
                    "--stack-index": String(index),
                  } as CSSProperties
                }
              >
                <button
                  className="taskNoticeDismiss"
                  onClick={() => dismissTaskNotice(notice.id)}
                  aria-label="Dismiss notification"
                  type="button"
                >
                  ×
                </button>
                <button
                  className="taskNoticeCardAction"
                  onClick={() => focusTaskPin(task, marker.label)}
                  type="button"
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
                      {task.type} task opened for {task.location}. {task.reward}
                    </p>
                  </div>
                  <div className="taskNoticeFooter">
                    <span>{task.lane}</span>
                    <span>{isCurrent ? "view pin" : "queued"}</span>
                  </div>
                </button>
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
      {selectedTask && isAcceptanceOpen ? (
        <section className="acceptanceSheet">
          <div className="acceptanceSheetHandle" />
          <div className="acceptanceSheetHeader">
            <div>
              <span className="acceptanceEyebrow">{selectedTask.lane}</span>
              <h2>{selectedTask.title}</h2>
              <p>
                {selectedTask.location} • {selectedTask.reward} • {selectedTask.requiredSkill}
              </p>
            </div>
            <button className="acceptanceCloseButton" onClick={closeAcceptanceSheet} type="button">
              Close
            </button>
          </div>

          <div className="acceptanceLanguageRow">
            <button
              className={`acceptanceLanguageButton${selectedLanguage === "ja" ? " acceptanceLanguageButtonActive" : ""}`}
              onClick={() => handleLanguageChange("ja")}
              type="button"
            >
              JA
            </button>
            <button
              className={`acceptanceLanguageButton${selectedLanguage === "en" ? " acceptanceLanguageButtonActive" : ""}`}
              onClick={() => handleLanguageChange("en")}
              type="button"
            >
              EN
            </button>
            <label className="acceptanceSpeechToggle">
              <input
                checked={isSpeechOutputEnabled}
                onChange={(event) => setIsSpeechOutputEnabled(event.target.checked)}
                type="checkbox"
              />
              Voice output
            </label>
          </div>

          <div className="acceptanceStatusRow">
            <span className="acceptanceStateChip">{acceptanceState}</span>
            <span className="acceptanceStateMeta">Step: {currentStep}</span>
          </div>

          <div className="acceptanceBrief">
            <strong>{selectedLanguage === "ja" ? "Task briefing" : "Task briefing"}</strong>
            <p>{selectedTask.summary}</p>
          </div>

          <div className="acceptanceConversation">
            {conversation.map((message, index) => (
              <div
                className={`acceptanceBubble${message.role === "assistant" ? " acceptanceBubbleAssistant" : " acceptanceBubbleUser"}`}
                key={`${message.role}-${index}`}
              >
                {message.content}
              </div>
            ))}
            {transcriptPreview ? <div className="acceptanceTranscript">{transcriptPreview}</div> : null}
            {voiceError ? <div className="acceptanceError">{voiceError}</div> : null}
          </div>

          <div className="acceptanceActions">
            <button
              className="acceptancePrimaryButton"
              disabled={acceptanceState === "thinking"}
              onClick={handleVoiceStart}
              type="button"
            >
              {selectedLanguage === "ja" ? "音声で確認する" : "Start voice"}
            </button>
            <button className="acceptanceSecondaryButton" onClick={() => textReplyRef.current?.focus()} type="button">
              {selectedLanguage === "ja" ? "テキストで返答する" : "Reply with text"}
            </button>
            <button className="acceptanceSecondaryButton" onClick={handleDecline} type="button">
              {selectedLanguage === "ja" ? "辞退する" : "Decline"}
            </button>
          </div>

          <div className="acceptanceTextReply">
            <input
              onChange={(event) => setTextReply(event.target.value)}
              placeholder={selectedLanguage === "ja" ? "到着時間や可否を入力" : "Type availability, ETA, or questions"}
              ref={textReplyRef}
              value={textReply}
            />
            <button className="acceptancePrimaryButton" onClick={() => void handleTextSubmit()} type="button">
              {selectedLanguage === "ja" ? "送信" : "Send"}
            </button>
          </div>

          <div className="acceptanceFooterNote">
            {isVoiceSupported
              ? selectedLanguage === "ja"
                ? "マイクで返答できます。手が塞がっている場合は音声を使ってください。"
                : "You can reply by voice when your hands are busy."
              : selectedLanguage === "ja"
                ? "このブラウザでは音声入力に対応していないため、テキストで返答してください。"
                : "Voice input is unavailable in this browser, so please reply in text."}
          </div>
        </section>
      ) : null}
    </>
  );
}
