const PROOF_HANDOFF_STORAGE_KEY = "rpg:latest-proof-handoff";
const PROOF_HANDOFF_CHANNEL = "rpg-proof-handoff";
const VERIFICATION_STORAGE_KEY = "rpg:latest-verification";
const VERIFICATION_CHANNEL = "rpg-verification";

const DOM = {
  receiverStatusChip: document.getElementById("receiverStatusChip"),
  receiverRouteChip: document.getElementById("receiverRouteChip"),
  dashboardTaskId: document.getElementById("dashboardTaskId"),
  dashboardWorkerId: document.getElementById("dashboardWorkerId"),
  dashboardProvider: document.getElementById("dashboardProvider"),
  dashboardResult: document.getElementById("dashboardResult"),
  dashboardTaskClass: document.getElementById("dashboardTaskClass"),
  dashboardAttempt: document.getElementById("dashboardAttempt"),
  dashboardSummaryTitle: document.getElementById("dashboardSummaryTitle"),
  dashboardSummary: document.getElementById("dashboardSummary"),
  dashboardBeforeMeta: document.getElementById("dashboardBeforeMeta"),
  dashboardAfterMeta: document.getElementById("dashboardAfterMeta"),
  dashboardBeforeImage: document.getElementById("dashboardBeforeImage"),
  dashboardAfterImage: document.getElementById("dashboardAfterImage"),
  dashboardPayload: document.getElementById("dashboardPayload"),
  dashboardEventCountChip: document.getElementById("dashboardEventCountChip"),
  dashboardEventLog: document.getElementById("dashboardEventLog"),
  refreshButton: document.getElementById("refreshButton"),
  verifyButton: document.getElementById("verifyButton"),
  retryButton: document.getElementById("retryButton"),
  verificationActionSummary: document.getElementById("verificationActionSummary"),
  verificationNoteInput: document.getElementById("verificationNoteInput"),
};

let proofChannel = null;
let verificationChannel = null;
let latestHandoff = null;
let autoVerify = false;
let autoVerifyResult = "verified";
let autoVerifyNote = "";
let autoVerifyConsumedSessionId = null;

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

function safeReadStoredHandoff() {
  if (!window.localStorage || typeof window.localStorage.getItem !== "function") {
    return null;
  }

  const raw = window.localStorage.getItem(PROOF_HANDOFF_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    return null;
  }
}

function readConfigFromUrl() {
  if (!window.location || !window.location.search) {
    return;
  }

  const params = new URLSearchParams(window.location.search);
  autoVerify = params.get("autoVerify") === "1";
  autoVerifyResult = params.get("verificationResult") || autoVerifyResult;
  autoVerifyNote = params.get("verificationNote") || autoVerifyNote;
  DOM.verificationNoteInput.value = autoVerifyNote;
}

function renderEmptyState() {
  DOM.receiverStatusChip.textContent = "Waiting for worker handoff";
  DOM.receiverRouteChip.textContent = "Route: browser channels";
  DOM.dashboardTaskId.textContent = "No handoff yet";
  DOM.dashboardWorkerId.textContent = "No handoff yet";
  DOM.dashboardProvider.textContent = "No handoff yet";
  DOM.dashboardResult.textContent = "Awaiting proof";
  DOM.dashboardTaskClass.textContent = "Awaiting proof";
  DOM.dashboardAttempt.textContent = "Awaiting proof";
  DOM.dashboardSummaryTitle.textContent = "Proof package ready for verification";
  DOM.dashboardSummary.textContent =
    "Open the worker page and dispatch a proof package to populate this dashboard.";
  DOM.dashboardBeforeMeta.textContent = "Not available";
  DOM.dashboardAfterMeta.textContent = "Not available";
  DOM.dashboardBeforeImage.removeAttribute("src");
  DOM.dashboardAfterImage.removeAttribute("src");
  DOM.dashboardPayload.textContent = "Awaiting structured proof handoff.";
  DOM.dashboardEventCountChip.textContent = "Events: 0";
  DOM.dashboardEventLog.textContent = "Awaiting worker session events.";
  DOM.verificationActionSummary.textContent =
    "Choose a verification outcome after reviewing the proof package.";
  DOM.verifyButton.disabled = true;
  DOM.retryButton.disabled = true;
}

function renderHandoff(handoff) {
  if (!handoff || !handoff.payload) {
    latestHandoff = null;
    renderEmptyState();
    return;
  }

  latestHandoff = handoff;

  const beforeEvidence = Array.isArray(handoff.payload.evidence)
    ? handoff.payload.evidence.find((entry) => entry.kind === "before")
    : null;
  const afterEvidence = Array.isArray(handoff.payload.evidence)
    ? handoff.payload.evidence.find((entry) => entry.kind === "after")
    : null;

  DOM.receiverStatusChip.textContent = "Worker proof received";
  DOM.receiverRouteChip.textContent = `Route: ${handoff.route}`;
  DOM.dashboardTaskId.textContent = handoff.payload.taskId || "Unknown";
  DOM.dashboardWorkerId.textContent = handoff.payload.workerId || "Unknown";
  DOM.dashboardProvider.textContent = handoff.payload.provider || "Unknown";
  DOM.dashboardResult.textContent = handoff.payload.result || "Unknown";
  DOM.dashboardTaskClass.textContent = handoff.payload.taskClass || "Unknown";
  DOM.dashboardAttempt.textContent =
    typeof handoff.payload.attemptNumber === "number"
      ? `Attempt ${handoff.payload.attemptNumber}`
      : "Unknown";
  DOM.dashboardSummaryTitle.textContent = handoff.summary;
  DOM.dashboardSummary.textContent = `${handoff.payload.taskLabel} from ${handoff.payload.workerId} is ready for review on attempt ${handoff.payload.attemptNumber || "?"}.`;
  DOM.dashboardBeforeMeta.textContent = beforeEvidence
    ? beforeEvidence.capturedAt
    : "Not available";
  DOM.dashboardAfterMeta.textContent = afterEvidence
    ? afterEvidence.capturedAt
    : "Not available";

  if (beforeEvidence && beforeEvidence.previewDataUrl) {
    DOM.dashboardBeforeImage.src = beforeEvidence.previewDataUrl;
  } else {
    DOM.dashboardBeforeImage.removeAttribute("src");
  }

  if (afterEvidence && afterEvidence.previewDataUrl) {
    DOM.dashboardAfterImage.src = afterEvidence.previewDataUrl;
  } else {
    DOM.dashboardAfterImage.removeAttribute("src");
  }

  DOM.dashboardPayload.textContent = JSON.stringify(handoff, null, 2);
  DOM.dashboardEventCountChip.textContent = `Events: ${Array.isArray(handoff.payload.eventLog) ? handoff.payload.eventLog.length : 0}`;
  DOM.dashboardEventLog.textContent = Array.isArray(handoff.payload.eventLog) && handoff.payload.eventLog.length
    ? JSON.stringify(handoff.payload.eventLog, null, 2)
    : "Awaiting worker session events.";
  DOM.verificationActionSummary.textContent =
    "Choose a verification outcome after reviewing the proof package.";
  DOM.verifyButton.disabled = false;
  DOM.retryButton.disabled = false;

  if (autoVerify && handoff.payload.sessionId !== autoVerifyConsumedSessionId) {
    autoVerifyConsumedSessionId = handoff.payload.sessionId;
    publishVerification(autoVerifyResult);
  } else if (autoVerify && handoff.payload.sessionId === autoVerifyConsumedSessionId) {
    DOM.verificationActionSummary.textContent =
      `Auto verification configured: ${autoVerifyResult}.${autoVerifyNote ? ` Note: ${autoVerifyNote}` : ""}`;
  }
}

function loadLatestHandoff() {
  renderHandoff(safeReadStoredHandoff());
}

function publishVerification(result) {
  if (!latestHandoff || !latestHandoff.payload) {
    DOM.verificationActionSummary.textContent = "No proof package is available to verify.";
    return;
  }

  const record = {
    eventType: "rpg:verification-updated",
    sessionId: latestHandoff.payload.sessionId,
    taskId: latestHandoff.payload.taskId,
    workerId: latestHandoff.payload.workerId,
    provider: latestHandoff.payload.provider,
    taskClass: latestHandoff.payload.taskClass,
    attemptNumber: latestHandoff.payload.attemptNumber,
    result,
    note: DOM.verificationNoteInput.value.trim(),
    verifiedAt: new Date().toISOString(),
  };

  if (window.localStorage && typeof window.localStorage.setItem === "function") {
    window.localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(record));
  }

  const channel = getVerificationChannel();
  if (channel && typeof channel.postMessage === "function") {
    channel.postMessage(record);
  }

  DOM.verificationActionSummary.textContent =
    result === "verified"
      ? `Verification sent to the worker flow.${record.note ? ` Note: ${record.note}` : ""}`
      : `Retry request sent to the worker flow.${record.note ? ` Note: ${record.note}` : ""}`;
}

window.addEventListener("storage", (event) => {
  if (event.key !== PROOF_HANDOFF_STORAGE_KEY || !event.newValue) {
    return;
  }

  try {
    renderHandoff(JSON.parse(event.newValue));
  } catch (error) {
    renderEmptyState();
  }
});

const channel = getProofChannel();
if (channel && typeof channel.addEventListener === "function") {
  channel.addEventListener("message", (event) => renderHandoff(event.data));
} else if (channel) {
  channel.onmessage = (event) => renderHandoff(event.data);
}

DOM.refreshButton.addEventListener("click", loadLatestHandoff);
DOM.verifyButton.addEventListener("click", () => publishVerification("verified"));
DOM.retryButton.addEventListener("click", () => publishVerification("needs_retry"));

readConfigFromUrl();
loadLatestHandoff();
