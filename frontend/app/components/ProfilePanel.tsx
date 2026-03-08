"use client";

import { useState } from "react";

const SKILL_OPTIONS = [
  "Navigation", "Dispatch", "Tourism", "Inspection",
  "Field Research", "Photography", "Language", "Courier",
];

const AREA_OPTIONS = [
  "Shibuya", "Shinjuku", "Ginza", "Akihabara",
  "Minato", "Marunouchi", "Harajuku", "Roppongi",
];

const STATS = [
  { label: "Route XP",     value: 1240, max: 2000, color: "#4ee6ff" },
  { label: "Dispatch XP",  value: 880,  max: 2000, color: "#8f72ff" },
  { label: "Guide XP",     value: 320,  max: 2000, color: "#4e8cff" },
  { label: "Research XP",  value: 560,  max: 2000, color: "#68d5ff" },
];

export function ProfilePanel() {
  const [name, setName]         = useState("Field Agent #7742");
  const [skills, setSkills]     = useState<string[]>(["Navigation", "Dispatch"]);
  const [areas, setAreas]       = useState<string[]>(["Shibuya", "Shinjuku"]);
  const [saved, setSaved]       = useState(false);

  function toggleSkill(skill: string) {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
    setSaved(false);
  }

  function toggleArea(area: string) {
    setAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
    setSaved(false);
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2400);
  }

  const totalXp = STATS.reduce((a, s) => a + s.value, 0);
  const level   = Math.floor(totalXp / 250);

  return (
    <div className="profilePanel">

      {/* Hero card */}
      <div className="profileHero">
        <div className="profileAvatarWrap">
          <div className="profileAvatar">
            <span className="profileAvatarGlyph">⚔</span>
          </div>
          <div className="profileAvatarLevel">
            <span>LV</span><strong>{level}</strong>
          </div>
        </div>
        <div className="profileHeroInfo">
          <p className="profileEyebrow">FIELD AGENT</p>
          <p className="profileXpTotal">{totalXp.toLocaleString()} XP</p>
          <div className="profileXpBar">
            <div
              className="profileXpBarFill"
              style={{ width: `${((totalXp % 250) / 250) * 100}%` }}
            />
          </div>
          <p className="profileXpNext">{250 - (totalXp % 250)} XP to LV {level + 1}</p>
        </div>
      </div>

      {/* Stat bars */}
      <section className="profileSection">
        <h2 className="profileSectionTitle">STAT BREAKDOWN</h2>
        <div className="profileStats">
          {STATS.map(({ label, value, max, color }) => (
            <div key={label} className="profileStat">
              <div className="profileStatHeader">
                <span>{label}</span>
                <span style={{ color }}>{value}</span>
              </div>
              <div className="profileStatBar">
                <div
                  className="profileStatBarFill"
                  style={{ width: `${(value / max) * 100}%`, background: color }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Identity */}
      <section className="profileSection">
        <h2 className="profileSectionTitle">IDENTITY</h2>
        <label className="profileLabel">
          <span>Agent Name</span>
          <input
            className="profileInput"
            value={name}
            onChange={(e) => { setName(e.target.value); setSaved(false); }}
            maxLength={40}
          />
        </label>
      </section>

      {/* Skills */}
      <section className="profileSection">
        <h2 className="profileSectionTitle">SKILLS</h2>
        <div className="profileTagGrid">
          {SKILL_OPTIONS.map((skill) => (
            <button
              key={skill}
              className={`profileTag${skills.includes(skill) ? " profileTagActive" : ""}`}
              onClick={() => toggleSkill(skill)}
            >
              {skill}
            </button>
          ))}
        </div>
      </section>

      {/* Areas */}
      <section className="profileSection">
        <h2 className="profileSectionTitle">ACTIVE ZONES</h2>
        <div className="profileTagGrid">
          {AREA_OPTIONS.map((area) => (
            <button
              key={area}
              className={`profileTag${areas.includes(area) ? " profileTagActive" : ""}`}
              onClick={() => toggleArea(area)}
            >
              {area}
            </button>
          ))}
        </div>
      </section>

      {/* Save */}
      <button
        className={`profileSaveBtn${saved ? " profileSaveBtnSuccess" : ""}`}
        onClick={handleSave}
      >
        {saved ? "✓ SAVED" : "SAVE PROFILE"}
      </button>
    </div>
  );
}
