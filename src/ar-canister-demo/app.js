const DOM = {
  providerChip: document.getElementById("providerChip"),
  statusChip: document.getElementById("statusChip"),
  taskIdValue: document.getElementById("taskIdValue"),
  workerIdValue: document.getElementById("workerIdValue"),
  sessionIdValue: document.getElementById("sessionIdValue"),
  handoffModeValue: document.getElementById("handoffModeValue"),
  taskClassValue: document.getElementById("taskClassValue"),
  attemptValue: document.getElementById("attemptValue"),
  cameraFeed: document.getElementById("cameraFeed"),
  captureCanvas: document.getElementById("captureCanvas"),
  cameraFallback: document.getElementById("cameraFallback"),
  anchorCard: document.getElementById("anchorCard"),
  startButton: document.getElementById("startButton"),
  lockButton: document.getElementById("lockButton"),
  simulate8thWallButton: document.getElementById("simulate8thWallButton"),
  simulateMindARButton: document.getElementById("simulateMindARButton"),
  beforeButton: document.getElementById("beforeButton"),
  completeActionButton: document.getElementById("completeActionButton"),
  afterButton: document.getElementById("afterButton"),
  proofButton: document.getElementById("proofButton"),
  copyProofButton: document.getElementById("copyProofButton"),
  downloadProofButton: document.getElementById("downloadProofButton"),
  dispatchProofButton: document.getElementById("dispatchProofButton"),
  resetButton: document.getElementById("resetButton"),
  beforeImage: document.getElementById("beforeImage"),
  afterImage: document.getElementById("afterImage"),
  beforeMeta: document.getElementById("beforeMeta"),
  afterMeta: document.getElementById("afterMeta"),
  proofOutput: document.getElementById("proofOutput"),
  eventCountChip: document.getElementById("eventCountChip"),
  eventLogOutput: document.getElementById("eventLogOutput"),
  handoffStatusChip: document.getElementById("handoffStatusChip"),
  handoffSummary: document.getElementById("handoffSummary"),
  dashboardOutput: document.getElementById("dashboardOutput"),
  verificationStatusChip: document.getElementById("verificationStatusChip"),
  verificationSummary: document.getElementById("verificationSummary"),
  verificationOutput: document.getElementById("verificationOutput"),
  stepSession: document.getElementById("stepSession"),
  stepAnchor: document.getElementById("stepAnchor"),
  stepBefore: document.getElementById("stepBefore"),
  stepAction: document.getElementById("stepAction"),
  stepAfter: document.getElementById("stepAfter"),
  stepProof: document.getElementById("stepProof"),
};

const PROVIDERS = [
  {
    id: "8thwall",
    label: "8th Wall Image Target",
    isAvailable: () => Boolean(window.XR8),
  },
  {
    id: "mindar",
    label: "MindAR Image Target",
    isAvailable: () => Boolean(window.MINDAR),
  },
  {
    id: "manual",
    label: "Manual tabletop anchor",
    isAvailable: () => true,
  },
];

const PROOF_HANDOFF_STORAGE_KEY = "rpg:latest-proof-handoff";
const PROOF_HANDOFF_CHANNEL = "rpg-proof-handoff";
const VERIFICATION_STORAGE_KEY = "rpg:latest-verification";
const VERIFICATION_CHANNEL = "rpg-verification";

const state = {
  sessionId: newSessionId(),
  taskId: "canister-cap-secure",
  taskLabel: "Canister secure check",
  instruction: "Turn clockwise to secure the cap.",
  workerId: "worker-demo-01",
  taskClass: "green task",
  attemptNumber: 0,
  handoffMode: "local dashboard event",
  proofEndpoint: null,
  provider: null,
  fallbackUsed: false,
  targetLocked: false,
  anchorLockedAt: null,
  anchorPose: { x: 0.5, y: 0.58, scale: 1 },
  beforeCapture: null,
  instructionCompletedAt: null,
  afterCapture: null,
  proofRecord: null,
  handoffRecord: null,
  verificationRecord: null,
  eventLog: [],
  stream: null,
  status: "Ready",
  demoProvider: null,
  autoStart: false,
  autoAnchor: false,
  demoScript: null,
  autoplayRunning: false,
};

let proofChannel = null;
let verificationChannel = null;

function newSessionId() {
  const stamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  return `canister-${stamp}`;
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
}

function readConfigFromUrl() {
  if (!window.location || !window.location.search) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  state.taskId = params.get("taskId") || state.taskId;
  state.taskLabel = params.get("taskLabel") || state.taskLabel;
  state.instruction = params.get("instruction") || state.instruction;
  state.workerId = params.get("workerId") || state.workerId;
  state.taskClass = params.get("taskClass") || state.taskClass;
  state.proofEndpoint = params.get("proofEndpoint") || null;
  state.handoffMode = state.proofEndpoint ? "webhook-ready payload" : "local dashboard event";
  state.demoProvider = params.get("demoProvider") || null;
  state.autoStart = params.get("autoStart") === "1";
  state.autoAnchor = params.get("autoAnchor") === "1";
  state.demoScript = params.get("demoScript") || null;
}

function detectProvider() {
  return PROVIDERS.find((provider) => provider.isAvailable()) || PROVIDERS[2];
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

async function startSession() {
  state.provider = detectProvider();
  state.fallbackUsed = state.provider.id !== "8thwall";
  state.status = `Session started with ${state.provider.label}`;
  recordEvent("task_opened", {
    provider: state.provider.id,
    taskId: state.taskId,
    workerId: state.workerId,
  });

  markStep(DOM.stepSession, true);
  render();

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" },
      },
      audio: false,
    });

    state.stream = stream;
    DOM.cameraFeed.srcObject = stream;
    DOM.cameraFallback.classList.add("hidden");
    DOM.statusChip.textContent = "Camera live";
  } catch (error) {
    state.status = "Camera unavailable. Continue with fallback anchor.";
    DOM.statusChip.textContent = "Camera unavailable";
    DOM.cameraFallback.classList.remove("hidden");
  }

  if (state.provider.id === "manual") {
    state.status = "Ready for fallback anchor lock.";
  } else {
    state.status = `Waiting for ${state.provider.label} target lock.`;
  }

  render();
}

function stopCamera() {
  if (!state.stream) {
    return;
  }

  state.stream.getTracks().forEach((track) => track.stop());
  state.stream = null;
  DOM.cameraFeed.srcObject = null;
}

function resetSession() {
  stopCamera();
  state.sessionId = newSessionId();
  state.provider = null;
  state.fallbackUsed = false;
  state.attemptNumber = 0;
  state.targetLocked = false;
  state.anchorLockedAt = null;
  state.beforeCapture = null;
  state.instructionCompletedAt = null;
  state.afterCapture = null;
  state.proofRecord = null;
  state.handoffRecord = null;
  state.verificationRecord = null;
  state.eventLog = [];
  state.status = "Ready";
  state.anchorPose = { x: 0.5, y: 0.58, scale: 1 };

  DOM.beforeImage.removeAttribute("src");
  DOM.afterImage.removeAttribute("src");
  DOM.beforeMeta.textContent = "Not captured";
  DOM.afterMeta.textContent = "Not captured";
  DOM.cameraFallback.classList.remove("hidden");
  DOM.statusChip.textContent = "Ready";

  [DOM.stepSession, DOM.stepAnchor, DOM.stepBefore, DOM.stepAction, DOM.stepAfter, DOM.stepProof].forEach(
    (item) => markStep(item, false),
  );

  render();
}

function markStep(node, done) {
  node.classList.toggle("done", done);
}

function lockManualAnchor() {
  targetFound({
    name: "canister-tabletop-target",
    provider: "manual",
    x: 0.5,
    y: 0.58,
    scale: 1,
  });
}

function simulateProviderTarget(providerId) {
  const provider = PROVIDERS.find((entry) => entry.id === providerId);
  if (!provider) {
    state.status = `Unknown demo provider: ${providerId}`;
    render();
    return;
  }

  targetFound({
    name: "canister-tabletop-target",
    provider: provider.id,
    x: 0.5,
    y: 0.56,
    scale: 1,
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clearAfterCapture() {
  state.afterCapture = null;
  DOM.afterImage.removeAttribute("src");
  DOM.afterMeta.textContent = "Not captured";
  markStep(DOM.stepAfter, false);
}

function clearSubmissionState(reason) {
  const hadSubmissionState = Boolean(
    state.proofRecord || state.handoffRecord || state.verificationRecord,
  );

  state.proofRecord = null;
  state.handoffRecord = null;
  state.verificationRecord = null;
  markStep(DOM.stepProof, false);

  if (hadSubmissionState) {
    recordEvent("proof_reset", { reason });
  }
}

async function runAutoplayDemo() {
  if (state.autoplayRunning) {
    return;
  }

  state.autoplayRunning = true;
  recordEvent("autoplay_started", {
    provider: state.provider ? state.provider.id : state.demoProvider || "manual",
  });

  await delay(250);
  if (!state.beforeCapture) {
    captureFrame("before");
  }

  await delay(250);
  if (!state.instructionCompletedAt) {
    markInstructionCompleted();
  }

  await delay(250);
  if (!state.afterCapture) {
    captureFrame("after");
  }

  await delay(250);
  if (!state.proofRecord) {
    generateProofRecord();
  }

  await delay(250);
  if (state.proofRecord && !state.handoffRecord) {
    dispatchProofRecord();
  }
}

function targetFound(payload) {
  state.targetLocked = true;
  state.anchorLockedAt = nowIso();
  state.anchorPose = {
    x: typeof payload.x === "number" ? payload.x : 0.5,
    y: typeof payload.y === "number" ? payload.y : 0.58,
    scale: typeof payload.scale === "number" ? payload.scale : 1,
  };

  if (payload.provider) {
    const matchingProvider = PROVIDERS.find((provider) => provider.id === payload.provider);
    if (matchingProvider) {
      state.provider = matchingProvider;
      state.fallbackUsed = matchingProvider.id !== "8thwall";
    }
  }

  state.status = `Anchor locked on ${payload.name || "canister target"}.`;
  recordEvent("anchor_locked", {
    provider: payload.provider || (state.provider ? state.provider.id : "manual"),
    targetId: payload.name || "canister-tabletop-target",
  });
  markStep(DOM.stepAnchor, true);
  positionAnchor();
  render();
}

function targetLost() {
  state.targetLocked = false;
  state.status = "Target lost. Reacquire the tabletop target.";
  recordEvent("target_lost", {
    provider: state.provider ? state.provider.id : "unknown",
  });
  markStep(DOM.stepAnchor, false);
  render();
}

function positionAnchor() {
  const { x, y, scale } = state.anchorPose;
  DOM.anchorCard.style.left = `${x * 100}%`;
  DOM.anchorCard.style.top = `${y * 100}%`;
  DOM.anchorCard.style.transform = `translate(-50%, -50%) scale(${scale})`;
}

function captureFrame(kind) {
  if (!state.targetLocked) {
    state.status = "Lock the tabletop target before capturing proof.";
    render();
    return;
  }

  const capture = state.stream ? grabVideoFrame() : makePlaceholderCapture(kind);

  if (kind === "before") {
    clearSubmissionState("before_recaptured");
    state.beforeCapture = capture;
    state.instructionCompletedAt = null;
    clearAfterCapture();
    DOM.beforeImage.src = capture.dataUrl;
    DOM.beforeMeta.textContent = capture.capturedAt;
    markStep(DOM.stepBefore, true);
    markStep(DOM.stepAction, false);
    state.status = "Before proof captured.";
    recordEvent("before_captured", {
      capturedAt: capture.capturedAt,
    });
  } else {
    if (!state.instructionCompletedAt) {
      state.status = "Mark the cap as secured before capturing the after proof.";
      render();
      return;
    }

    clearSubmissionState("after_recaptured");
    state.afterCapture = capture;
    DOM.afterImage.src = capture.dataUrl;
    DOM.afterMeta.textContent = capture.capturedAt;
    markStep(DOM.stepAfter, true);
    state.status = "After proof captured.";
    recordEvent("after_captured", {
      capturedAt: capture.capturedAt,
    });
  }

  render();
}

function markInstructionCompleted() {
  if (!state.targetLocked) {
    state.status = "Lock the tabletop target before confirming the cap is secured.";
    render();
    return;
  }

  if (!state.beforeCapture) {
    state.status = "Capture the before proof before confirming the action.";
    render();
    return;
  }

  if (state.instructionCompletedAt) {
    state.status = "Cap secure confirmation already recorded.";
    render();
    return;
  }

  state.instructionCompletedAt = nowIso();
  state.status = "Cap secure confirmation recorded.";
  recordEvent("instruction_completed", {
    completedAt: state.instructionCompletedAt,
    instruction: state.instruction,
  });
  markStep(DOM.stepAction, true);
  render();
}

function captureSummary(capture, kind) {
  return {
    kind,
    capturedAt: capture.capturedAt,
    mimeType: "image/jpeg",
    previewDataUrl: capture.dataUrl,
  };
}

function grabVideoFrame() {
  const width = DOM.cameraFeed.videoWidth || 1280;
  const height = DOM.cameraFeed.videoHeight || 720;

  DOM.captureCanvas.width = width;
  DOM.captureCanvas.height = height;

  const ctx = DOM.captureCanvas.getContext("2d");
  ctx.drawImage(DOM.cameraFeed, 0, 0, width, height);

  return {
    capturedAt: nowIso(),
    dataUrl: DOM.captureCanvas.toDataURL("image/jpeg", 0.9),
  };
}

function makePlaceholderCapture(kind) {
  const width = 960;
  const height = 720;
  DOM.captureCanvas.width = width;
  DOM.captureCanvas.height = height;
  const ctx = DOM.captureCanvas.getContext("2d");

  ctx.fillStyle = "#182126";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#ff6b2c";
  ctx.fillRect(60, 60, width - 120, height - 120);
  ctx.fillStyle = "#fffaf0";
  ctx.fillRect(120, 120, width - 240, height - 240);

  ctx.fillStyle = "#182126";
  ctx.font = '700 44px "Trebuchet MS", sans-serif';
  ctx.fillText(`CANISTER ${kind.toUpperCase()} PROOF`, 150, 260);
  ctx.font = '400 28px "Trebuchet MS", sans-serif';
  ctx.fillText(state.instruction, 150, 330);
  ctx.fillText(nowIso(), 150, 390);

  return {
    capturedAt: nowIso(),
    dataUrl: DOM.captureCanvas.toDataURL("image/jpeg", 0.92),
  };
}

function generateProofRecord() {
  if (!state.beforeCapture || !state.instructionCompletedAt || !state.afterCapture) {
    state.status = "Capture before, confirm the action, and capture after proof before submission.";
    render();
    return;
  }

  clearSubmissionState("proof_regenerated");
  state.attemptNumber += 1;
  recordEvent("proof_submitted", {
    result: "proof_submitted",
    attemptNumber: state.attemptNumber,
  });

  state.proofRecord = {
    schemaVersion: "rpg.canister-proof.v1",
    sessionId: state.sessionId,
    taskId: state.taskId,
    taskLabel: state.taskLabel,
    workerId: state.workerId,
    taskClass: state.taskClass,
    attemptNumber: state.attemptNumber,
    taskStep: "Step 2 of 3",
    instruction: state.instruction,
    provider: state.provider ? state.provider.id : "manual",
    fallbackUsed: state.fallbackUsed,
    anchorLockedAt: state.anchorLockedAt,
    beforeCapturedAt: state.beforeCapture.capturedAt,
    instructionCompletedAt: state.instructionCompletedAt,
    afterCapturedAt: state.afterCapture.capturedAt,
    evidence: [
      captureSummary(state.beforeCapture, "before"),
      captureSummary(state.afterCapture, "after"),
    ],
    eventLog: [...state.eventLog],
    dashboardHandoff: {
      mode: state.handoffMode,
      endpoint: state.proofEndpoint,
      dispatchedAt: null,
      status: "ready",
    },
    result: "proof_submitted",
    readyForVerification: true,
    targetId: "canister-tabletop-target",
  };

  markStep(DOM.stepProof, true);
  state.status = "Proof package ready for verification.";
  render();
}

function buildHandoffRecord() {
  if (!state.proofRecord) {
    return null;
  }

  return {
    eventType: "rpg:proof-ready",
    issuedAt: nowIso(),
    route: state.proofEndpoint || "window-event",
    summary: "AR guidance complete. Proof package ready for verification.",
    payload: state.proofRecord,
  };
}

function dispatchProofRecord() {
  if (!state.proofRecord) {
    state.status = "Generate a proof record before dispatching handoff.";
    render();
    return;
  }

  state.handoffRecord = buildHandoffRecord();
  state.proofRecord.dashboardHandoff.dispatchedAt = state.handoffRecord.issuedAt;
  state.proofRecord.dashboardHandoff.status = "dispatched";
  recordEvent("handoff_dispatched", {
    route: state.handoffRecord.route,
  });
  state.proofRecord.eventLog = [...state.eventLog];

  if (window.localStorage && typeof window.localStorage.setItem === "function") {
    window.localStorage.setItem(
      PROOF_HANDOFF_STORAGE_KEY,
      JSON.stringify(state.handoffRecord),
    );
  }

  const channel = getProofChannel();
  if (channel && typeof channel.postMessage === "function") {
    channel.postMessage(state.handoffRecord);
  }

  if (typeof window.dispatchEvent === "function" && typeof CustomEvent === "function") {
    window.dispatchEvent(
      new CustomEvent("rpg:proof-ready", {
        detail: state.handoffRecord,
      }),
    );
  }

  if (window.canisterGuidanceApp && typeof window.canisterGuidanceApp.onProofReady === "function") {
    window.canisterGuidanceApp.onProofReady(state.handoffRecord);
  }

  if (!state.verificationRecord) {
    state.status = "Dashboard handoff dispatched.";
  }
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
    state.proofRecord.eventLog = [...state.eventLog];
    render();
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
    state.proofRecord.dashboardHandoff.status = record.result;
    state.proofRecord.dashboardHandoff.verifiedAt = record.verifiedAt;
    state.proofRecord.eventLog = [...state.eventLog];
  }

  state.status =
    record.result === "verified"
      ? "Dashboard marked the proof as verified."
      : "Dashboard requested a retry.";
  render();
}

function loadStoredVerification() {
  if (!window.localStorage || typeof window.localStorage.getItem !== "function") {
    return;
  }

  const raw = window.localStorage.getItem(VERIFICATION_STORAGE_KEY);
  if (!raw) {
    return;
  }

  try {
    applyVerificationRecord(JSON.parse(raw));
  } catch (error) {
    // Ignore malformed cached verification state.
  }
}

async function copyProofRecord() {
  if (!state.proofRecord) {
    state.status = "Generate a proof record before copying it.";
    render();
    return;
  }

  const proofText = JSON.stringify(state.proofRecord, null, 2);
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(proofText);
    state.status = "Proof JSON copied.";
  } else {
    state.status = "Clipboard API unavailable in this browser.";
  }

  render();
}

function downloadProofRecord() {
  if (!state.proofRecord || !document.createElement) {
    state.status = "Generate a proof record before downloading it.";
    render();
    return;
  }

  const blob = new Blob([JSON.stringify(state.proofRecord, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.sessionId}-proof.json`;
  if (typeof link.click === "function") {
    link.click();
  }
  URL.revokeObjectURL(url);
  state.status = "Proof JSON download prepared.";
  render();
}

function render() {
  const providerLabel = state.provider ? state.provider.label : "detecting";
  DOM.providerChip.textContent = `Provider: ${providerLabel}`;
  DOM.statusChip.textContent = state.status;
  DOM.taskIdValue.textContent = state.taskId;
  DOM.workerIdValue.textContent = state.workerId;
  DOM.sessionIdValue.textContent = state.sessionId;
  DOM.handoffModeValue.textContent = state.handoffMode;
  DOM.taskClassValue.textContent = state.taskClass;
  DOM.attemptValue.textContent = state.proofRecord ? String(state.proofRecord.attemptNumber) : String(state.attemptNumber);
  DOM.anchorCard.classList.toggle("hidden", !state.targetLocked);

  DOM.lockButton.disabled = !state.provider || state.targetLocked;
  DOM.beforeButton.disabled = !state.targetLocked;
  DOM.completeActionButton.disabled = !(state.beforeCapture && !state.instructionCompletedAt);
  DOM.afterButton.disabled = !(state.beforeCapture && state.instructionCompletedAt);
  DOM.proofButton.disabled = !(state.beforeCapture && state.instructionCompletedAt && state.afterCapture);
  DOM.copyProofButton.disabled = !state.proofRecord;
  DOM.downloadProofButton.disabled = !state.proofRecord;
  DOM.dispatchProofButton.disabled = !state.proofRecord;

  if (state.proofRecord) {
    DOM.proofOutput.textContent = JSON.stringify(state.proofRecord, null, 2);
  } else {
    DOM.proofOutput.textContent =
      "Generate a proof record after capturing before and after evidence.";
  }

  DOM.eventCountChip.textContent = `Events: ${state.eventLog.length}`;
  DOM.eventLogOutput.textContent = state.eventLog.length
    ? JSON.stringify(state.eventLog, null, 2)
    : "Session events will appear here.";

  if (state.handoffRecord) {
    DOM.handoffStatusChip.textContent = "Proof dispatched";
    DOM.handoffSummary.textContent =
      "AR guidance complete. Proof package ready for verification.";
    DOM.dashboardOutput.textContent = JSON.stringify(state.handoffRecord, null, 2);
  } else {
    DOM.handoffStatusChip.textContent = "Awaiting proof package";
    DOM.handoffSummary.textContent = "No proof record has been dispatched yet.";
    DOM.dashboardOutput.textContent =
      "Dispatch a proof package to populate the dashboard handoff preview.";
  }

  if (state.verificationRecord) {
    DOM.verificationStatusChip.textContent =
      state.verificationRecord.result === "verified" ? "Verified" : "Needs retry";
    DOM.verificationSummary.textContent =
      state.verificationRecord.result === "verified"
        ? `Dashboard verified the canister proof at ${state.verificationRecord.verifiedAt}. ${state.verificationRecord.note || ""}`.trim()
        : `Dashboard requested a retry at ${state.verificationRecord.verifiedAt}. ${state.verificationRecord.note || ""}`.trim();
    DOM.verificationOutput.textContent = JSON.stringify(state.verificationRecord, null, 2);
  } else {
    DOM.verificationStatusChip.textContent = "Awaiting dashboard review";
    DOM.verificationSummary.textContent =
      "No verification result has been returned from the dashboard yet.";
    DOM.verificationOutput.textContent =
      "Dashboard verification updates will appear here.";
  }
}

window.canisterGuidanceApp = {
  targetFound,
  targetLost,
  getProofRecord: () => state.proofRecord,
  dispatchProofRecord,
  onProofReady: null,
  proofHandoffStorageKey: PROOF_HANDOFF_STORAGE_KEY,
  proofHandoffChannel: PROOF_HANDOFF_CHANNEL,
  verificationStorageKey: VERIFICATION_STORAGE_KEY,
  verificationChannel: VERIFICATION_CHANNEL,
};

DOM.startButton.addEventListener("click", startSession);
DOM.lockButton.addEventListener("click", lockManualAnchor);
DOM.simulate8thWallButton.addEventListener("click", () => simulateProviderTarget("8thwall"));
DOM.simulateMindARButton.addEventListener("click", () => simulateProviderTarget("mindar"));
DOM.beforeButton.addEventListener("click", () => captureFrame("before"));
DOM.completeActionButton.addEventListener("click", markInstructionCompleted);
DOM.afterButton.addEventListener("click", () => captureFrame("after"));
DOM.proofButton.addEventListener("click", generateProofRecord);
DOM.copyProofButton.addEventListener("click", copyProofRecord);
DOM.downloadProofButton.addEventListener("click", downloadProofRecord);
DOM.dispatchProofButton.addEventListener("click", dispatchProofRecord);
DOM.resetButton.addEventListener("click", resetSession);

window.addEventListener("beforeunload", stopCamera);
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

readConfigFromUrl();
loadStoredVerification();
render();

const verificationFeed = getVerificationChannel();
if (verificationFeed && typeof verificationFeed.addEventListener === "function") {
  verificationFeed.addEventListener("message", (event) => applyVerificationRecord(event.data));
} else if (verificationFeed) {
  verificationFeed.onmessage = (event) => applyVerificationRecord(event.data);
}

if (state.autoStart) {
  startSession().then(() => {
    if (state.autoAnchor) {
      simulateProviderTarget(state.demoProvider || "manual");
    }
    if (state.demoScript === "autoplay") {
      runAutoplayDemo();
    }
  });
}
