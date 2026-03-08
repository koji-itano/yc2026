/**
 * やおよろず神社 Blaxel Agent — Shrine Camera Monitoring
 * =======================================================
 * Monitors live camera feeds at Yaoyorozu Shrine and dispatches
 * human operators for tasks that only humans can solve.
 *
 * Usage:
 *   QUEST_API_URL=http://localhost:3000 npx tsx blaxel_agent.ts
 */

const QUEST_API_URL = process.env.QUEST_API_URL ?? "http://localhost:3000";
const QUEST_API_SECRET = process.env.QUEST_API_SECRET ?? "demo-hackathon-2026";
const AGENT_ID = "yaoyorozu-shrine-agent-v1";
const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_SEC ?? "10") * 1000;

const HEADERS = {
  "Authorization": `Bearer ${QUEST_API_SECRET}`,
  "Content-Type": "application/json",
};

// ── Camera zones at the shrine ───────────────────────────────────────────────
type Zone = {
  id: string;
  name: string;
  nameEn: string;
  camera: string;
};

const ZONES: Zone[] = [
  { id: "torii",    name: "鳥居前",   nameEn: "Main Torii Gate",   camera: "CAM-01" },
  { id: "sando",    name: "参道",     nameEn: "Stone Path",        camera: "CAM-02" },
  { id: "haiden",   name: "拝殿前",   nameEn: "Prayer Hall",       camera: "CAM-03" },
  { id: "temizuya", name: "手水舎",   nameEn: "Purification Font", camera: "CAM-04" },
  { id: "ema",      name: "絵馬掛け", nameEn: "Ema Board Area",    camera: "CAM-05" },
  { id: "parking",  name: "駐車場",   nameEn: "Parking Lot",       camera: "CAM-06" },
];

// ── What cameras can detect ──────────────────────────────────────────────────
type CameraData = {
  crowdDensity: number;    // 0–100
  hasLittering: boolean;
  hasFallenPerson: boolean;
  isWaterFountainEmpty: boolean;
  hasLostTourist: boolean;
  isOffLimitsEntry: boolean;
  photoShootCongestion: number; // 0–100
};

function readCameras(zone: Zone): CameraData {
  // Simulated camera AI detection results
  return {
    crowdDensity:          Math.floor(Math.random() * 101),
    hasFallenPerson:       Math.random() < 0.04,   // rare
    hasLittering:          Math.random() < 0.18,
    isWaterFountainEmpty:  Math.random() < 0.15,
    hasLostTourist:        Math.random() < 0.20,
    isOffLimitsEntry:      Math.random() < 0.06,
    photoShootCongestion:  Math.floor(Math.random() * 101),
  };
}

// ── Decision logic ───────────────────────────────────────────────────────────
type Quest = {
  title: string;
  summary: string;
  location: string;
  locationArea: string;
  type: string;
  priority: "high" | "medium" | "low";
  requiredSkill: string;
  reward: string;
  eta: string;
  lane: string;
  markerLabel: string;
  agentId: string;
};

function evaluate(cam: CameraData, zone: Zone): Quest | null {
  const loc = `Yaoyorozu Shrine — ${zone.nameEn}`;
  const area = "Yaoyorozu Shrine";

  // Priority 1: Medical / Safety
  if (cam.hasFallenPerson) {
    return {
      title: `[URGENT] Person Down — ${zone.nameEn}`,
      summary: `${zone.camera} detected a fallen individual at ${zone.nameEn}. Please confirm safety and provide first aid if needed.`,
      location: loc, locationArea: area,
      type: "Alert", priority: "high",
      requiredSkill: "First Aid",
      reward: "+60 safety XP", eta: "ETA 00:03",
      lane: "Emergency lane E1", markerLabel: "SOS",
      agentId: AGENT_ID,
    };
  }

  // Priority 2: Off-limits / Security
  if (cam.isOffLimitsEntry) {
    return {
      title: `Restricted Area Intrusion — ${zone.nameEn}`,
      summary: `${zone.camera} detected unauthorized entry into a restricted area at ${zone.nameEn}. Please guide the individual out politely.`,
      location: loc, locationArea: area,
      type: "Security", priority: "high",
      requiredSkill: "Navigation",
      reward: "+40 security XP", eta: "ETA 00:05",
      lane: "Security lane S1", markerLabel: "SEC",
      agentId: AGENT_ID,
    };
  }

  // Priority 3: Crowd control
  if (cam.crowdDensity > 80) {
    return {
      title: `Crowd Overload — ${zone.nameEn}`,
      summary: `${zone.camera} detected ${cam.crowdDensity}% crowd density at ${zone.nameEn}. Please help direct visitors for smooth flow.`,
      location: loc, locationArea: area,
      type: "Navigation", priority: "high",
      requiredSkill: "Navigation",
      reward: "+30 crowd XP", eta: "ETA 00:08",
      lane: "Crowd lane C1", markerLabel: "NAV",
      agentId: AGENT_ID,
    };
  }

  // Priority 4: Lost tourist
  if (cam.hasLostTourist) {
    return {
      title: `Lost Visitor Assist — ${zone.nameEn}`,
      summary: `${zone.camera} detected a confused tourist near ${zone.nameEn} holding a map. Please approach and assist with directions.`,
      location: loc, locationArea: area,
      type: "Tourism", priority: "medium",
      requiredSkill: "Tourism",
      reward: "+20 guide XP", eta: "ETA 00:10",
      lane: "Guide lane G2", markerLabel: "TOUR",
      agentId: AGENT_ID,
    };
  }

  // Priority 5: Water fountain empty
  if (cam.isWaterFountainEmpty && zone.id === "temizuya") {
    return {
      title: `Purification Fountain — Water Low`,
      summary: `${zone.camera} detected low water level at the purification font. Please refill or report to site management.`,
      location: loc, locationArea: area,
      type: "Inspection", priority: "medium",
      requiredSkill: "Inspection",
      reward: "+18 ops XP", eta: "ETA 00:15",
      lane: "Ops lane O1", markerLabel: "INSP",
      agentId: AGENT_ID,
    };
  }

  // Priority 6: Littering
  if (cam.hasLittering) {
    return {
      title: `Grounds Cleanup — ${zone.nameEn}`,
      summary: `${zone.camera} detected littering at ${zone.nameEn}. Please collect and dispose of waste to maintain site cleanliness.`,
      location: loc, locationArea: area,
      type: "Gig Work", priority: "low",
      requiredSkill: "Cleaning",
      reward: "+12 eco XP", eta: "ETA 00:20",
      lane: "Clean lane K1", markerLabel: "GIG",
      agentId: AGENT_ID,
    };
  }

  // Priority 7: Photo spot congestion
  if (cam.photoShootCongestion > 75 && zone.id === "torii") {
    return {
      title: `Torii Gate Photo Queue Backup`,
      summary: `${zone.camera} detected photo queue congestion at the Torii Gate (${cam.photoShootCongestion}%). Please help manage visitor order.`,
      location: loc, locationArea: area,
      type: "Navigation", priority: "low",
      requiredSkill: "Navigation",
      reward: "+15 coord XP", eta: "ETA 00:12",
      lane: "Photo lane P1", markerLabel: "NAV",
      agentId: AGENT_ID,
    };
  }

  return null; // No action needed
}

// ── Push quest ───────────────────────────────────────────────────────────────
async function pushQuest(quest: Quest): Promise<void> {
  const res = await fetch(`${QUEST_API_URL}/api/quests`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify(quest),
  });

  if (res.status === 201) {
    console.log(`  ✅ [${quest.priority.toUpperCase()}] ${quest.title}`);
  } else {
    console.warn(`  ⚠️  ${res.status}: ${(await res.text()).slice(0, 80)}`);
  }
}

// ── Main loop ────────────────────────────────────────────────────────────────
async function main() {
  console.log("⛩  Yaoyorozu Shrine — Monitoring Agent Started");
  console.log(`   Agent: ${AGENT_ID}`);
  console.log(`   Target: ${QUEST_API_URL}/api/quests`);
  console.log(`   Monitoring ${ZONES.length} camera zones\n`);

  let cycle = 0;
  while (true) {
    cycle++;
    const zone = ZONES[Math.floor(Math.random() * ZONES.length)];
    const now = new Date().toTimeString().slice(0, 8);

    console.log(`[${now}] Cycle ${cycle} — ${zone.camera} (${zone.nameEn})`);

    const cam = readCameras(zone);
    console.log(
      `  crowd=${cam.crowdDensity}%  ` +
      `fall=${cam.hasFallenPerson}  litter=${cam.hasLittering}  ` +
      `water=${cam.isWaterFountainEmpty}  lost=${cam.hasLostTourist}`
    );

    const quest = evaluate(cam, zone);
    if (quest) {
      await pushQuest(quest);
    } else {
      console.log("  ✓ All clear — no action required");
    }

    console.log();
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main().catch(console.error);
