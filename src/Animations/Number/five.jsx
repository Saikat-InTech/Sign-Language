export const five = (ref) => {
    let animations = [];

    // Open all fingers
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "+"]);

    // Natural wrist / arm pose
    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI / 14, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI / 16, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI / 16, "-"]);

    ref.animations.push(animations);

    animations = [];

    
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);

    // Reset arm
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if (!ref.pending) {
        ref.pending = true;
        ref.animate();
    }
};
