"use client";

import { useEffect, useRef, useState } from "react";

type Quest = {
  eta: string;
  id: string;
  lane: string;
  location: string;
  locationArea?: string;
  markerLabel: string;
  priority: string;
  requiredSkill: string;
  reward: string;
  summary: string;
  title: string;
  type: string;
  createdAt?: string;
  agentId?: string;
};

type TaskRecommendation = {
  reason: string;
  score: number;
  task: Quest;
};

type RecommendState =
  | { status: "idle" | "loading" }
  | { status: "error"; error: string }
  | {
      status: "success";
      candidate: { name: string; title: string; company: string; score: number };
      recommendations: TaskRecommendation[];
    };

const TYPE_META: Record<string, { color: string; accent: string; icon: string }> = {
  Navigation: { color: "#4ee6ff", accent: "#b5fff4", icon: "🧭" },
  "Gig Work":  { color: "#8f72ff", accent: "#ddd5ff", icon: "📦" },
  Tourism:     { color: "#4e8cff", accent: "#d2e6ff", icon: "🏙" },
  Inspection:  { color: "#f25fff", accent: "#ffd7fa", icon: "🔍" },
  Learning:    { color: "#68d5ff", accent: "#ddfbff", icon: "📡" },
  Alert:       { color: "#ff7043", accent: "#ffe0d7", icon: "🚨" },
  Security:    { color: "#ffd740", accent: "#fff8e0", icon: "🛡" },
  Monitoring:  { color: "#69f0ae", accent: "#d7fff0", icon: "📷" },
};

const PRIORITY_LABEL: Record<string, string> = {
  high:   "HIGH",
  medium: "MED",
  low:    "LOW",
};

const POLL_INTERVAL_MS = 5000;

export function QuestPanel() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [questsLoading, setQuestsLoading] = useState(true);
  const [newQuestIds, setNewQuestIds] = useState<Set<string>>(new Set());
  const prevQuestIdsRef = useRef<Set<string>>(new Set());

  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [recommendState, setRecommendState] = useState<RecommendState>({ status: "idle" });

  async function toggleAccept(id: string) {
    const isCurrentlyAccepted = acceptedIds.has(id);
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlyAccepted) next.delete(id);
      else next.add(id);
      return next;
    });
    if (!isCurrentlyAccepted) {
      // Persist accepted status to server for company dashboard
      fetch(`/api/quests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "accepted" }),
      }).catch(() => {/* silently ignore */});
    }
  }



  // ── Poll /api/quests every 5 seconds ──────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchQuests() {
      try {
        const res = await fetch("/api/quests", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { quests: Quest[] };

        if (cancelled) return;

        setQuests(data.quests);
        setQuestsLoading(false);

        // Detect newly arrived quests for a "NEW" badge animation
        const incoming = new Set(data.quests.map((q) => q.id));
        const fresh = new Set<string>();
        for (const id of incoming) {
          if (!prevQuestIdsRef.current.has(id)) fresh.add(id);
        }
        if (fresh.size > 0) {
          setNewQuestIds((prev) => new Set([...prev, ...fresh]));
          // Remove "NEW" badge after 6 seconds
          setTimeout(() => {
            setNewQuestIds((prev) => {
              const next = new Set(prev);
              for (const id of fresh) next.delete(id);
              return next;
            });
          }, 6000);
        }
        prevQuestIdsRef.current = incoming;
      } catch {
        // Silently ignore fetch errors during polling
      }
    }

    fetchQuests();
    const interval = setInterval(fetchQuests, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // ── AI recommendations ─────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setRecommendState({ status: "loading" });

    fetch("/api/recommend", { cache: "no-store", signal: controller.signal })
      .then(async (res) => {
        const payload = (await res.json()) as {
          candidate?: { name: string; title: string; company: string; score: number };
          recommendations?: TaskRecommendation[];
          error?: string;
        };

        if (!res.ok || !Array.isArray(payload.recommendations)) {
          throw new Error(payload.error ?? "Could not load recommendations.");
        }

        setRecommendState({
          status: "success",
          candidate: payload.candidate!,
          recommendations: payload.recommendations,
        });
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setRecommendState({
          status: "error",
          error: err instanceof Error ? err.message : "Could not load recommendations.",
        });
      });

    return () => controller.abort();
  }, []);


  return (
    <div className="questPanel">
      <div className="questPanelHeader">
        <div>
          <p className="questPanelEyebrow">INCOMING REQUESTS</p>
          <h1 className="questPanelTitle">Active Quests</h1>
        </div>
        <div className="questPanelBadge" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span>{questsLoading ? "…" : quests.length} open</span>
          {/* Live pulse indicator */}
          <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.65rem", opacity: 0.7 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", background: "#4ee6ff",
              animation: "questLivePulse 2s ease-in-out infinite",
              display: "inline-block"
            }} />
            LIVE
          </span>
        </div>
      </div>

      {/* ── Recommended by AI ─────────────────────────────────────────────── */}
      <div className="questRecommendBlock">
        <div className="questRecommendHeader">
          <span className="questRecommendEyebrow">✦ AI RECOMMENDED</span>
          {recommendState.status === "success" && recommendState.candidate && (
            <span className="questRecommendSource">
              via {recommendState.candidate.name}
            </span>
          )}
        </div>

        {(recommendState.status === "idle" || recommendState.status === "loading") && (
          <div className="questRecommendLoading">
            <span className="questRecommendSpinner" aria-hidden="true" />
            Scanning Crustdata profiles…
          </div>
        )}

        {recommendState.status === "error" && (
          <div className="questRecommendError">{recommendState.error}</div>
        )}

        {recommendState.status === "success" && recommendState.recommendations.length === 0 && (
          <div className="questRecommendError">No recommendations available.</div>
        )}

        {recommendState.status === "success" && recommendState.recommendations.length > 0 && (
          <ul className="questRecommendList" role="list">
            {recommendState.recommendations.map(({ task, score, reason }) => {
              const meta = TYPE_META[task.type] ?? TYPE_META["Navigation"];
              const isAccepted = acceptedIds.has(task.id);
              return (
                <li
                  key={task.id}
                  className={`questRecommendCard${isAccepted ? " questRecommendCardAccepted" : ""}`}
                  style={{ "--q-color": meta.color, "--q-accent": meta.accent } as React.CSSProperties}
                >
                  <div className="questRecommendCardTop">
                    <span className="questCardIcon" style={{ fontSize: "1.1rem" }}>{meta.icon}</span>
                    <div className="questRecommendCardMeta">
                      <span className="questRecommendCardType">{task.type}</span>
                      <strong className="questRecommendCardTitle">{task.title}</strong>
                      <span className="questRecommendCardReason">{reason}</span>
                    </div>
                    <div className="questRecommendScore">{score}</div>
                  </div>
                  <div className="questRecommendCardFooter">
                    <span className="questCardReward">
                      <span className="questCardRewardIcon">✦</span>
                      {task.reward}
                    </span>
                    <button
                      className={`questAcceptBtn${isAccepted ? " questAcceptBtnDone" : ""}`}
                      onClick={() => toggleAccept(task.id)}
                    >
                      {isAccepted ? "✓ ACCEPTED" : "ACCEPT"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── All Quests (live from API) ─────────────────────────────────────── */}
      <div className="questAllHeader">
        <span className="questAllEyebrow">ALL QUESTS</span>
      </div>

      {questsLoading && (
        <div className="questRecommendLoading">
          <span className="questRecommendSpinner" aria-hidden="true" />
          Loading quests…
        </div>
      )}

      <ul className="questList" role="list">
        {quests.map((task) => {
          const meta = TYPE_META[task.type] ?? TYPE_META["Navigation"];
          const isAccepted = acceptedIds.has(task.id);
          const isNew = newQuestIds.has(task.id);
          return (
            <li
              key={task.id}
              className={`questCard${isAccepted ? " questCardAccepted" : ""}${isNew ? " questCardNew" : ""}`}
              style={{ "--q-color": meta.color, "--q-accent": meta.accent } as React.CSSProperties}
            >
              {/* NEW badge for agent-pushed quests */}
              {isNew && (
                <span className="questCardNewBadge">🤖 NEW</span>
              )}

              {/* Card top: icon + title + priority */}
              <div className="questCardTop">
                <span className="questCardIcon">{meta.icon}</span>
                <div className="questCardMeta">
                  <span className="questCardType">{task.type}</span>
                  <h2 className="questCardTitle">{task.title}</h2>
                  {task.agentId && (
                    <span style={{ fontSize: "0.65rem", opacity: 0.5, letterSpacing: "0.05em" }}>
                      via {task.agentId}
                    </span>
                  )}
                </div>
                <span className={`questCardPriority questCardPriority${task.priority}`}>
                  {PRIORITY_LABEL[task.priority] ?? task.priority.toUpperCase()}
                </span>
              </div>

              {/* Location + ETA */}
              <div className="questCardLocation">
                <span className="questCardLocationPin">📍</span>
                <span>{task.location}</span>
                <span className="questCardEta">{task.eta}</span>
              </div>

              {/* Summary */}
              <p className="questCardSummary">{task.summary}</p>

              {/* Footer: reward + accept button */}
              <div className="questCardFooter">
                <div className="questCardReward">
                  <span className="questCardRewardIcon">✦</span>
                  <span>{task.reward}</span>
                </div>
                <button
                  className={`questAcceptBtn${isAccepted ? " questAcceptBtnDone" : ""}`}
                  onClick={() => toggleAccept(task.id)}
                >
                  {isAccepted ? "✓ ACCEPTED" : "ACCEPT"}
                </button>
              </div>

              {/* Glow border on accepted */}
              {isAccepted && <span className="questCardAcceptedGlow" aria-hidden="true" />}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
