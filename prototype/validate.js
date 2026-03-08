const assert = require("assert");
const { applyAction, buildAuditRecord, createInitialState } = require("./state");

let state = createInitialState();
assert.equal(state.status, "OPEN BOUNTY");

state = applyAction(state, "accept");
state = applyAction(state, "start");
state = applyAction(state, "before");
state = applyAction(state, "after");
state = applyAction(state, "submit");
state = applyAction(state, "verified", { note: "Validation passed." });
state = applyAction(state, "paid");

assert.equal(state.status, "PAID");
assert.equal(state.verification.result, "pass");
assert.ok(state.proof.before);
assert.ok(state.proof.after);

const audit = buildAuditRecord(state);
assert.equal(audit.status, "PAID");
assert.equal(audit.quest.title, "Secure canister safety cap");

console.log("PASS state-machine");
