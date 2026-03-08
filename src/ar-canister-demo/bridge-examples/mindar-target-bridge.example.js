/*
  Example wiring only. Replace with the actual MindAR image target setup and
  forward tracking state to the shared app contract.
*/

function onMindARTargetFound() {
  window.canisterGuidanceApp.targetFound({
    name: "canister-tabletop-target",
    provider: "mindar",
    x: 0.5,
    y: 0.56,
    scale: 1,
  });
}

function onMindARTargetLost() {
  window.canisterGuidanceApp.targetLost();
}
