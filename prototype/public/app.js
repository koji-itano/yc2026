const isWorker = window.location.pathname === "/worker";

const elements = {
  accept: document.querySelector("[data-action='accept']"),
  after: document.querySelector("[data-action='after']"),
  afterFile: document.querySelector("#afterFile"),
  afterImage: document.querySelector("#afterImage"),
  audit: document.querySelector("#auditOutput"),
  autoRun: document.querySelector("[data-action='auto-run']"),
  before: document.querySelector("[data-action='before']"),
  beforeFile: document.querySelector("#beforeFile"),
  beforeImage: document.querySelector("#beforeImage"),
  cue: document.querySelector("#presenterCue"),
  eventLog: document.querySelector("#eventLog"),
  export: document.querySelector("#exportAudit"),
  reset: document.querySelector("[data-action='reset']"),
  sample: document.querySelector("[data-action='sample']"),
  start: document.querySelector("[data-action='start']"),
  status: document.querySelector("#statusValue"),
  submit: document.querySelector("[data-action='submit']"),
  verification: document.querySelector("#verificationValue")
};

async function api(path, method = "GET", body) {
  const response = await fetch(path, {
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    method
  });
  return response.json();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function render(payload) {
  const { audit, state } = payload;
  elements.status.textContent = state.status;
  elements.verification.textContent = `${state.verification.result} | ${state.verification.note}`;
  elements.cue.textContent = state.presenterCue;
  elements.audit.textContent = JSON.stringify(audit, null, 2);
  elements.eventLog.textContent = state.eventLog
    .map((entry) => `${entry.timestamp}  ${entry.type}  ${entry.detail}`)
    .join("\n");
  if (elements.beforeImage) elements.beforeImage.src = state.proof.before || "";
  if (elements.afterImage) elements.afterImage.src = state.proof.after || "";
}

async function refresh() {
  const payload = await api("/api/state");
  render(payload);
}

async function submitAction(action, body) {
  const payload = await api(`/api/action/${action}`, "POST", body);
  render(payload);
}

if (elements.accept) elements.accept.onclick = () => submitAction("accept");
if (elements.start) elements.start.onclick = () => submitAction("start");
if (elements.before) {
  elements.before.onclick = async () => {
    const file = elements.beforeFile?.files?.[0];
    const image = file ? await fileToDataUrl(file) : undefined;
    submitAction("before", { image });
  };
}
if (elements.after) {
  elements.after.onclick = async () => {
    const file = elements.afterFile?.files?.[0];
    const image = file ? await fileToDataUrl(file) : undefined;
    submitAction("after", { image });
  };
}
if (elements.submit) elements.submit.onclick = () => submitAction("submit");
if (elements.sample) elements.sample.onclick = () => api("/api/auto-run", "POST").then(render);
if (elements.autoRun) elements.autoRun.onclick = () => api("/api/auto-run", "POST").then(render);
if (elements.reset) elements.reset.onclick = () => api("/api/reset", "POST").then(render);
if (elements.export) {
  elements.export.onclick = async () => {
    const payload = await api("/api/state");
    const blob = new Blob([JSON.stringify(payload.audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "rpg-audit.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };
}

refresh();
if (!isWorker) {
  setInterval(refresh, 800);
}
