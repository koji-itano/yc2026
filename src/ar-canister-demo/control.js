const DOM = {
  originChip: document.getElementById("originChip"),
  secureContextChip: document.getElementById("secureContextChip"),
  taskIdInput: document.getElementById("taskIdInput"),
  taskLabelInput: document.getElementById("taskLabelInput"),
  workerIdInput: document.getElementById("workerIdInput"),
  taskClassInput: document.getElementById("taskClassInput"),
  instructionInput: document.getElementById("instructionInput"),
  demoProviderInput: document.getElementById("demoProviderInput"),
  launchModeInput: document.getElementById("launchModeInput"),
  proofEndpointInput: document.getElementById("proofEndpointInput"),
  autoVerifyResultInput: document.getElementById("autoVerifyResultInput"),
  autoVerifyNoteInput: document.getElementById("autoVerifyNoteInput"),
  autoStartInput: document.getElementById("autoStartInput"),
  autoAnchorInput: document.getElementById("autoAnchorInput"),
  refreshLinksButton: document.getElementById("refreshLinksButton"),
  openWorkerButton: document.getElementById("openWorkerButton"),
  copyWorkerButton: document.getElementById("copyWorkerButton"),
  openDashboardButton: document.getElementById("openDashboardButton"),
  copyDashboardButton: document.getElementById("copyDashboardButton"),
  workerUrlOutput: document.getElementById("workerUrlOutput"),
  dashboardUrlOutput: document.getElementById("dashboardUrlOutput"),
  launchHint: document.getElementById("launchHint"),
};

function baseUrl(pathname) {
  const url = new URL(window.location.href);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url;
}

function buildWorkerUrl() {
  const url = baseUrl(
    window.location.pathname.replace(/control\.html$/, "index.html"),
  );
  url.searchParams.set("taskId", DOM.taskIdInput.value.trim());
  url.searchParams.set("taskLabel", DOM.taskLabelInput.value.trim());
  url.searchParams.set("workerId", DOM.workerIdInput.value.trim());
  url.searchParams.set("taskClass", DOM.taskClassInput.value);
  url.searchParams.set("instruction", DOM.instructionInput.value.trim());
  url.searchParams.set("demoProvider", DOM.demoProviderInput.value);
  if (DOM.launchModeInput.value === "scripted") {
    url.searchParams.set("demoScript", "autoplay");
  }

  const proofEndpoint = DOM.proofEndpointInput.value.trim();
  if (proofEndpoint) {
    url.searchParams.set("proofEndpoint", proofEndpoint);
  }

  if (DOM.autoStartInput.checked) {
    url.searchParams.set("autoStart", "1");
  }
  if (DOM.autoAnchorInput.checked) {
    url.searchParams.set("autoAnchor", "1");
  }

  return url.toString();
}

function buildDashboardUrl() {
  const url = baseUrl(
    window.location.pathname.replace(/control\.html$/, "dashboard.html"),
  );
  if (DOM.launchModeInput.value === "scripted") {
    url.searchParams.set("autoVerify", "1");
    url.searchParams.set("verificationResult", DOM.autoVerifyResultInput.value);
    url.searchParams.set("verificationNote", DOM.autoVerifyNoteInput.value.trim());
  }
  return url.toString();
}

async function copyText(text, fallbackNode) {
  if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
    await navigator.clipboard.writeText(text);
    fallbackNode.textContent = `${text}\n\nCopied to clipboard.`;
    return;
  }

  fallbackNode.textContent = `${text}\n\nClipboard API unavailable in this browser.`;
}

function refreshOutputs() {
  DOM.workerUrlOutput.textContent = buildWorkerUrl();
  DOM.dashboardUrlOutput.textContent = buildDashboardUrl();
}

function refreshOriginStatus() {
  const { hostname, origin, protocol } = window.location;
  const isLanOrigin = hostname !== "localhost" && hostname !== "127.0.0.1";
  const secure = window.isSecureContext;

  DOM.originChip.textContent = `Origin: ${origin}`;
  DOM.secureContextChip.textContent = secure ? "Secure context: yes" : "Secure context: no";

  if (secure) {
    DOM.launchHint.textContent =
      "This page is in a secure context. The copied worker link can request the phone camera if the browser allows it.";
    return;
  }

  if (protocol === "http:" && isLanOrigin) {
    DOM.launchHint.textContent =
      "This is an HTTP LAN URL. The phone can open the page, but camera-based AR may be blocked until you serve it over HTTPS or 8th Wall.";
    return;
  }

  DOM.launchHint.textContent =
    "Open this control page over your laptop's Wi-Fi IP if you want the copied worker link to point at the same local server for the phone.";
}

DOM.refreshLinksButton.addEventListener("click", refreshOutputs);
DOM.openWorkerButton.addEventListener("click", () => {
  window.open(buildWorkerUrl(), "_blank", "noopener,noreferrer");
});
DOM.copyWorkerButton.addEventListener("click", () =>
  copyText(buildWorkerUrl(), DOM.workerUrlOutput),
);
DOM.openDashboardButton.addEventListener("click", () => {
  window.open(buildDashboardUrl(), "_blank", "noopener,noreferrer");
});
DOM.copyDashboardButton.addEventListener("click", () =>
  copyText(buildDashboardUrl(), DOM.dashboardUrlOutput),
);

[
  DOM.taskIdInput,
  DOM.taskLabelInput,
  DOM.workerIdInput,
  DOM.taskClassInput,
  DOM.instructionInput,
  DOM.demoProviderInput,
  DOM.launchModeInput,
  DOM.proofEndpointInput,
  DOM.autoVerifyResultInput,
  DOM.autoVerifyNoteInput,
  DOM.autoStartInput,
  DOM.autoAnchorInput,
].forEach((node) => {
  node.addEventListener("input", refreshOutputs);
  node.addEventListener("change", refreshOutputs);
});

refreshOutputs();
refreshOriginStatus();
