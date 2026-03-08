"use client";

import { useState } from "react";
import { HeroMap } from "./HeroMap";
import { QuestPanel } from "./QuestPanel";
import { ProfilePanel } from "./ProfilePanel";

type Tab = "map" | "quests" | "profile";

const NAV_ITEMS: { id: Tab; icon: string; label: string }[] = [
  { id: "map", icon: "🗺", label: "MAP" },
  { id: "quests", icon: "⚡", label: "QUESTS" },
  { id: "profile", icon: "👤", label: "PROFILE" },
];

export function HomeDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>("map");

  return (
    <div className="homeDashboard">
      {/* Header */}
      <header className="homeHeader">
        <div className="homeHeaderBrand">
          <span className="homeHeaderLogo">⚔</span>
          <span className="homeHeaderTitle">Yaorozu God OS</span>
        </div>
        <div className="homeHeaderRight">
          <div className="homeXpBadge">
            <span className="homeXpLabel">LV</span>
            <span className="homeXpValue">12</span>
          </div>
          <div className="homeOnlineIndicator" aria-label="Online" />
        </div>
      </header>

      {/* Main Content */}
      <main className="homeMain">
        {activeTab === "map" && (
          <div className="homeMapView">
            <HeroMap />
          </div>
        )}
        {activeTab === "quests" && (
          <div className="homeScrollView">
            <QuestPanel />
          </div>
        )}
        {activeTab === "profile" && (
          <div className="homeScrollView">
            <ProfilePanel />
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bottomNav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, icon, label }) => (
          <button
            key={id}
            className={`bottomNavItem${activeTab === id ? " bottomNavItemActive" : ""}`}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? "page" : undefined}
          >
            <span className="bottomNavIcon">{icon}</span>
            <span className="bottomNavLabel">{label}</span>
            {activeTab === id && <span className="bottomNavGlow" aria-hidden="true" />}
          </button>
        ))}
      </nav>
    </div>
  );
}
