export const five = (ref) => {
  let animations = [];

  // 👉 Extend Index
  ["mixamorigRightHandIndex1","mixamorigRightHandIndex2","mixamorigRightHandIndex3","mixamorigRightHandIndex4"].forEach(bone =>
    animations.push([bone, "rotation", "z", Math.PI / 8, "+"])
  );

  // 👉 Extend Middle
  ["mixamorigRightHandMiddle1","mixamorigRightHandMiddle2","mixamorigRightHandMiddle3","mixamorigRightHandMiddle4"].forEach(bone =>
    animations.push([bone, "rotation", "z", Math.PI / 8, "+"])
  );

  // 👉 Extend Ring
  ["mixamorigRightHandRing1","mixamorigRightHandRing2","mixamorigRightHandRing3","mixamorigRightHandRing4"].forEach(bone =>
    animations.push([bone, "rotation", "z", Math.PI / 8, "+"])
  );

  // 👉 Extend Pinky
  ["mixamorigRightHandPinky1","mixamorigRightHandPinky2","mixamorigRightHandPinky3","mixamorigRightHandPinky4"].forEach(bone =>
    animations.push([bone, "rotation", "z", Math.PI / 8, "+"])
  );

  // 👉 Extend Thumb
  ["mixamorigRightHandThumb1","mixamorigRightHandThumb2","mixamorigRightHandThumb3","mixamorigRightHandThumb4"].forEach(bone =>
    animations.push([bone, "rotation", "z", Math.PI / 8, "+"])
  );

  // Small wrist/arm adjustment
  animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI / 15, "-"]);
  animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI / 10, "+"]);
  animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI / 10, "-"]);

  ref.animations.push(animations);

  // Reset Pose
  let reset = [];
  ["Index","Middle","Ring","Pinky","Thumb"].forEach(finger => {
    for (let i = 1; i <= 4; i++) {
      reset.push([`mixamorigRightHand${finger}${i}`, "rotation", "z", 0, "-"]);
    }
  });
  reset.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
  reset.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
  reset.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);
  ref.animations.push(reset);

  if (ref.pending === false) {
    ref.pending = true;
    ref.animate();
  }
};
