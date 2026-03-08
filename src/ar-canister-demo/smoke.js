"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname;
const PROOF_HANDOFF_STORAGE_KEY = "rpg:latest-proof-handoff";
const VERIFICATION_STORAGE_KEY = "rpg:latest-verification";

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isIsoDateTime(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function readJsonFromStorage(sharedStorage, key) {
  const raw = sharedStorage.values.get(key);
  return raw ? JSON.parse(raw) : null;
}

function assertProofRecord(record) {
  assert(record && typeof record === "object", "Proof record is missing.");
  assert(record.schemaVersion === "rpg.canister-proof.v1", "Unexpected proof schema version.");
  assert(typeof record.sessionId === "string" && record.sessionId, "Proof record is missing sessionId.");
  assert(typeof record.taskId === "string" && record.taskId, "Proof record is missing taskId.");
  assert(typeof record.taskLabel === "string" && record.taskLabel, "Proof record is missing taskLabel.");
  assert(typeof record.workerId === "string" && record.workerId, "Proof record is missing workerId.");
  assert(
    ["green task", "yellow task", "red task"].includes(record.taskClass),
    "Proof record has an invalid taskClass.",
  );
  assert(Number.isInteger(record.attemptNumber) && record.attemptNumber >= 1, "Proof record has an invalid attemptNumber.");
  assert(typeof record.instruction === "string" && record.instruction, "Proof record is missing instruction.");
  assert(
    ["8thwall", "mindar", "manual"].includes(record.provider),
    "Proof record has an invalid provider.",
  );
  assert(typeof record.fallbackUsed === "boolean", "Proof record is missing fallbackUsed.");
  assert(isIsoDateTime(record.anchorLockedAt), "Proof record is missing anchorLockedAt.");
  assert(isIsoDateTime(record.beforeCapturedAt), "Proof record is missing beforeCapturedAt.");
  assert(
    isIsoDateTime(record.instructionCompletedAt),
    "Proof record is missing instructionCompletedAt.",
  );
  assert(isIsoDateTime(record.afterCapturedAt), "Proof record is missing afterCapturedAt.");
  assert(Array.isArray(record.evidence) && record.evidence.length >= 2, "Proof record is missing evidence.");
  record.evidence.forEach((entry) => {
    assert(["before", "after"].includes(entry.kind), "Proof evidence has an invalid kind.");
    assert(isIsoDateTime(entry.capturedAt), "Proof evidence is missing capturedAt.");
    assert(entry.mimeType === "image/jpeg", "Proof evidence has an invalid mimeType.");
    assert(
      typeof entry.previewDataUrl === "string" && entry.previewDataUrl.startsWith("data:image/jpeg;base64,"),
      "Proof evidence is missing preview data.",
    );
  });
  assert(Array.isArray(record.eventLog) && record.eventLog.length > 0, "Proof record is missing eventLog.");
  assert(record.dashboardHandoff && typeof record.dashboardHandoff === "object", "Proof record is missing dashboardHandoff.");
  assert(typeof record.dashboardHandoff.mode === "string" && record.dashboardHandoff.mode, "Proof dashboardHandoff is missing mode.");
  assert(
    record.dashboardHandoff.endpoint === null || typeof record.dashboardHandoff.endpoint === "string",
    "Proof dashboardHandoff endpoint is invalid.",
  );
  assert(
    ["ready", "dispatched", "verified", "needs_retry"].includes(record.dashboardHandoff.status),
    "Proof dashboardHandoff status is invalid.",
  );
  if (record.dashboardHandoff.dispatchedAt !== null) {
    assert(
      isIsoDateTime(record.dashboardHandoff.dispatchedAt),
      "Proof dashboardHandoff dispatchedAt is invalid.",
    );
  }
  assert(
    ["proof_submitted", "verified", "needs_retry"].includes(record.result),
    "Proof record result is invalid.",
  );
  assert(typeof record.readyForVerification === "boolean", "Proof record is missing readyForVerification.");
  assert(record.targetId === "canister-tabletop-target", "Proof record has an invalid targetId.");
}

function assertHandoffRecord(record) {
  assert(record && typeof record === "object", "Handoff record is missing.");
  assert(record.eventType === "rpg:proof-ready", "Handoff eventType is invalid.");
  assert(isIsoDateTime(record.issuedAt), "Handoff issuedAt is invalid.");
  assert(typeof record.route === "string" && record.route, "Handoff route is missing.");
  assert(typeof record.summary === "string" && record.summary, "Handoff summary is missing.");
  assertProofRecord(record.payload);
}

function assertVerificationRecord(record) {
  assert(record && typeof record === "object", "Verification record is missing.");
  assert(
    record.eventType === "rpg:verification-updated",
    "Verification eventType is invalid.",
  );
  assert(typeof record.sessionId === "string" && record.sessionId, "Verification is missing sessionId.");
  assert(typeof record.taskId === "string" && record.taskId, "Verification is missing taskId.");
  assert(typeof record.workerId === "string" && record.workerId, "Verification is missing workerId.");
  assert(
    ["8thwall", "mindar", "manual"].includes(record.provider),
    "Verification provider is invalid.",
  );
  assert(
    ["green task", "yellow task", "red task"].includes(record.taskClass),
    "Verification taskClass is invalid.",
  );
  assert(
    Number.isInteger(record.attemptNumber) && record.attemptNumber >= 1,
    "Verification attemptNumber is invalid.",
  );
  assert(
    ["verified", "needs_retry"].includes(record.result),
    "Verification result is invalid.",
  );
  assert(typeof record.note === "string", "Verification note is invalid.");
  assert(isIsoDateTime(record.verifiedAt), "Verification verifiedAt is invalid.");
}

class ClassList {
  constructor() {
    this.values = new Set();
  }

  add(...tokens) {
    tokens.forEach((token) => this.values.add(token));
  }

  remove(...tokens) {
    tokens.forEach((token) => this.values.delete(token));
  }

  toggle(token, force) {
    if (force === true) {
      this.values.add(token);
      return true;
    }
    if (force === false) {
      this.values.delete(token);
      return false;
    }
    if (this.values.has(token)) {
      this.values.delete(token);
      return false;
    }
    this.values.add(token);
    return true;
  }

  contains(token) {
    return this.values.has(token);
  }
}

class MockElement {
  constructor(id = null) {
    this.id = id;
    this.value = "";
    this.checked = false;
    this.disabled = false;
    this.textContent = "";
    this.src = "";
    this.srcObject = null;
    this.download = "";
    this.href = "";
    this.videoWidth = 1280;
    this.videoHeight = 720;
    this.width = 0;
    this.height = 0;
    this.style = {};
    this.listeners = new Map();
    this.classList = new ClassList();
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type).push(handler);
  }

  dispatchEvent(event) {
    const payload = {
      target: this,
      currentTarget: this,
      ...event,
    };
    const handlers = this.listeners.get(payload.type) || [];
    handlers.forEach((handler) => handler(payload));
    const propertyHandler = this[`on${payload.type}`];
    if (typeof propertyHandler === "function") {
      propertyHandler(payload);
    }
    return true;
  }

  click() {
    this.dispatchEvent({ type: "click" });
  }

  removeAttribute(name) {
    if (name === "src") {
      this.src = "";
      return;
    }
    delete this[name];
  }
}

class MockCanvasElement extends MockElement {
  constructor(id = null) {
    super(id);
    this.renderCount = 0;
    this.context = {
      fillStyle: "",
      font: "",
      fillRect: () => {},
      drawImage: () => {},
      fillText: () => {},
    };
  }

  getContext(kind) {
    assert(kind === "2d", `Unexpected canvas context: ${kind}`);
    return this.context;
  }

  toDataURL(type = "image/jpeg") {
    this.renderCount += 1;
    return `data:${type};base64,${Buffer.from(
      JSON.stringify({
        id: this.id,
        renderCount: this.renderCount,
        width: this.width,
        height: this.height,
      }),
    ).toString("base64")}`;
  }
}

class MockDocument {
  constructor(initialState = {}) {
    this.initialState = initialState;
    this.elements = new Map();
  }

  getElementById(id) {
    if (!this.elements.has(id)) {
      const seed = this.initialState[id] || {};
      const element = id === "captureCanvas" ? new MockCanvasElement(id) : new MockElement(id);
      Object.assign(element, seed);
      this.elements.set(id, element);
    }
    return this.elements.get(id);
  }

  createElement(tagName) {
    const element = new MockElement(tagName);
    if (tagName === "a") {
      element.click = () => {
        element.wasClicked = true;
      };
    }
    return element;
  }
}

class SharedStorage {
  constructor() {
    this.values = new Map();
    this.windows = new Set();
  }

  attachWindow(win) {
    this.windows.add(win);
    return {
      getItem: (key) => (this.values.has(key) ? this.values.get(key) : null),
      setItem: (key, value) => {
        const stringValue = String(value);
        const oldValue = this.values.has(key) ? this.values.get(key) : null;
        this.values.set(key, stringValue);
        this.windows.forEach((otherWindow) => {
          if (otherWindow === win) {
            return;
          }
          otherWindow.dispatchEvent({
            type: "storage",
            key,
            oldValue,
            newValue: stringValue,
          });
        });
      },
    };
  }
}

class SharedBroadcast {
  constructor() {
    this.channels = new Map();
  }

  createChannel(name) {
    const instance = {
      name,
      listeners: new Map(),
      onmessage: null,
      addEventListener(type, handler) {
        if (!this.listeners.has(type)) {
          this.listeners.set(type, []);
        }
        this.listeners.get(type).push(handler);
      },
      postMessage: (data) => {
        const peers = this.channels.get(name) || [];
        peers.forEach((peer) => {
          if (peer === instance) {
            return;
          }
          const event = { data };
          const handlers = peer.listeners.get("message") || [];
          handlers.forEach((handler) => handler(event));
          if (typeof peer.onmessage === "function") {
            peer.onmessage(event);
          }
        });
      },
      close: () => {
        const peers = this.channels.get(name) || [];
        this.channels.set(
          name,
          peers.filter((peer) => peer !== instance),
        );
      },
    };

    if (!this.channels.has(name)) {
      this.channels.set(name, []);
    }
    this.channels.get(name).push(instance);
    return instance;
  }
}

class CustomEventShim {
  constructor(type, init = {}) {
    this.type = type;
    this.detail = init.detail;
  }
}

class URLShim extends URL {
  static createObjectURL() {
    return "blob:mock-url";
  }

  static revokeObjectURL() {}
}

function createEnvironment({ page, search = "", initialState = {}, sharedStorage, sharedBroadcast }) {
  const document = new MockDocument(initialState);
  const listeners = new Map();
  const location = new URL(`http://localhost:4173/src/ar-canister-demo/${page}${search}`);
  const opened = [];

  const window = {
    document,
    location,
    navigator: {
      mediaDevices: {
        async getUserMedia() {
          return {
            getTracks() {
              return [{ stop() {} }];
            },
          };
        },
      },
      clipboard: {
        async writeText(text) {
          window.__clipboard = text;
        },
      },
    },
    console,
    setTimeout,
    clearTimeout,
    URL: URLShim,
    URLSearchParams,
    Blob: global.Blob,
    BroadcastChannel: function BroadcastChannel(name) {
      return sharedBroadcast.createChannel(name);
    },
    CustomEvent: CustomEventShim,
    addEventListener(type, handler) {
      if (!listeners.has(type)) {
        listeners.set(type, []);
      }
      listeners.get(type).push(handler);
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type) || [];
      handlers.forEach((handler) => handler(event));
      const propertyHandler = this[`on${event.type}`];
      if (typeof propertyHandler === "function") {
        propertyHandler(event);
      }
      return true;
    },
    open(url) {
      opened.push(url);
      return null;
    },
    __opened: opened,
  };

  window.window = window;
  window.self = window;
  window.globalThis = window;
  window.localStorage = sharedStorage.attachWindow(window);
  document.defaultView = window;

  const context = vm.createContext(window);
  return { context, window, document };
}

function loadScript(filename, options) {
  const source = fs.readFileSync(path.join(ROOT, filename), "utf8");
  const env = createEnvironment(options);
  vm.runInContext(source, env.context, { filename });
  return env;
}

async function testControlLinks() {
  const sharedStorage = new SharedStorage();
  const sharedBroadcast = new SharedBroadcast();
  const control = loadScript("control.js", {
    page: "control.html",
    sharedStorage,
    sharedBroadcast,
    initialState: {
      taskIdInput: { value: "WIL-9-canister" },
      taskLabelInput: { value: "Canister secure check" },
      workerIdInput: { value: "worker-07" },
      taskClassInput: { value: "green task" },
      instructionInput: { value: "Turn clockwise to secure the cap." },
      demoProviderInput: { value: "8thwall" },
      launchModeInput: { value: "scripted" },
      proofEndpointInput: { value: "https://example.test/handoff" },
      autoVerifyResultInput: { value: "verified" },
      autoVerifyNoteInput: { value: "Autoplay verification succeeded." },
      autoStartInput: { checked: true },
      autoAnchorInput: { checked: true },
    },
  });

  const workerUrl = control.document.getElementById("workerUrlOutput").textContent;
  const dashboardUrl = control.document.getElementById("dashboardUrlOutput").textContent;

  assert(workerUrl.includes("index.html?"), "Control page did not generate a worker URL.");
  assert(workerUrl.includes("demoScript=autoplay"), "Worker URL is missing scripted autoplay.");
  assert(workerUrl.includes("demoProvider=8thwall"), "Worker URL is missing the selected provider.");
  assert(workerUrl.includes("autoStart=1"), "Worker URL is missing auto-start.");
  assert(workerUrl.includes("autoAnchor=1"), "Worker URL is missing auto-anchor.");
  assert(
    dashboardUrl.includes("autoVerify=1"),
    "Dashboard URL is missing auto verification.",
  );
  assert(
    dashboardUrl.includes("verificationResult=verified"),
    "Dashboard URL is missing the verification result.",
  );
}

async function testManualRetryLoop() {
  const sharedStorage = new SharedStorage();
  const sharedBroadcast = new SharedBroadcast();
  const dashboard = loadScript("dashboard.js", {
    page: "dashboard.html",
    sharedStorage,
    sharedBroadcast,
  });
  const worker = loadScript("app.js", {
    page: "index.html",
    search:
      "?taskId=WIL-9-canister&workerId=worker-07&taskClass=green%20task&instruction=Turn%20clockwise%20to%20secure%20the%20cap.",
    sharedStorage,
    sharedBroadcast,
  });

  worker.document.getElementById("startButton").click();
  await delay(0);
  worker.window.canisterGuidanceApp.targetFound({
    name: "canister-tabletop-target",
    provider: "manual",
    x: 0.5,
    y: 0.58,
    scale: 1,
  });
  worker.document.getElementById("beforeButton").click();
  worker.document.getElementById("completeActionButton").click();
  worker.document.getElementById("afterButton").click();
  worker.document.getElementById("proofButton").click();
  worker.document.getElementById("dispatchProofButton").click();
  await delay(0);

  const handoffRecord = readJsonFromStorage(sharedStorage, PROOF_HANDOFF_STORAGE_KEY);
  assertHandoffRecord(handoffRecord);

  assert(
    dashboard.document.getElementById("dashboardTaskId").textContent === "WIL-9-canister",
    "Dashboard did not receive the manual handoff task ID.",
  );
  assert(
    dashboard.document.getElementById("dashboardProvider").textContent === "manual",
    "Dashboard did not receive the manual provider.",
  );

  dashboard.document.getElementById("verificationNoteInput").value =
    "Re-center the canister and capture the after proof again.";
  dashboard.document.getElementById("retryButton").click();
  await delay(0);

  const verificationRecord = readJsonFromStorage(sharedStorage, VERIFICATION_STORAGE_KEY);
  assertVerificationRecord(verificationRecord);
  assert(verificationRecord.attemptNumber === 1, "Initial verification should target attempt 1.");

  assert(
    worker.document.getElementById("verificationStatusChip").textContent === "Needs retry",
    "Worker did not receive the dashboard retry result.",
  );
  assert(
    worker.document
      .getElementById("verificationSummary")
      .textContent.includes("Re-center the canister"),
    "Worker did not render the dashboard retry note.",
  );
  assert(
    worker.window.canisterGuidanceApp.getProofRecord().result === "needs_retry",
    "Worker proof record did not update to needs_retry.",
  );
  assertProofRecord(worker.window.canisterGuidanceApp.getProofRecord());
  assert(
    worker.window.canisterGuidanceApp
      .getProofRecord()
      .eventLog.some((event) => event.type === "instruction_completed"),
    "Worker proof record is missing instruction_completed.",
  );

  worker.document.getElementById("afterButton").click();
  worker.document.getElementById("proofButton").click();
  worker.document.getElementById("dispatchProofButton").click();
  await delay(0);

  const refreshedProofRecord = worker.window.canisterGuidanceApp.getProofRecord();
  assertProofRecord(refreshedProofRecord);
  assert(
    refreshedProofRecord.result === "proof_submitted",
    "Worker did not create a fresh proof record after retry recapture.",
  );
  assert(refreshedProofRecord.attemptNumber === 2, "Retry resubmission should increment attemptNumber.");
  assert(
    worker.document.getElementById("verificationStatusChip").textContent === "Awaiting dashboard review",
    "Worker did not clear the prior verification state on recapture.",
  );
  assert(
    refreshedProofRecord.eventLog.some(
      (event) => event.type === "proof_reset" && event.detail.reason === "after_recaptured",
    ),
    "Worker proof record is missing the proof_reset audit event.",
  );

  const staleVerification = {
    eventType: "rpg:verification-updated",
    sessionId: refreshedProofRecord.sessionId,
    taskId: refreshedProofRecord.taskId,
    workerId: refreshedProofRecord.workerId,
    provider: refreshedProofRecord.provider,
    taskClass: refreshedProofRecord.taskClass,
    attemptNumber: 1,
    result: "needs_retry",
    note: "Stale retry response.",
    verifiedAt: new Date().toISOString(),
  };
  dashboard.window.localStorage.setItem(VERIFICATION_STORAGE_KEY, JSON.stringify(staleVerification));
  await delay(0);
  assert(
    worker.window.canisterGuidanceApp.getProofRecord().result === "proof_submitted",
    "A stale verification response should not update the fresh proof attempt.",
  );

  dashboard.document.getElementById("verificationNoteInput").value =
    "Fresh retry response for attempt 2.";
  dashboard.document.getElementById("retryButton").click();
  await delay(0);
  assert(
    worker.window.canisterGuidanceApp.getProofRecord().result === "needs_retry",
    "Fresh verification response should apply to the active proof attempt.",
  );
  assert(
    worker.window.canisterGuidanceApp
      .getProofRecord()
      .eventLog.some((event) => event.type === "stale_verification_ignored"),
    "Worker proof record is missing stale_verification_ignored audit event.",
  );
}

async function testAutoplayVerifiedLoop() {
  const sharedStorage = new SharedStorage();
  const sharedBroadcast = new SharedBroadcast();
  const dashboard = loadScript("dashboard.js", {
    page: "dashboard.html",
    search:
      "?autoVerify=1&verificationResult=verified&verificationNote=Autoplay%20verification%20succeeded.",
    sharedStorage,
    sharedBroadcast,
  });
  const worker = loadScript("app.js", {
    page: "index.html",
    search:
      "?taskId=WIL-9-canister&workerId=worker-07&taskClass=green%20task&instruction=Turn%20clockwise%20to%20secure%20the%20cap.&demoProvider=8thwall&autoStart=1&autoAnchor=1&demoScript=autoplay",
    sharedStorage,
    sharedBroadcast,
  });

  await delay(1400);

  const proofRecord = worker.window.canisterGuidanceApp.getProofRecord();
  assert(proofRecord, "Autoplay did not generate a proof record.");
  assertProofRecord(proofRecord);
  assert(proofRecord.attemptNumber === 1, "Autoplay should produce attempt 1.");
  assert(proofRecord.provider === "8thwall", "Autoplay did not lock the 8th Wall provider.");
  assert(
    worker.document.getElementById("verificationStatusChip").textContent === "Verified",
    "Worker did not receive the auto-verification result.",
  );
  assert(
    worker.document
      .getElementById("verificationSummary")
      .textContent.includes("Autoplay verification succeeded."),
    "Worker did not render the auto-verification note.",
  );
  assert(
    Array.isArray(proofRecord.eventLog) &&
      proofRecord.eventLog.some((event) => event.type === "handoff_dispatched") &&
      proofRecord.eventLog.some((event) => event.type === "verification_received"),
    "Autoplay proof record is missing expected audit events.",
  );
  assert(
    dashboard.document.getElementById("dashboardWorkerId").textContent === "worker-07",
    "Dashboard did not receive the autoplay worker handoff.",
  );

  const handoffRecord = readJsonFromStorage(sharedStorage, PROOF_HANDOFF_STORAGE_KEY);
  const verificationRecord = readJsonFromStorage(sharedStorage, VERIFICATION_STORAGE_KEY);
  assertHandoffRecord(handoffRecord);
  assertVerificationRecord(verificationRecord);
}

async function main() {
  const tests = [
    ["control-links", testControlLinks],
    ["manual-retry-loop", testManualRetryLoop],
    ["autoplay-verified-loop", testAutoplayVerifiedLoop],
  ];

  for (const [name, test] of tests) {
    await test();
    console.log(`PASS ${name}`);
  }

  console.log("All smoke checks passed.");
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
});
