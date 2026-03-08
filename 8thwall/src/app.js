import itoenLabelTarget from '../image-targets/itoen-label.json'
import canisterCapTarget from '../image-targets/canister-cap.json'

const state = {
  sessionId: newSessionId(),
  taskId: "WIL-9-canister",
  taskLabel: "Canister secure check",
  workerId: "worker-07",
  instruction: "Turn clockwise to secure the cap.",
  taskClass: "green task",
  provider: "8th Wall runtime",
  trackingStatus: "Waiting for XR runtime",
  targetName: "manual-fallback",
  targetLocked: false,
  anchorMode: "unlocked",
  attemptNumber: 0,
  beforeCapture: null,
  afterCapture: null,
  instructionCompletedAt: null,
  proofRecord: null,
  eventLog: [],
  imageTargetsConfigured: [],
  cameraStatus: "booting",
  desktopWebcamEnabled: false,
  desktopStream: null,
  desktopPreviewFrame: null,
  liveCameraEnabled: false,
  liveCameraStream: null,
};

const DOM = {};

function newSessionId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const suffix = Math.random().toString(36).slice(2, 6);
  return `rpg-8thwall-${stamp}-${suffix}`;
}

function nowIso() {
  return new Date().toISOString();
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
    }
  `;
  document.head.appendChild(style);

  const overlay = document.createElement("div");
  overlay.id = "rpg-overlay";
  overlay.innerHTML = `
    <section class="rpg-topbar">
      <p class="rpg-eyebrow">Real Physical Gigs x 8th Wall</p>
      <h1 class="rpg-title">Canister AR guidance</h1>
      <p class="rpg-subtitle">
        Tabletop worker flow for tightening the canister cap, capturing before/after proof, and
        handing a structured record back to the dashboard.
      </p>
      <div class="rpg-chip-row">
        <span class="rpg-chip" id="rpg-provider-chip">Provider: booting</span>
        <span class="rpg-chip" id="rpg-status-chip">Status: booting</span>
        <span class="rpg-chip" id="rpg-target-chip">Target: waiting</span>
        <span class="rpg-chip" id="rpg-camera-chip">Camera: booting</span>
      </div>
    </section>
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
  document.body.appendChild(overlay);

  DOM.providerChip = document.getElementById("rpg-provider-chip");
  DOM.statusChip = document.getElementById("rpg-status-chip");
  DOM.targetChip = document.getElementById("rpg-target-chip");
  DOM.cameraChip = document.getElementById("rpg-camera-chip");
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
  DOM.lockButton.addEventListener("click", lockManualAnchor);
  DOM.beforeButton.addEventListener("click", () => captureEvidence("before"));
  DOM.doneButton.addEventListener("click", markActionComplete);
  DOM.afterButton.addEventListener("click", () => captureEvidence("after"));
  DOM.proofButton.addEventListener("click", generateProofRecord);
  DOM.copyButton.addEventListener("click", copyProofRecord);
}

function render() {
  DOM.providerChip.textContent = `Provider: ${state.provider}`;
  DOM.statusChip.textContent = `Status: ${state.trackingStatus}`;
  DOM.targetChip.textContent = `Target: ${state.targetName}`;
  DOM.cameraChip.textContent = `Camera: ${state.cameraStatus}`;
  DOM.taskId.textContent = state.taskId;
  DOM.workerId.textContent = state.workerId;
  DOM.sessionId.textContent = state.sessionId;
  DOM.attempt.textContent = String(state.attemptNumber);
  DOM.note.textContent = buildNote();
  DOM.proofOutput.textContent = state.proofRecord
    ? JSON.stringify(state.proofRecord, null, 2)
    : "Capture before/after evidence to generate a proof package.";
  DOM.webcamButton.disabled = isDesktopBrowser() ? state.desktopWebcamEnabled : state.liveCameraEnabled;
  DOM.webcamButton.textContent = isDesktopBrowser() ? "Enable desktop webcam" : "Enable live camera";
  DOM.webcamButton.style.display = "inline-flex";
  DOM.liveCamera.style.display = !isDesktopBrowser() && state.liveCameraEnabled ? "block" : "none";
  DOM.desktopPreview.style.display = isDesktopBrowser() ? "block" : "none";
  DOM.beforeButton.disabled = !state.targetLocked;
  DOM.doneButton.disabled = !state.beforeCapture;
  DOM.afterButton.disabled = !state.instructionCompletedAt;
  DOM.proofButton.disabled = !state.beforeCapture || !state.afterCapture;
  DOM.copyButton.disabled = !state.proofRecord;
  renderImageSlot(DOM.beforeSlot, state.beforeCapture, "Before");
  renderImageSlot(DOM.afterSlot, state.afterCapture, "After");
  renderLog();
}

function buildNote() {
  if (!state.targetLocked) {
    if (isDesktopBrowser() && !state.desktopWebcamEnabled) {
      return "On Mac desktop, click Enable desktop webcam to test the 8th Wall overlay with the browser camera API.";
    }
    if (!isDesktopBrowser() && !state.liveCameraEnabled) {
      return "On iPhone, tap Enable live camera first so the canister stays visible while you use the manual anchor flow.";
    }
    if (state.imageTargetsConfigured.length) {
      return `Scanning for image targets: ${state.imageTargetsConfigured.join(", ")}. Use manual lock if tracking is unavailable.`;
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

  return "Proof package ready. Copy the JSON into the dashboard or handoff flow.";
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
  if (!isDesktopBrowser()) {
    await enableLiveCamera()
    return
  }

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
    recordEvent("capture_saved", { kind, width: canvas.width, height: canvas.height });
    render();
  } catch (error) {
    state.trackingStatus = "Canvas capture failed";
    recordEvent("capture_failed", { kind, reason: error.message });
    render();
  }
}

function generateProofRecord() {
  state.attemptNumber += 1;
  state.proofRecord = {
    sessionId: state.sessionId,
    taskId: state.taskId,
    taskLabel: state.taskLabel,
    workerId: state.workerId,
    taskClass: state.taskClass,
    instruction: state.instruction,
    provider: state.provider,
    targetName: state.targetName,
    anchorMode: state.anchorMode,
    attemptNumber: state.attemptNumber,
    capturedAt: nowIso(),
    actionCompletedAt: state.instructionCompletedAt,
    beforeCapture: state.beforeCapture,
    afterCapture: state.afterCapture,
    verificationState: "proof_submitted",
  };
  recordEvent("proof_generated", { attemptNumber: state.attemptNumber });
  render();
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

function handleTargetFound(detail) {
  state.anchorMode = "image-target";
  state.provider = "8th Wall image target";
  state.targetName = detail.name || "image-target";
  state.targetLocked = true;
  state.trackingStatus = "Image target locked";
  recordEvent("image_found", detail);
  render();
}

function handleTargetUpdated(detail) {
  state.anchorMode = "image-target";
  state.provider = "8th Wall image target";
  state.targetName = detail.name || state.targetName;
  state.targetLocked = true;
  state.trackingStatus = "Image target tracking";
  recordEvent("image_updated", { name: detail.name, scale: detail.scale });
  render();
}

function handleTargetLost(detail) {
  state.targetLocked = false;
  state.trackingStatus = "Image target lost";
  recordEvent("image_lost", detail || {});
  render();
}

function configureImageTargets() {
  if (!window.XR8 || !window.XR8.XrController || !window.XR8.XrController.configure) {
    return;
  }

  const imageTargetData = [itoenLabelTarget, canisterCapTarget];
  window.XR8.XrController.configure({ imageTargetData });
  state.imageTargetsConfigured = imageTargetData.map((target) => target.name);
  recordEvent("image_targets_configured", { imageTargets: state.imageTargetsConfigured });
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
    resetSession: () => {
      state.sessionId = newSessionId();
      state.targetLocked = false;
      state.targetName = "manual-fallback";
      state.anchorMode = "unlocked";
      state.attemptNumber = 0;
      state.beforeCapture = null;
      state.afterCapture = null;
      state.instructionCompletedAt = null;
      state.proofRecord = null;
      state.eventLog = [];
      state.trackingStatus = "Session reset";
      render();
    },
  };
}

function boot() {
  ensureOverlay();
  attachGlobalBridge();
  recordEvent("overlay_booted");
  paintDesktopPreviewPlaceholder();
  render();

  if (window.XR8) {
    installXR8Listeners();
  } else {
    window.addEventListener("xrloaded", installXR8Listeners, { once: true });
    state.trackingStatus = "Waiting for xrloaded";
    render();
  }
}

boot();
