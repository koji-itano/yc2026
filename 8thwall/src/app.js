import itoenBottleTarget from '../image-targets/itoen-bottle-168h.json'
import canisterCapTarget from '../image-targets/canister-cap.json'

const PROOF_HANDOFF_STORAGE_KEY = "rpg:latest-proof-handoff";
const PROOF_HANDOFF_CHANNEL = "rpg-proof-handoff";
const VERIFICATION_STORAGE_KEY = "rpg:latest-verification";
const VERIFICATION_CHANNEL = "rpg-verification";
const HANDOFF_API_ENDPOINT = "/api/handoff";
const VERIFICATION_API_ENDPOINT = "/api/verification";

const state = {
  appRole: readAppRole(),
  sessionId: newSessionId(),
  taskId: "WIL-9-canister",
  taskLabel: "Canister secure check",
  workerId: "worker-07",
  instruction: "Turn clockwise to secure the cap.",
  taskClass: "green task",
  provider: "8th Wall runtime",
  trackingStatus: "Waiting for XR runtime",
  targetName: "waiting",
  targetLocked: false,
  anchorMode: "unlocked",
  attemptNumber: 0,
  beforeCapture: null,
  afterCapture: null,
  instructionCompletedAt: null,
  proofRecord: null,
  handoffRecord: null,
  verificationRecord: null,
  eventLog: [],
  imageTargetsConfigured: [],
  activeTargetProfile: "itoen-bottle",
  activeTargetLabel: "Ito En bottle front",
  cameraStatus: "booting",
  desktopWebcamEnabled: false,
  desktopStream: null,
  desktopPreviewFrame: null,
  liveCameraEnabled: false,
  liveCameraStream: null,
  focusMode: false,
  targetScreenPose: null,
};

const DOM = {};
let proofChannel = null;
let verificationChannel = null;
let proofEventSource = null;
let verificationEventSource = null;

function readAppRole() {
  const params = new URLSearchParams(window.location.search);
  return params.get("role") === "dashboard" ? "dashboard" : "worker";
}

function newSessionId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `rpg-8thwall-${stamp}-${suffix}`;
}

function nowIso() {
  return new Date().toISOString();
}

function getWorkerUrl() {
  const url = new URL(window.location.href);
  url.searchParams.delete("role");
  return url.toString();
}

function getDashboardUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("role", "dashboard");
  return url.toString();
}

function getProofChannel() {
  if (proofChannel || typeof BroadcastChannel !== "function") {
    return proofChannel;
  }

  proofChannel = new BroadcastChannel(PROOF_HANDOFF_CHANNEL);
  return proofChannel;
}

function getVerificationChannel() {
  if (verificationChannel || typeof BroadcastChannel !== "function") {
    return verificationChannel;
  }

  verificationChannel = new BroadcastChannel(VERIFICATION_CHANNEL);
  return verificationChannel;
}

function safeReadStoredJson(key) {
  if (!window.localStorage || typeof window.localStorage.getItem !== "function") {
    return null;
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

async function postJson(url, payload) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function pickNumber(...values) {
  return values.find((value) => typeof value === "number" && Number.isFinite(value));
}

function extractTargetPose(detail = {}) {
  const x = pickNumber(detail.x, detail.position?.x, detail.center?.x, detail.coordinates?.x, 0.5);
  const y = pickNumber(detail.y, detail.position?.y, detail.center?.y, detail.coordinates?.y, 0.58);
  const scale = pickNumber(
    detail.scale,
    detail.position?.scale,
    detail.size?.height,
    detail.extent?.height,
    0.32,
  );

  return {
    x: clamp(x, 0.1, 0.9),
    y: clamp(y, 0.15, 0.9),
    scale: clamp(scale, 0.12, 0.7),
  };
}

function recordEvent(type, detail = {}) {
  state.eventLog.push({
    at: nowIso(),
    type,
    detail,
  });
  if (state.eventLog.length > 20) {
    state.eventLog.shift();
  }
}

function getTargetProfiles() {
  return {
    "itoen-bottle": {
      label: "Ito En bottle front",
      targets: [itoenBottleTarget],
      waitingTitle: "Use the Ito En bottle front",
      waitingBody: "Keep the bottle front upright and centered so the green label fills about half the frame.",
    },
    "canister-cap": {
      label: "Canister cap photo",
      targets: [canisterCapTarget],
      waitingTitle: "Use the canister cap target",
      waitingBody: "Show the printed canister-cap target flat to the camera and reduce glare.",
    },
    all: {
      label: "All targets",
      targets: [itoenBottleTarget, canisterCapTarget],
      waitingTitle: "Use the Ito En bottle first",
      waitingBody: "Start with the Ito En bottle front. If it misses, switch to the canister photo target.",
    },
  }
}

function getRequestedTargetProfile() {
  const params = new URLSearchParams(window.location.search)
  const requested = (params.get("target") || "").toLowerCase()
  const profiles = getTargetProfiles()

  if (profiles[requested]) {
    return requested
  }

  return isDesktopBrowser() ? "all" : "itoen-bottle"
}

function formatTargetName(name) {
  if (!name || name === "waiting") {
    return "waiting"
  }
  if (name === "manual-fallback") {
    return "manual fallback"
  }

  const profiles = getTargetProfiles()
  const byTargetName = Object.values(profiles).find((profile) =>
    profile.targets.some((target) => target.name === name)
  )

  if (byTargetName) {
    return byTargetName.label
  }

  return name
}

function buildWorkerOverlayHtml() {
  return `
    <section class="rpg-topbar">
      <p class="rpg-eyebrow">Real Physical Gigs x 8th Wall</p>
      <h1 class="rpg-title">Canister AR guidance</h1>
      <p class="rpg-subtitle">
        Tabletop worker flow for tightening the canister cap, capturing before/after proof, and
        handing a structured record back to the dashboard.
      </p>
      <div class="rpg-chip-row">
        <span class="rpg-chip" id="rpg-target-found-chip">Image target: waiting</span>
        <span class="rpg-chip" id="rpg-status-chip">Status: booting</span>
        <span class="rpg-chip" id="rpg-expected-target-chip">Expected: Ito En bottle front</span>
        <span class="rpg-chip" id="rpg-target-chip">Target: waiting</span>
        <span class="rpg-chip" id="rpg-camera-chip">Camera: booting</span>
        <button id="rpg-focus-button" class="rpg-focus-toggle" type="button">Hide controls</button>
      </div>
    </section>
    <div class="rpg-detection-guide" id="rpg-detection-guide">
      <div class="rpg-detection-frame" aria-hidden="true"></div>
      <div class="rpg-detection-copy">
        <p class="rpg-detection-title" id="rpg-detection-title">Use the Ito En bottle front</p>
        <p class="rpg-detection-body" id="rpg-detection-body">
          Keep the bottle front upright and centered so the green label fills about half the frame.
        </p>
      </div>
    </div>
    <div class="rpg-guidance" id="rpg-guidance">
      <div class="rpg-guidance-arrow" aria-hidden="true">↻</div>
      <div class="rpg-guidance-label" id="rpg-guidance-label">Turn clockwise to secure the cap.</div>
    </div>
    <div class="rpg-main">
      <section class="rpg-card">
        <p class="rpg-eyebrow">Worker task</p>
        <h2>Turn clockwise to secure the cap.</h2>
        <dl class="rpg-meta">
          <div>
            <dt>Task ID</dt>
            <dd id="rpg-task-id"></dd>
          </div>
          <div>
            <dt>Worker ID</dt>
            <dd id="rpg-worker-id"></dd>
          </div>
          <div>
            <dt>Session ID</dt>
            <dd id="rpg-session-id"></dd>
          </div>
          <div>
            <dt>Attempt</dt>
            <dd id="rpg-attempt"></dd>
          </div>
        </dl>
        <p class="rpg-note" id="rpg-note">
          Waiting for 8th Wall runtime and image target callbacks.
        </p>
        <div class="rpg-actions">
          <button id="rpg-webcam-button" class="secondary">Enable desktop webcam</button>
          <button id="rpg-lock-button" class="secondary">Lock manual anchor</button>
          <button id="rpg-before-button" class="secondary">Capture before</button>
          <button id="rpg-done-button" class="secondary">Mark cap secured</button>
          <button id="rpg-after-button" class="secondary">Capture after</button>
          <button id="rpg-proof-button">Generate proof JSON</button>
          <button id="rpg-copy-button" class="secondary">Copy proof</button>
        </div>
        <div class="rpg-preview-row">
          <div class="rpg-preview">
            <div class="rpg-preview-label">Before</div>
            <div id="rpg-before-slot" class="rpg-preview-empty">No capture yet.</div>
          </div>
          <div class="rpg-preview">
            <div class="rpg-preview-label">After</div>
            <div id="rpg-after-slot" class="rpg-preview-empty">No capture yet.</div>
          </div>
        </div>
      </section>
      <section class="rpg-proof">
        <p class="rpg-eyebrow">Structured handoff</p>
        <h2>Proof package</h2>
        <pre id="rpg-proof-output">Capture before/after evidence to generate a proof package.</pre>
        <div class="rpg-log" id="rpg-log"></div>
      </section>
    </div>
  `;
}

function buildDashboardOverlayHtml() {
  return `
    <section class="rpg-topbar">
      <p class="rpg-eyebrow">Real Physical Gigs x 8th Wall</p>
      <h1 class="rpg-title">Proof receiver dashboard</h1>
      <p class="rpg-subtitle">
        Review worker proof, inspect before/after evidence, and return a verification result to the phone.
      </p>
      <div class="rpg-chip-row">
        <span class="rpg-chip" id="rpg-receiver-status-chip">Waiting for worker handoff</span>
        <span class="rpg-chip" id="rpg-receiver-route-chip">Route: server event bus</span>
        <button id="rpg-refresh-button" class="rpg-focus-toggle" type="button">Refresh</button>
      </div>
    </section>
    <div class="rpg-dashboard-main">
      <section class="rpg-card">
        <p class="rpg-eyebrow">Incoming proof</p>
        <h2 id="rpg-dashboard-summary-title">Proof package ready for verification</h2>
        <dl class="rpg-meta">
          <div>
            <dt>Task ID</dt>
            <dd id="rpg-dashboard-task-id">No handoff yet</dd>
          </div>
          <div>
            <dt>Worker ID</dt>
            <dd id="rpg-dashboard-worker-id">No handoff yet</dd>
          </div>
          <div>
            <dt>Provider</dt>
            <dd id="rpg-dashboard-provider">No handoff yet</dd>
          </div>
          <div>
            <dt>Attempt</dt>
            <dd id="rpg-dashboard-attempt">Awaiting proof</dd>
          </div>
          <div>
            <dt>Result</dt>
            <dd id="rpg-dashboard-result">Awaiting proof</dd>
          </div>
          <div>
            <dt>Task Class</dt>
            <dd id="rpg-dashboard-task-class">Awaiting proof</dd>
          </div>
        </dl>
        <p class="rpg-note" id="rpg-dashboard-summary">
          Open the worker page on the phone and submit proof to populate this dashboard.
        </p>
        <label class="rpg-note-field" for="rpg-verification-note-input">
          Verification note
          <textarea id="rpg-verification-note-input" placeholder="Optional note to send back to the worker"></textarea>
        </label>
        <p class="rpg-note" id="rpg-verification-action-summary">
          Choose a verification outcome after reviewing the proof package.
        </p>
        <div class="rpg-dashboard-actions">
          <button id="rpg-verify-button" type="button">Verify proof</button>
          <button id="rpg-retry-button" class="secondary" type="button">Request retry</button>
        </div>
        <div class="rpg-preview-row">
          <div class="rpg-preview">
            <div class="rpg-preview-label">Before</div>
            <div class="rpg-preview-label" id="rpg-dashboard-before-meta">Not available</div>
            <div id="rpg-dashboard-before-slot" class="rpg-preview-empty">No evidence yet.</div>
          </div>
          <div class="rpg-preview">
            <div class="rpg-preview-label">After</div>
            <div class="rpg-preview-label" id="rpg-dashboard-after-meta">Not available</div>
            <div id="rpg-dashboard-after-slot" class="rpg-preview-empty">No evidence yet.</div>
          </div>
        </div>
      </section>
      <section class="rpg-proof">
        <p class="rpg-eyebrow">Payload</p>
        <h2>Structured handoff</h2>
        <pre id="rpg-dashboard-payload">Awaiting structured proof handoff.</pre>
        <div class="rpg-log" id="rpg-dashboard-event-log">Awaiting worker session events.</div>
      </section>
    </div>
  `;
}

function ensureOverlay() {
  const style = document.createElement("style");
  style.textContent = `
    :root {
      color-scheme: dark;
      --rpg-bg: rgba(8, 14, 19, 0.74);
      --rpg-panel: rgba(12, 20, 27, 0.82);
      --rpg-border: rgba(128, 208, 255, 0.28);
      --rpg-text: #eef7fb;
      --rpg-muted: #9ab7c4;
      --rpg-accent: #6cf0b2;
      --rpg-warn: #ffd166;
    }

    html, body {
      margin: 0;
      min-height: 100%;
      height: 100%;
      overflow: hidden;
      font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      background: #000;
      color: var(--rpg-text);
    }

    #rpg-overlay {
      position: fixed;
      inset: 0;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 12px;
      padding: 16px;
      box-sizing: border-box;
      z-index: 9999;
      height: 100dvh;
      overflow: hidden;
    }

    #rpg-overlay * {
      box-sizing: border-box;
    }

    #rpg-overlay.rpg-focus-mode {
      justify-content: flex-start;
    }

    #rpg-overlay.rpg-focus-mode .rpg-topbar {
      padding: 10px 12px;
      background: rgba(8, 14, 19, 0.46);
    }

    #rpg-overlay.rpg-focus-mode .rpg-title {
      font-size: 20px;
    }

    #rpg-overlay.rpg-focus-mode .rpg-chip-row {
      gap: 6px;
      margin-top: 8px;
    }

    #rpg-overlay.rpg-focus-mode .rpg-chip,
    #rpg-overlay.rpg-focus-mode .rpg-focus-toggle {
      min-height: 28px;
      font-size: 11px;
    }

    #rpg-overlay.rpg-focus-mode .rpg-subtitle,
    #rpg-overlay.rpg-focus-mode .rpg-main {
      display: none;
    }

    #rpg-live-camera {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      object-fit: cover;
      background: #000;
      z-index: 1;
      display: none;
      pointer-events: none;
    }

    body canvas:not(#rpg-desktop-preview) {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      z-index: 2;
      background: transparent !important;
      pointer-events: none;
    }

    .rpg-topbar,
    .rpg-card,
    .rpg-proof {
      pointer-events: auto;
      backdrop-filter: blur(18px);
      background: var(--rpg-bg);
      border: 1px solid var(--rpg-border);
      border-radius: 18px;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.3);
    }

    #rpg-desktop-webcam {
      position: fixed;
      width: 1px;
      height: 1px;
      opacity: 0;
      pointer-events: none;
      left: -9999px;
      top: -9999px;
    }

    #rpg-desktop-preview {
      position: fixed;
      right: 16px;
      bottom: 16px;
      width: min(32vw, 320px);
      aspect-ratio: 4 / 3;
      display: block;
      z-index: 10010;
      border-radius: 18px;
      border: 1px solid rgba(255, 255, 255, 0.14);
      background:
        linear-gradient(180deg, rgba(4, 12, 18, 0.28), rgba(4, 12, 18, 0.72)),
        #05090d;
      box-shadow: 0 18px 60px rgba(0, 0, 0, 0.35);
      pointer-events: none;
    }

    .rpg-topbar {
      padding: 14px 16px;
    }

    .rpg-eyebrow {
      margin: 0 0 6px;
      font-size: 11px;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: var(--rpg-muted);
    }

    .rpg-title {
      margin: 0;
      font-size: 24px;
      line-height: 1.05;
    }

    .rpg-subtitle {
      margin: 8px 0 0;
      font-size: 13px;
      line-height: 1.45;
      color: var(--rpg-muted);
    }

    .rpg-chip-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .rpg-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      min-height: 32px;
      padding: 0 12px;
      border-radius: 999px;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(255, 255, 255, 0.04);
      font-size: 12px;
      color: var(--rpg-text);
    }

    .rpg-focus-toggle {
      appearance: none;
      border: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: 999px;
      min-height: 32px;
      padding: 0 12px;
      font: inherit;
      font-size: 12px;
      color: var(--rpg-text);
      background: rgba(5, 9, 13, 0.56);
      backdrop-filter: blur(18px);
    }

    .rpg-detection-guide {
      position: fixed;
      left: 50%;
      top: 54%;
      transform: translate(-50%, -50%);
      z-index: 8500;
      width: min(72vw, 360px);
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      pointer-events: none;
    }

    .rpg-detection-frame {
      width: min(72vw, 360px);
      aspect-ratio: 4 / 3;
      border-radius: 22px;
      border: 2px solid rgba(108, 240, 178, 0.7);
      box-shadow:
        0 0 0 9999px rgba(0, 0, 0, 0.14),
        inset 0 0 0 1px rgba(255, 255, 255, 0.14);
      position: relative;
    }

    .rpg-detection-frame::before,
    .rpg-detection-frame::after {
      content: "";
      position: absolute;
      inset: 18px;
      border: 1px dashed rgba(255, 255, 255, 0.18);
      border-radius: 16px;
    }

    .rpg-detection-copy {
      max-width: min(76vw, 420px);
      padding: 12px 14px;
      border-radius: 18px;
      background: rgba(8, 14, 19, 0.72);
      border: 1px solid rgba(128, 208, 255, 0.22);
      backdrop-filter: blur(18px);
      box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
      text-align: center;
    }

    .rpg-detection-title {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #eef7fb;
    }

    .rpg-detection-body {
      margin: 6px 0 0;
      font-size: 12px;
      line-height: 1.45;
      color: var(--rpg-muted);
    }

    .rpg-guidance {
      position: fixed;
      left: 50%;
      top: 48%;
      transform: translate(-50%, -50%);
      z-index: 9000;
      display: none;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: min(64vw, 320px);
      pointer-events: none;
    }

    .rpg-guidance-arrow {
      display: block;
      font-size: 72px;
      line-height: 1;
      color: #eef7fb;
      text-shadow:
        0 0 18px rgba(108, 240, 178, 0.55),
        0 10px 24px rgba(0, 0, 0, 0.5);
      filter: drop-shadow(0 4px 14px rgba(0, 0, 0, 0.45));
      animation: rpg-guidance-bob 1.2s ease-in-out infinite;
    }

    .rpg-guidance-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      max-width: min(74vw, 360px);
      min-height: 40px;
      padding: 8px 14px;
      border-radius: 18px;
      border: 1px solid rgba(108, 240, 178, 0.38);
      background: rgba(8, 14, 19, 0.74);
      backdrop-filter: blur(18px);
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: #eef7fb;
      text-align: center;
      box-shadow: 0 14px 30px rgba(0, 0, 0, 0.28);
    }

    @keyframes rpg-guidance-bob {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(8px);
      }
    }

    .rpg-main {
      display: grid;
      gap: 12px;
      align-content: end;
      min-height: 0;
    }

    .rpg-card,
    .rpg-proof {
      padding: 14px;
    }

    .rpg-card h2,
    .rpg-proof h2 {
      margin: 0 0 10px;
      font-size: 18px;
    }

    .rpg-meta {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 14px;
      margin: 0;
    }

    .rpg-meta dt {
      font-size: 11px;
      color: var(--rpg-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .rpg-meta dd {
      margin: 3px 0 0;
      font-size: 14px;
    }

    .rpg-note {
      margin: 0;
      font-size: 13px;
      line-height: 1.45;
      color: var(--rpg-muted);
    }

    .rpg-actions {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }

    .rpg-actions button {
      appearance: none;
      border: 0;
      border-radius: 14px;
      padding: 12px 14px;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      color: #05212b;
      background: linear-gradient(135deg, #8be6ff, #6cf0b2);
      box-shadow: 0 10px 24px rgba(108, 240, 178, 0.2);
    }

    .rpg-actions button.secondary {
      color: var(--rpg-text);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: none;
    }

    .rpg-actions button:disabled {
      opacity: 0.45;
    }

    .rpg-proof pre {
      margin: 0;
      max-height: 180px;
      overflow: auto;
      white-space: pre-wrap;
      word-break: break-word;
      font-size: 12px;
      line-height: 1.45;
      color: #dff4ff;
    }

    .rpg-log {
      margin-top: 12px;
      max-height: 120px;
      overflow: auto;
      font-size: 12px;
      color: var(--rpg-muted);
    }

    .rpg-log-entry + .rpg-log-entry {
      margin-top: 6px;
    }

    .rpg-dashboard-main {
      display: grid;
      gap: 12px;
      align-content: start;
      min-height: 0;
    }

    .rpg-dashboard-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-top: 12px;
    }

    .rpg-dashboard-actions button {
      appearance: none;
      border: 0;
      border-radius: 14px;
      padding: 12px 14px;
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      color: #05212b;
      background: linear-gradient(135deg, #8be6ff, #6cf0b2);
      box-shadow: 0 10px 24px rgba(108, 240, 178, 0.2);
    }

    .rpg-dashboard-actions button.secondary {
      color: var(--rpg-text);
      background: rgba(255, 255, 255, 0.08);
      box-shadow: none;
    }

    .rpg-dashboard-actions button:disabled {
      opacity: 0.45;
    }

    .rpg-note-field {
      display: grid;
      gap: 8px;
      margin-top: 12px;
      font-size: 12px;
      color: var(--rpg-muted);
    }

    .rpg-note-field textarea {
      width: 100%;
      min-height: 72px;
      resize: vertical;
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--rpg-text);
      padding: 10px 12px;
      font: inherit;
    }

    .rpg-preview-row {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
      margin-top: 12px;
    }

    .rpg-preview {
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: var(--rpg-panel);
      min-height: 90px;
    }

    .rpg-preview img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .rpg-preview-label {
      padding: 8px 10px;
      font-size: 12px;
      color: var(--rpg-muted);
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    }

    .rpg-preview-empty {
      padding: 20px 10px;
      text-align: center;
      font-size: 12px;
      color: var(--rpg-muted);
    }

    @media (max-width: 680px) {
      #rpg-overlay {
        gap: 8px;
        padding:
          max(10px, env(safe-area-inset-top))
          10px
          max(10px, env(safe-area-inset-bottom))
          10px;
      }

      .rpg-title {
        font-size: 20px;
      }

      .rpg-subtitle {
        margin-top: 6px;
        font-size: 12px;
        line-height: 1.35;
      }

      .rpg-chip-row {
        gap: 6px;
        margin-top: 10px;
      }

      .rpg-chip {
        min-height: 28px;
        padding: 0 10px;
        font-size: 11px;
      }

      .rpg-main {
        gap: 8px;
        grid-template-rows: minmax(0, 1fr) minmax(132px, auto);
      }

      .rpg-topbar,
      .rpg-card,
      .rpg-proof {
        border-radius: 16px;
      }

      .rpg-topbar {
        padding: 12px;
      }

      .rpg-card,
      .rpg-proof {
        padding: 12px;
      }

      .rpg-card h2,
      .rpg-proof h2 {
        margin-bottom: 8px;
        font-size: 16px;
      }

      .rpg-meta {
        gap: 8px 12px;
      }

      .rpg-meta dt {
        font-size: 10px;
      }

      .rpg-meta dd {
        font-size: 13px;
      }

      .rpg-note {
        font-size: 12px;
        line-height: 1.35;
      }

      .rpg-actions {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 10px;
      }

      .rpg-actions button {
        min-height: 42px;
        padding: 10px 10px;
        font-size: 13px;
        border-radius: 12px;
      }

      .rpg-preview-row {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        margin-top: 10px;
      }

      .rpg-preview {
        min-height: 74px;
      }

      .rpg-preview-label {
        padding: 6px 8px;
        font-size: 11px;
      }

      .rpg-preview-empty {
        padding: 14px 8px;
        font-size: 11px;
      }

      .rpg-proof {
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;
        min-height: 0;
      }

      .rpg-proof pre {
        max-height: 96px;
        font-size: 11px;
        line-height: 1.3;
      }

      .rpg-log {
        margin-top: 8px;
        max-height: 56px;
        font-size: 11px;
      }
    }

    @media (max-width: 460px) and (max-height: 980px) {
      #rpg-overlay {
        gap: 6px;
        padding:
          max(8px, env(safe-area-inset-top))
          8px
          max(8px, env(safe-area-inset-bottom))
          8px;
      }

      .rpg-topbar {
        padding: 10px;
      }

      .rpg-eyebrow {
        margin-bottom: 4px;
        font-size: 10px;
      }

      .rpg-title {
        font-size: 18px;
      }

      .rpg-subtitle {
        font-size: 11px;
        line-height: 1.25;
      }

      .rpg-chip-row {
        margin-top: 8px;
      }

      .rpg-chip {
        min-height: 26px;
        padding: 0 8px;
        font-size: 10px;
      }

      .rpg-card,
      .rpg-proof {
        padding: 10px;
      }

      .rpg-card h2,
      .rpg-proof h2 {
        font-size: 15px;
      }

      .rpg-meta dd {
        font-size: 12px;
      }

      .rpg-note {
        font-size: 11px;
      }

      .rpg-actions {
        gap: 6px;
        margin-top: 8px;
      }

      .rpg-actions button {
        min-height: 38px;
        padding: 8px;
        font-size: 12px;
      }

      .rpg-preview {
        min-height: 64px;
      }

      .rpg-proof pre {
        max-height: 72px;
        font-size: 10px;
      }

      .rpg-log {
        max-height: 40px;
        font-size: 10px;
      }
      .rpg-guidance-arrow {
        font-size: 60px;
      }

      .rpg-guidance-label {
        max-width: min(calc(100vw - 48px), 300px);
        font-size: 12px;
      }

      .rpg-detection-guide,
      .rpg-detection-frame {
        width: min(78vw, 320px);
      }

      .rpg-detection-copy {
        max-width: calc(100vw - 36px);
      }
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "rpg-overlay";
  overlay.innerHTML = state.appRole === "dashboard"
    ? buildDashboardOverlayHtml()
    : buildWorkerOverlayHtml();
  document.body.appendChild(overlay);

  DOM.overlay = overlay;
  if (state.appRole === "dashboard") {
    DOM.receiverStatusChip = document.getElementById("rpg-receiver-status-chip");
    DOM.receiverRouteChip = document.getElementById("rpg-receiver-route-chip");
    DOM.refreshButton = document.getElementById("rpg-refresh-button");
    DOM.dashboardSummaryTitle = document.getElementById("rpg-dashboard-summary-title");
    DOM.dashboardTaskId = document.getElementById("rpg-dashboard-task-id");
    DOM.dashboardWorkerId = document.getElementById("rpg-dashboard-worker-id");
    DOM.dashboardProvider = document.getElementById("rpg-dashboard-provider");
    DOM.dashboardAttempt = document.getElementById("rpg-dashboard-attempt");
    DOM.dashboardResult = document.getElementById("rpg-dashboard-result");
    DOM.dashboardTaskClass = document.getElementById("rpg-dashboard-task-class");
    DOM.dashboardSummary = document.getElementById("rpg-dashboard-summary");
    DOM.dashboardBeforeMeta = document.getElementById("rpg-dashboard-before-meta");
    DOM.dashboardAfterMeta = document.getElementById("rpg-dashboard-after-meta");
    DOM.dashboardBeforeSlot = document.getElementById("rpg-dashboard-before-slot");
    DOM.dashboardAfterSlot = document.getElementById("rpg-dashboard-after-slot");
    DOM.dashboardPayload = document.getElementById("rpg-dashboard-payload");
    DOM.dashboardEventLog = document.getElementById("rpg-dashboard-event-log");
    DOM.verificationNoteInput = document.getElementById("rpg-verification-note-input");
    DOM.verificationActionSummary = document.getElementById("rpg-verification-action-summary");
    DOM.verifyButton = document.getElementById("rpg-verify-button");
    DOM.retryButton = document.getElementById("rpg-retry-button");

    DOM.refreshButton.addEventListener("click", loadLatestHandoff);
    DOM.verifyButton.addEventListener("click", () => publishVerification("verified"));
    DOM.retryButton.addEventListener("click", () => publishVerification("needs_retry"));
    return;
  }

  DOM.targetFoundChip = document.getElementById("rpg-target-found-chip");
  DOM.statusChip = document.getElementById("rpg-status-chip");
  DOM.expectedTargetChip = document.getElementById("rpg-expected-target-chip");
  DOM.targetChip = document.getElementById("rpg-target-chip");
  DOM.cameraChip = document.getElementById("rpg-camera-chip");
  DOM.detectionGuide = document.getElementById("rpg-detection-guide");
  DOM.detectionTitle = document.getElementById("rpg-detection-title");
  DOM.detectionBody = document.getElementById("rpg-detection-body");
  DOM.guidance = document.getElementById("rpg-guidance");
  DOM.guidanceLabel = document.getElementById("rpg-guidance-label");
  DOM.focusButton = document.getElementById("rpg-focus-button");
  DOM.taskId = document.getElementById("rpg-task-id");
  DOM.workerId = document.getElementById("rpg-worker-id");
  DOM.sessionId = document.getElementById("rpg-session-id");
  DOM.attempt = document.getElementById("rpg-attempt");
  DOM.note = document.getElementById("rpg-note");
  DOM.webcamButton = document.getElementById("rpg-webcam-button");
  DOM.lockButton = document.getElementById("rpg-lock-button");
  DOM.beforeButton = document.getElementById("rpg-before-button");
  DOM.doneButton = document.getElementById("rpg-done-button");
  DOM.afterButton = document.getElementById("rpg-after-button");
  DOM.proofButton = document.getElementById("rpg-proof-button");
  DOM.copyButton = document.getElementById("rpg-copy-button");
  DOM.beforeSlot = document.getElementById("rpg-before-slot");
  DOM.afterSlot = document.getElementById("rpg-after-slot");
  DOM.proofOutput = document.getElementById("rpg-proof-output");
  DOM.log = document.getElementById("rpg-log");
  DOM.liveCamera = document.getElementById("rpg-live-camera");
  DOM.desktopWebcam = document.getElementById("rpg-desktop-webcam");
  DOM.desktopPreview = document.getElementById("rpg-desktop-preview");

  DOM.webcamButton.addEventListener("click", enableDesktopWebcam);
  DOM.focusButton.addEventListener("click", toggleFocusMode);
  DOM.lockButton.addEventListener("click", lockManualAnchor);
  DOM.beforeButton.addEventListener("click", () => captureEvidence("before"));
  DOM.doneButton.addEventListener("click", markActionComplete);
  DOM.afterButton.addEventListener("click", () => captureEvidence("after"));
  DOM.proofButton.addEventListener("click", generateProofRecord);
  DOM.copyButton.addEventListener("click", copyProofRecord);
}

function render() {
  if (state.appRole === "dashboard") {
    renderDashboard();
    return;
  }

  renderWorker();
}

function renderWorker() {
  const cameraActive = isDesktopBrowser() ? state.desktopWebcamEnabled : true;
  const imageTargetActive = isImageTargetActive();
  const xrCameraReady = /^XR8 hasVideo/i.test(state.cameraStatus);
  const guidanceActive = state.focusMode && imageTargetActive && xrCameraReady;
  const showDetectionGuide = cameraActive && xrCameraReady && !state.targetLocked && state.focusMode;

  DOM.overlay.classList.toggle("rpg-focus-mode", state.focusMode);
  DOM.targetFoundChip.textContent = `Image target: ${imageTargetActive ? "found" : "waiting"}`;
  DOM.statusChip.textContent = `Status: ${state.trackingStatus}`;
  DOM.expectedTargetChip.textContent = `Expected: ${state.activeTargetLabel}`;
  DOM.targetChip.textContent = `Target: ${formatTargetName(state.targetName)}`;
  DOM.cameraChip.textContent = `Camera: ${state.cameraStatus}`;
  DOM.detectionGuide.style.display = showDetectionGuide ? "flex" : "none";
  DOM.detectionTitle.textContent = getTargetProfiles()[state.activeTargetProfile].waitingTitle;
  DOM.detectionBody.textContent = getTargetProfiles()[state.activeTargetProfile].waitingBody;
  DOM.guidance.style.display = guidanceActive ? "flex" : "none";
  DOM.guidanceLabel.textContent = `Target found: ${formatTargetName(state.targetName)}. Turn clockwise to secure the cap.`;
  applyGuidanceLayout();
  DOM.focusButton.style.display = cameraActive ? "inline-flex" : "none";
  DOM.focusButton.textContent = state.focusMode ? "Show controls" : "Hide controls";
  DOM.taskId.textContent = state.taskId;
  DOM.workerId.textContent = state.workerId;
  DOM.sessionId.textContent = state.sessionId;
  DOM.attempt.textContent = String(state.attemptNumber);
  DOM.note.textContent = buildNote();
  DOM.proofOutput.textContent = state.handoffRecord
    ? JSON.stringify(state.handoffRecord, null, 2)
    : state.proofRecord
      ? JSON.stringify(state.proofRecord, null, 2)
      : "Capture before/after evidence to generate a proof package.";
  DOM.webcamButton.disabled = state.desktopWebcamEnabled;
  DOM.webcamButton.textContent = "Enable desktop webcam";
  DOM.webcamButton.style.display = isDesktopBrowser() ? "inline-flex" : "none";
  DOM.liveCamera.style.display = "none";
  DOM.desktopPreview.style.display = isDesktopBrowser() ? "block" : "none";
  syncSceneCanvasVisibility();
  DOM.beforeButton.disabled = !state.targetLocked;
  DOM.doneButton.disabled = !state.beforeCapture;
  DOM.afterButton.disabled = !state.instructionCompletedAt;
  DOM.proofButton.disabled = !state.beforeCapture || !state.afterCapture;
  DOM.copyButton.disabled = !state.proofRecord;
  renderImageSlot(DOM.beforeSlot, state.beforeCapture, "Before");
  renderImageSlot(DOM.afterSlot, state.afterCapture, "After");
  renderLog();
}

function renderDashboard() {
  if (!state.handoffRecord || !state.handoffRecord.payload) {
    DOM.receiverStatusChip.textContent = "Waiting for worker handoff";
    DOM.receiverRouteChip.textContent = "Route: server event bus";
    DOM.dashboardSummaryTitle.textContent = "Proof package ready for verification";
    DOM.dashboardTaskId.textContent = "No handoff yet";
    DOM.dashboardWorkerId.textContent = "No handoff yet";
    DOM.dashboardProvider.textContent = "No handoff yet";
    DOM.dashboardAttempt.textContent = "Awaiting proof";
    DOM.dashboardResult.textContent = "Awaiting proof";
    DOM.dashboardTaskClass.textContent = "Awaiting proof";
    DOM.dashboardSummary.textContent =
      "Open the worker page on the phone and submit proof to populate this dashboard.";
    DOM.dashboardBeforeMeta.textContent = "Not available";
    DOM.dashboardAfterMeta.textContent = "Not available";
    renderImageSlot(DOM.dashboardBeforeSlot, null, "Before");
    renderImageSlot(DOM.dashboardAfterSlot, null, "After");
    DOM.dashboardPayload.textContent = "Awaiting structured proof handoff.";
    DOM.dashboardEventLog.textContent = "Awaiting worker session events.";
    DOM.verificationActionSummary.textContent =
      "Choose a verification outcome after reviewing the proof package.";
    DOM.verifyButton.disabled = true;
    DOM.retryButton.disabled = true;
    return;
  }

  const {payload} = state.handoffRecord;
  const beforeEvidence = Array.isArray(payload.evidence)
    ? payload.evidence.find((entry) => entry.kind === "before")
    : null;
  const afterEvidence = Array.isArray(payload.evidence)
    ? payload.evidence.find((entry) => entry.kind === "after")
    : null;

  DOM.receiverStatusChip.textContent = "Worker proof received";
  DOM.receiverRouteChip.textContent = `Route: ${state.handoffRecord.route || "server event bus"}`;
  DOM.dashboardSummaryTitle.textContent = state.handoffRecord.summary || "Proof package received";
  DOM.dashboardTaskId.textContent = payload.taskId || "Unknown";
  DOM.dashboardWorkerId.textContent = payload.workerId || "Unknown";
  DOM.dashboardProvider.textContent = payload.provider || "Unknown";
  DOM.dashboardAttempt.textContent =
    typeof payload.attemptNumber === "number" ? `Attempt ${payload.attemptNumber}` : "Unknown";
  DOM.dashboardResult.textContent = payload.result || "proof_submitted";
  DOM.dashboardTaskClass.textContent = payload.taskClass || "Unknown";
  DOM.dashboardSummary.textContent =
    `${payload.taskLabel || "Worker task"} from ${payload.workerId || "worker"} is ready for review.`;
  DOM.dashboardBeforeMeta.textContent = beforeEvidence?.capturedAt || "Not available";
  DOM.dashboardAfterMeta.textContent = afterEvidence?.capturedAt || "Not available";
  renderImageSlot(
    DOM.dashboardBeforeSlot,
    beforeEvidence ? {dataUrl: beforeEvidence.previewDataUrl} : null,
    "Before",
  );
  renderImageSlot(
    DOM.dashboardAfterSlot,
    afterEvidence ? {dataUrl: afterEvidence.previewDataUrl} : null,
    "After",
  );
  DOM.dashboardPayload.textContent = JSON.stringify(state.handoffRecord, null, 2);
  DOM.dashboardEventLog.textContent = Array.isArray(payload.eventLog) && payload.eventLog.length
    ? JSON.stringify(payload.eventLog, null, 2)
    : "Awaiting worker session events.";

  if (state.verificationRecord && state.verificationRecord.sessionId === payload.sessionId) {
    DOM.verificationActionSummary.textContent =
      state.verificationRecord.result === "verified"
        ? `Verification sent at ${state.verificationRecord.verifiedAt}.${state.verificationRecord.note ? ` Note: ${state.verificationRecord.note}` : ""}`
        : `Retry requested at ${state.verificationRecord.verifiedAt}.${state.verificationRecord.note ? ` Note: ${state.verificationRecord.note}` : ""}`;
  } else {
    DOM.verificationActionSummary.textContent =
      "Choose a verification outcome after reviewing the proof package.";
  }

  DOM.verifyButton.disabled = false;
  DOM.retryButton.disabled = false;
}

function isImageTargetActive() {
  return state.targetLocked && state.anchorMode === "image-target";
}

function getGuidancePose() {
  const pose = state.targetScreenPose || {x: 0.5, y: 0.58, scale: 0.32};
  return {
    left: clamp(pose.x ?? 0.5, 0.22, 0.78),
    top: clamp((pose.y ?? 0.58) - Math.max(0.07, (pose.scale ?? 0.32) * 0.18), 0.24, 0.62),
  };
}

function applyGuidanceLayout() {
  if (!DOM.guidance) {
    return;
  }

  const pose = getGuidancePose();
  DOM.guidance.style.left = `${pose.left * 100}%`;
  DOM.guidance.style.top = `${pose.top * 100}%`;
}

function syncSceneCanvasVisibility() {
  const sceneCanvases = Array.from(document.querySelectorAll("body canvas:not(#rpg-desktop-preview)"));
  sceneCanvases.forEach((canvas) => {
    canvas.style.opacity = "1";
  });
}

function toggleFocusMode() {
  state.focusMode = !state.focusMode;
  recordEvent(state.focusMode ? "focus_mode_enabled" : "focus_mode_disabled");
  render();
}

function buildNote() {
  const xrCameraReady = /^XR8 hasVideo/i.test(state.cameraStatus);

  if (!state.targetLocked) {
    if (isDesktopBrowser() && !state.desktopWebcamEnabled) {
      return "On Mac desktop, click Enable desktop webcam to test the 8th Wall overlay with the browser camera API.";
    }
    if (!isDesktopBrowser()) {
      if (!xrCameraReady) {
        return "Allow camera access in Safari to start 8th Wall World tracking.";
      }
      return `Use the 8th Wall World camera feed and scan ${state.activeTargetLabel}. Keep it flat, centered, and well lit.`;
    }
    if (state.imageTargetsConfigured.length) {
      return `Scanning for ${state.activeTargetLabel}. Keep it flat, centered, and fill roughly 40-60% of the frame.`;
    }
    return "No configured image target payload was found. Use manual lock to continue the tabletop demo.";
  }

  if (!state.beforeCapture) {
    return "Anchor locked. Keep the canister and printed target in frame, then capture before evidence.";
  }

  if (!state.instructionCompletedAt) {
    return "Rotate the canister cap clockwise, then mark the action complete.";
  }

  if (!state.afterCapture) {
    return "Capture after evidence with the secured cap still visible in frame.";
  }

  if (!state.handoffRecord) {
    return "Generate proof JSON to send the package to the laptop dashboard.";
  }

  if (state.verificationRecord) {
    return state.verificationRecord.result === "verified"
      ? "Dashboard verified the proof package."
      : "Dashboard requested a retry. Capture a fresh attempt.";
  }

  return "Proof package sent. Open the laptop dashboard receiver to review and verify it.";
}

function renderImageSlot(node, capture, label) {
  if (!capture) {
    node.className = "rpg-preview-empty";
    node.textContent = `No ${label.toLowerCase()} capture yet.`;
    return;
  }

  node.className = "";
  node.innerHTML = `<img alt="${label} evidence" src="${capture.dataUrl}" />`;
}

function renderLog() {
  DOM.log.innerHTML = state.eventLog
    .map(
      (entry) =>
        `<div class="rpg-log-entry"><strong>${entry.type}</strong> <span>${entry.at}</span></div>`,
    )
    .join("");
}

function setTrackingStatus(status) {
  state.trackingStatus = status;
  render();
}

function lockManualAnchor() {
  state.anchorMode = "manual";
  state.targetName = "manual-fallback";
  state.targetLocked = true;
  state.provider = "8th Wall runtime + manual anchor";
  setTrackingStatus("Manual anchor locked");
  recordEvent("manual_anchor_locked");
}

function markActionComplete() {
  state.instructionCompletedAt = nowIso();
  recordEvent("cap_secured_marked");
  render();
}

function findCaptureCanvas() {
  const canvases = Array.from(document.querySelectorAll("canvas"));
  return canvases.find(
    (canvas) => canvas.id !== "rpg-desktop-preview" && canvas.width > 0 && canvas.height > 0,
  ) || null;
}

function isDesktopBrowser() {
  const ua = navigator.userAgent || "";
  return !/Android|iPhone|iPad|iPod/i.test(ua);
}

function makeCaptureFromVideo(video) {
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("2D capture context unavailable.");
  }
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return {
    at: nowIso(),
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    width: canvas.width,
    height: canvas.height,
  };
}

function stopDesktopPreview() {
  if (state.desktopPreviewFrame) {
    cancelAnimationFrame(state.desktopPreviewFrame);
    state.desktopPreviewFrame = null;
  }
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(/\s+/);
  let line = "";
  let cursorY = y;

  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width > maxWidth && line) {
      context.fillText(line, x, cursorY);
      line = word;
      cursorY += lineHeight;
      return;
    }
    line = testLine;
  });

  if (line) {
    context.fillText(line, x, cursorY);
  }
}

function paintDesktopPreviewPlaceholder(message = "Click Enable desktop webcam") {
  if (!DOM.desktopPreview) {
    return;
  }

  const canvas = DOM.desktopPreview;
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  if (canvas.width !== 480 || canvas.height !== 360) {
    canvas.width = 480;
    canvas.height = 360;
  }

  context.clearRect(0, 0, canvas.width, canvas.height);
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, "#0a1620");
  gradient.addColorStop(1, "#09111a");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = "rgba(108, 240, 178, 0.45)";
  context.lineWidth = 3;
  context.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  context.fillStyle = "rgba(5, 9, 13, 0.78)";
  context.fillRect(12, 12, 196, 34);
  context.fillStyle = "#eef7fb";
  context.font = "600 15px Helvetica Neue";
  context.fillText("Desktop webcam preview", 22, 35);
  context.fillStyle = "#9ab7c4";
  context.font = "500 16px Helvetica Neue";
  wrapCanvasText(context, message, 24, 168, canvas.width - 48, 22);
}

function renderDesktopPreview() {
  if (!state.desktopWebcamEnabled || !state.desktopStream || !DOM.desktopPreview || !DOM.desktopWebcam) {
    stopDesktopPreview();
    paintDesktopPreviewPlaceholder(
      state.cameraStatus === "Desktop webcam unavailable"
        ? "Webcam unavailable. Check browser permission and try again."
        : "Click Enable desktop webcam",
    );
    return;
  }

  const canvas = DOM.desktopPreview;
  const context = canvas.getContext("2d");
  const video = DOM.desktopWebcam;

  if (!context) {
    state.cameraStatus = "Preview canvas unavailable";
    recordEvent("desktop_preview_failed", { reason: "2d_context_unavailable" });
    render();
    return;
  }

  const draw = () => {
    if (!state.desktopWebcamEnabled || !state.desktopStream) {
      return;
    }

    const width = video.videoWidth || canvas.width;
    const height = video.videoHeight || canvas.height;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
    } else {
      paintDesktopPreviewPlaceholder("Waiting for webcam frames...");
    }

    context.strokeStyle = "rgba(108, 240, 178, 0.75)";
    context.lineWidth = 3;
    context.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    context.fillStyle = "rgba(5, 9, 13, 0.7)";
    context.fillRect(10, 10, 170, 32);
    context.fillStyle = "#eef7fb";
    context.font = "600 14px Helvetica Neue";
    context.fillText("Desktop webcam preview", 20, 31);

    state.desktopPreviewFrame = requestAnimationFrame(draw);
  };

  stopDesktopPreview();
  draw();
}

async function enableDesktopWebcam() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    state.cameraStatus = "Web camera API unavailable";
    recordEvent("desktop_webcam_failed", { reason: "media_devices_unavailable" });
    render();
    return;
  }

  try {
    const stream = await Promise.race([
      navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
        },
        audio: false,
      }),
      new Promise((_, reject) => {
        window.setTimeout(() => {
          reject(new Error("Timed out waiting for desktop webcam."));
        }, 8000);
      }),
    ]);
    state.desktopStream = stream;
    state.desktopWebcamEnabled = true;
    state.focusMode = false;
    state.cameraStatus = "Desktop webcam live";
    DOM.desktopWebcam.srcObject = stream;
    await DOM.desktopWebcam.play();
    renderDesktopPreview();
    recordEvent("desktop_webcam_enabled");
    render();
  } catch (error) {
    state.cameraStatus = "Desktop webcam unavailable";
    recordEvent("desktop_webcam_failed", { reason: error.message });
    paintDesktopPreviewPlaceholder("Webcam unavailable. Check browser permission and try again.");
    render();
  }
}

async function enableLiveCamera() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    state.cameraStatus = "Web camera API unavailable";
    recordEvent("live_camera_failed", { reason: "media_devices_unavailable" });
    render();
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: {
          ideal: "environment",
        },
      },
      audio: false,
    });

    state.liveCameraStream = stream;
    state.liveCameraEnabled = true;
    state.focusMode = true;
    state.cameraStatus = "Browser camera live";
    DOM.liveCamera.srcObject = stream;
    await DOM.liveCamera.play();
    recordEvent("live_camera_enabled");
    render();
  } catch (error) {
    state.cameraStatus = "Browser camera unavailable";
    recordEvent("live_camera_failed", { reason: error.message });
    render();
  }
}

function captureEvidence(kind) {
  const canvas = findCaptureCanvas();
  if (!canvas && !state.desktopWebcamEnabled && !state.liveCameraEnabled) {
    state.trackingStatus = "No render canvas available for capture";
    recordEvent("capture_failed", { kind, reason: "missing_canvas" });
    render();
    return;
  }

  try {
    if (state.proofRecord || state.handoffRecord || state.verificationRecord) {
      clearSubmissionState(`new_${kind}_capture`);
    }

    const capture = canvas
      ? {
          at: nowIso(),
          dataUrl: canvas.toDataURL("image/jpeg", 0.92),
          width: canvas.width,
          height: canvas.height,
        }
      : state.liveCameraEnabled
        ? makeCaptureFromVideo(DOM.liveCamera)
        : makeCaptureFromVideo(DOM.desktopWebcam);
    if (kind === "before") {
      state.beforeCapture = capture;
    } else {
      state.afterCapture = capture;
    }
    recordEvent("capture_saved", { kind, width: capture.width, height: capture.height });
    render();
  } catch (error) {
    state.trackingStatus = "Canvas capture failed";
    recordEvent("capture_failed", { kind, reason: error.message });
    render();
  }
}

function captureSummary(capture, kind) {
  return {
    kind,
    capturedAt: capture.at,
    previewDataUrl: capture.dataUrl,
    width: capture.width,
    height: capture.height,
  };
}

function clearSubmissionState(reason) {
  state.proofRecord = null;
  state.handoffRecord = null;
  state.verificationRecord = null;
  recordEvent("submission_state_cleared", { reason });
}

function buildProofRecord() {
  return {
    schemaVersion: "rpg.canister-proof.v1",
    sessionId: state.sessionId,
    taskId: state.taskId,
    taskLabel: state.taskLabel,
    workerId: state.workerId,
    taskClass: state.taskClass,
    instruction: state.instruction,
    provider: state.provider,
    targetName: formatTargetName(state.targetName),
    anchorMode: state.anchorMode,
    attemptNumber: state.attemptNumber,
    capturedAt: nowIso(),
    actionCompletedAt: state.instructionCompletedAt,
    beforeCapture: state.beforeCapture,
    afterCapture: state.afterCapture,
    evidence: [
      captureSummary(state.beforeCapture, "before"),
      captureSummary(state.afterCapture, "after"),
    ],
    eventLog: [...state.eventLog],
    dashboardHandoff: {
      mode: "server event bus",
      endpoint: HANDOFF_API_ENDPOINT,
      dashboardUrl: getDashboardUrl(),
      workerUrl: getWorkerUrl(),
      dispatchedAt: null,
      status: "ready",
    },
    result: "proof_submitted",
    verificationState: "proof_submitted",
    readyForVerification: true,
  };
}

function buildHandoffRecord() {
  if (!state.proofRecord) {
    return null;
  }

  return {
    eventType: "rpg:proof-ready",
    issuedAt: nowIso(),
    route: "server event bus",
    summary: "AR guidance complete. Proof package ready for verification.",
    payload: state.proofRecord,
  };
}

async function dispatchProofRecord() {
  if (!state.proofRecord) {
    return;
  }

  state.handoffRecord = buildHandoffRecord();
  state.proofRecord.dashboardHandoff.dispatchedAt = state.handoffRecord.issuedAt;
  state.proofRecord.dashboardHandoff.status = "dispatched";
  state.proofRecord.eventLog = [...state.eventLog];

  let route = "server event bus";

  try {
    await postJson(HANDOFF_API_ENDPOINT, state.handoffRecord);
  } catch (error) {
    route = "browser fallback";
    recordEvent("handoff_network_failed", { reason: error.message });
  }

  state.handoffRecord.route = route;

  if (window.localStorage && typeof window.localStorage.setItem === "function") {
    window.localStorage.setItem(PROOF_HANDOFF_STORAGE_KEY, JSON.stringify(state.handoffRecord));
  }

  const channel = getProofChannel();
  if (channel && typeof channel.postMessage === "function") {
    channel.postMessage(state.handoffRecord);
  }

  if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
    window.dispatchEvent(new CustomEvent("rpg:proof-ready", { detail: state.handoffRecord }));
  }
  state.trackingStatus = route === "server event bus"
    ? "Proof sent to dashboard"
    : "Proof saved locally for fallback review";
  recordEvent("handoff_dispatched", { route });
  render();
}

async function generateProofRecord() {
  if (!state.beforeCapture || !state.afterCapture) {
    state.trackingStatus = "Capture before and after evidence first";
    render();
    return;
  }

  state.attemptNumber += 1;
  state.proofRecord = buildProofRecord();
  recordEvent("proof_generated", { attemptNumber: state.attemptNumber });
  render();
  await dispatchProofRecord();
}

async function copyProofRecord() {
  if (!state.proofRecord) {
    return;
  }

  const text = JSON.stringify(state.proofRecord, null, 2);
  if (navigator.clipboard && navigator.clipboard.writeText) {
    await navigator.clipboard.writeText(text);
    state.trackingStatus = "Proof JSON copied";
    recordEvent("proof_copied");
    render();
    return;
  }

  state.trackingStatus = "Clipboard unavailable";
  recordEvent("proof_copy_failed", { reason: "clipboard_unavailable" });
  render();
}

function applyVerificationRecord(record) {
  if (!record || record.sessionId !== state.sessionId) {
    return;
  }

  if (state.proofRecord && record.attemptNumber !== state.proofRecord.attemptNumber) {
    recordEvent("stale_verification_ignored", {
      attemptNumber: record.attemptNumber,
      activeAttemptNumber: state.proofRecord.attemptNumber,
      result: record.result,
    });
    return;
  }

  state.verificationRecord = record;
  recordEvent("verification_received", {
    attemptNumber: record.attemptNumber,
    result: record.result,
    note: record.note || "",
  });

  if (state.proofRecord) {
    state.proofRecord.result = record.result;
    state.proofRecord.readyForVerification = false;
    state.proofRecord.verificationState = record.result;
    state.proofRecord.dashboardHandoff.status = record.result;
    state.proofRecord.dashboardHandoff.verifiedAt = record.verifiedAt;
    state.proofRecord.eventLog = [...state.eventLog];
  }

  state.trackingStatus = record.result === "verified"
    ? "Dashboard verified the proof"
    : "Dashboard requested a retry";
  render();
}

async function loadLatestHandoff() {
  let latest = null;
  let verification = null;

  try {
    latest = await fetchJson(`${HANDOFF_API_ENDPOINT}/latest`);
  } catch (error) {
    latest = safeReadStoredJson(PROOF_HANDOFF_STORAGE_KEY);
  }

  try {
    verification = await fetchJson(`${VERIFICATION_API_ENDPOINT}/latest`);
  } catch (error) {
    verification = safeReadStoredJson(VERIFICATION_STORAGE_KEY);
  }

  state.handoffRecord = latest;
  state.verificationRecord = latest && latest.payload ? verification : null;
  render();
}

async function loadLatestVerification() {
  let latest = null;

  try {
    latest = await fetchJson(`${VERIFICATION_API_ENDPOINT}/latest`);
  } catch (error) {
    latest = safeReadStoredJson(VERIFICATION_STORAGE_KEY);
  }

  if (latest) {
    applyVerificationRecord(latest);
  }
}

async function publishVerification(result) {
  if (!state.handoffRecord || !state.handoffRecord.payload) {
    DOM.verificationActionSummary.textContent = "No proof package is available to verify.";
    return;
  }

  const record = {
    eventType: "rpg:verification-updated",
    sessionId: state.handoffRecord.payload.sessionId,
    taskId: state.handoffRecord.payload.taskId,
    workerId: state.handoffRecord.payload.workerId,
    provider: state.handoffRecord.payload.provider,
    taskClass: state.handoffRecord.payload.taskClass,
    attemptNumber: state.handoffRecord.payload.attemptNumber,
    result,
    note: DOM.verificationNoteInput.value.trim(),
    verifiedAt: nowIso(),
  };

  let route = "server event bus";
  try {
    await postJson(VERIFICATION_API_ENDPOINT, record);
  } catch (error) {
    route = "browser fallback";
  }

  if (window.localStorage && typeof window.localStorage.setItem === "function") {
    window.localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(record));
  }

  const channel = getVerificationChannel();
  if (channel && typeof channel.postMessage === "function") {
    channel.postMessage(record);
  }

  state.verificationRecord = record;
  DOM.verificationActionSummary.textContent = result === "verified"
    ? `Verification sent over ${route}.${record.note ? ` Note: ${record.note}` : ""}`
    : `Retry request sent over ${route}.${record.note ? ` Note: ${record.note}` : ""}`;
  render();
}

function connectProofFeed() {
  if (proofEventSource || typeof EventSource !== "function") {
    return;
  }

  proofEventSource = new EventSource(`${HANDOFF_API_ENDPOINT}/events`);
  proofEventSource.onmessage = (event) => {
    try {
      state.handoffRecord = JSON.parse(event.data);
      render();
    } catch (error) {
      // Ignore malformed server events.
    }
  };
}

function connectVerificationFeed() {
  if (verificationEventSource || typeof EventSource !== "function") {
    return;
  }

  verificationEventSource = new EventSource(`${VERIFICATION_API_ENDPOINT}/events`);
  verificationEventSource.onmessage = (event) => {
    try {
      applyVerificationRecord(JSON.parse(event.data));
    } catch (error) {
      // Ignore malformed server events.
    }
  };
}

function handleTargetFound(detail) {
  state.anchorMode = "image-target";
  state.provider = "8th Wall image target";
  state.targetName = detail.name || "image-target";
  state.targetLocked = true;
  state.trackingStatus = "Image target locked";
  state.targetScreenPose = extractTargetPose(detail);
  recordEvent("image_found", detail);
  render();
}

function handleTargetUpdated(detail) {
  state.anchorMode = "image-target";
  state.provider = "8th Wall image target";
  state.targetName = detail.name || state.targetName;
  state.targetLocked = true;
  state.trackingStatus = "Image target tracking";
  state.targetScreenPose = extractTargetPose(detail);
  recordEvent("image_updated", { name: detail.name, scale: detail.scale });
  render();
}

function handleTargetLost(detail) {
  state.targetLocked = false;
  state.anchorMode = "unlocked";
  state.targetName = "waiting";
  state.targetScreenPose = null;
  state.trackingStatus = "Image target lost";
  recordEvent("image_lost", detail || {});
  render();
}

function configureImageTargets() {
  if (!window.XR8 || !window.XR8.XrController || !window.XR8.XrController.configure) {
    return;
  }

  const profiles = getTargetProfiles()
  const selectedProfile = getRequestedTargetProfile()
  const imageTargetData = profiles[selectedProfile].targets

  state.activeTargetProfile = selectedProfile
  state.activeTargetLabel = profiles[selectedProfile].label
  window.XR8.XrController.configure({ imageTargetData });
  state.imageTargetsConfigured = imageTargetData.map((target) => target.name);
  recordEvent("image_targets_configured", {
    profile: selectedProfile,
    imageTargets: state.imageTargetsConfigured,
  });
}

function installXR8Listeners() {
  if (!window.XR8 || !window.XR8.addCameraPipelineModule) {
    state.trackingStatus = "XR8 listener API unavailable";
    render();
    return;
  }

  window.XR8.addCameraPipelineModule({
    name: "rpg-canister-overlay",
    onCameraStatusChange: ({ status }) => {
      state.cameraStatus = `XR8 ${status}`;
      recordEvent("camera_status", { status });
      render();
    },
    listeners: [
      {
        event: "reality.trackingstatus",
        process: ({ detail }) => {
          const status = detail && detail.status ? detail.status : "unknown";
          const reason = detail && detail.reason ? ` (${detail.reason})` : "";
          state.trackingStatus = `Tracking ${status}${reason}`;
          render();
        },
      },
      {
        event: "reality.imagescanning",
        process: ({ detail }) => {
          recordEvent("images_scanning", detail || {});
          state.trackingStatus = "Scanning for image target";
          render();
        },
      },
      {
        event: "reality.imagefound",
        process: ({ detail }) => handleTargetFound(detail || {}),
      },
      {
        event: "reality.imageupdated",
        process: ({ detail }) => handleTargetUpdated(detail || {}),
      },
      {
        event: "reality.imagelost",
        process: ({ detail }) => handleTargetLost(detail || {}),
      },
    ],
  });

  configureImageTargets();
  state.trackingStatus = "8th Wall listeners ready";
  state.cameraStatus = "XR8 ready";
  recordEvent("xr8_ready");
  render();
}

function attachGlobalBridge() {
  window.rpgCanisterDemo = {
    targetFound: handleTargetFound,
    targetLost: handleTargetLost,
    getProofRecord: () => state.proofRecord,
    getDashboardUrl,
    dispatchProofRecord,
    resetSession: () => {
      state.sessionId = newSessionId();
      state.targetLocked = false;
      state.targetName = "waiting";
      state.anchorMode = "unlocked";
      state.attemptNumber = 0;
      state.beforeCapture = null;
      state.afterCapture = null;
      state.instructionCompletedAt = null;
      state.proofRecord = null;
      state.handoffRecord = null;
      state.verificationRecord = null;
      state.targetScreenPose = null;
      state.eventLog = [];
      state.trackingStatus = "Session reset";
      render();
    },
  };
}

function boot() {
  ensureOverlay();
  attachGlobalBridge();
  recordEvent("overlay_booted", { role: state.appRole });
  render();

  if (state.appRole === "dashboard") {
    void loadLatestHandoff();
    connectProofFeed();
    window.addEventListener("storage", (event) => {
      if (event.key !== PROOF_HANDOFF_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        state.handoffRecord = JSON.parse(event.newValue);
        render();
      } catch (error) {
        // Ignore malformed cross-tab handoffs.
      }
    });

    const proofChannelInstance = getProofChannel();
    if (proofChannelInstance && typeof proofChannelInstance.addEventListener === "function") {
      proofChannelInstance.addEventListener("message", (event) => {
        state.handoffRecord = event.data;
        render();
      });
    } else if (proofChannelInstance) {
      proofChannelInstance.onmessage = (event) => {
        state.handoffRecord = event.data;
        render();
      };
    }
    return;
  }

  paintDesktopPreviewPlaceholder();
  void loadLatestVerification();
  connectVerificationFeed();

  window.addEventListener("storage", (event) => {
    if (event.key !== VERIFICATION_STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      applyVerificationRecord(JSON.parse(event.newValue));
    } catch (error) {
      // Ignore malformed cross-tab verification events.
    }
  });

  const verificationChannelInstance = getVerificationChannel();
  if (verificationChannelInstance && typeof verificationChannelInstance.addEventListener === "function") {
    verificationChannelInstance.addEventListener("message", (event) => applyVerificationRecord(event.data));
  } else if (verificationChannelInstance) {
    verificationChannelInstance.onmessage = (event) => applyVerificationRecord(event.data);
  }

  if (window.XR8) {
    installXR8Listeners();
    return;
  }

  window.addEventListener("xrloaded", installXR8Listeners, { once: true });
  state.trackingStatus = "Waiting for xrloaded";
  render();
}

boot();
