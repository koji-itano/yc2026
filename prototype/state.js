const sampleBeforeImage = "/assets/proof-before.svg";
const sampleAfterImage = "/assets/proof-after.svg";

function createInitialState() {
  return {
    assetId: "CANISTER-03",
    eventLog: [],
    operatorId: "worker-demo-01",
    payoutAmount: "$15",
    presenterCue:
      "AI opens a green-task bounty, the worker submits proof, and the system releases payout with an audit trail.",
    proof: {
      after: null,
      before: null
    },
    quest: {
      difficulty: "Green",
      estimate: "8 min",
      location: "Toranomon Hills / Tabletop Demo",
      reward: "+15 XP + $15",
      title: "Secure canister safety cap"
    },
    status: "OPEN BOUNTY",
    verification: {
      note: "Awaiting proof submission.",
      result: "pending"
    }
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function pushEvent(state, type, detail) {
  state.eventLog.push({
    detail,
    timestamp: new Date().toISOString(),
    type
  });
}

function buildAuditRecord(state) {
  return {
    assetId: state.assetId,
    operatorId: state.operatorId,
    payoutAmount: state.payoutAmount,
    proof: clone(state.proof),
    quest: clone(state.quest),
    status: state.status,
    verification: clone(state.verification)
  };
}

function applyAction(state, action, payload = {}) {
  switch (action) {
    case "reset":
      return createInitialState();
    case "accept":
      state.status = "ACCEPTED";
      pushEvent(state, action, "Worker accepted the bounty.");
      break;
    case "start":
      state.status = "IN PROGRESS";
      pushEvent(state, action, "Worker started the task.");
      break;
    case "before":
      state.proof.before = payload.image || sampleBeforeImage;
      pushEvent(state, action, "Before proof captured.");
      break;
    case "after":
      state.proof.after = payload.image || sampleAfterImage;
      pushEvent(state, action, "After proof captured.");
      break;
    case "submit":
      state.status = "PROOF SUBMITTED";
      state.verification.note = "Proof received. Verification running.";
      state.verification.result = "pending";
      pushEvent(state, action, "Proof package submitted.");
      break;
    case "verified":
      state.status = "VERIFIED";
      state.verification.note = payload.note || "Verification passed.";
      state.verification.result = "pass";
      pushEvent(state, action, state.verification.note);
      break;
    case "paid":
      state.status = "PAID";
      pushEvent(state, action, "Simulated payout released.");
      break;
    case "auto":
      state = applyAction(state, "reset");
      state = applyAction(state, "accept");
      state = applyAction(state, "start");
      state = applyAction(state, "before");
      state = applyAction(state, "after");
      state = applyAction(state, "submit");
      state = applyAction(state, "verified", {
        note: "Sample proof matched the expected cap-secured state."
      });
      state = applyAction(state, "paid");
      return state;
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  return state;
}

module.exports = {
  applyAction,
  buildAuditRecord,
  createInitialState,
  sampleAfterImage,
  sampleBeforeImage
};
