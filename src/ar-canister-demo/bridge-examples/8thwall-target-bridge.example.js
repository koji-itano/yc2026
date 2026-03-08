/*
  Example wiring only. Replace with the actual 8th Wall project script and
  call these methods from the target-tracking callbacks.
*/

function onEightWallTargetFound() {
  window.canisterGuidanceApp.targetFound({
    name: "canister-tabletop-target",
    provider: "8thwall",
    x: 0.5,
    y: 0.56,
    scale: 1,
  });
}

function onEightWallTargetLost() {
  window.canisterGuidanceApp.targetLost();
}
