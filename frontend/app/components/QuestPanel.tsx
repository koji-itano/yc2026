"use client";

import { useEffect, useState } from "react";
import incomingTasksData from "../data/incomingTasks.json";

type Task = {
  eta: string;
  id: string;
  lane: string;
  location: string;
  markerLabel: string;
  priority: string;
  requiredSkill: string;
  reward: string;
  summary: string;
  title: string;
  type: string;
};

type TaskRecommendation = {
  reason: string;
  score: number;
  task: Task;
};

type RecommendState =
  | { status: "idle" | "loading" }
  | { status: "error"; error: string }
  | {
      status: "success";
      candidate: { name: string; title: string; company: string; score: number };
      recommendations: TaskRecommendation[];
    };

const tasks = incomingTasksData as Task[];

const TYPE_META: Record<string, { color: string; accent: string; icon: string }> = {
  Navigation: { color: "#4ee6ff", accent: "#b5fff4", icon: "🧭" },
  "Gig Work":  { color: "#8f72ff", accent: "#ddd5ff", icon: "📦" },
  Tourism:     { color: "#4e8cff", accent: "#d2e6ff", icon: "🏙" },
  Inspection:  { color: "#f25fff", accent: "#ffd7fa", icon: "🔍" },
  Learning:    { color: "#68d5ff", accent: "#ddfbff", icon: "📡" },
};

const PRIORITY_LABEL: Record<string, string> = {
  high:   "HIGH",
  medium: "MED",
  low:    "LOW",
};

export function QuestPanel() {
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [recommendState, setRecommendState] = useState<RecommendState>({ status: "idle" });

  function toggleAccept(id: string) {
    setAcceptedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

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
        <div className="questPanelBadge">{tasks.length} open</div>
      </div>

      {/* ── Recommended by AI ─────────────────────────────── */}
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

      {/* ── All Quests ─────────────────────────────────────── */}
      <div className="questAllHeader">
        <span className="questAllEyebrow">ALL QUESTS</span>
      </div>

      <ul className="questList" role="list">
        {tasks.map((task) => {
          const meta = TYPE_META[task.type] ?? TYPE_META["Navigation"];
          const isAccepted = acceptedIds.has(task.id);
          return (
            <li
              key={task.id}
              className={`questCard${isAccepted ? " questCardAccepted" : ""}`}
              style={
                {
                  "--q-color": meta.color,
                  "--q-accent": meta.accent,
                } as React.CSSProperties
              }
            >
              {/* Card top: icon + title + priority */}
              <div className="questCardTop">
                <span className="questCardIcon">{meta.icon}</span>
                <div className="questCardMeta">
                  <span className="questCardType">{task.type}</span>
                  <h2 className="questCardTitle">{task.title}</h2>
                </div>
                <span
                  className={`questCardPriority questCardPriority${task.priority}`}
                >
                  {PRIORITY_LABEL[task.priority]}
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
