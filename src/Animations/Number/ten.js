export const ten = (ref) => {
    let animations = [];

    // Fold all fingers (fist)
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI / 2, "+"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI / 2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI / 2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI / 2, "+"]);

    // Slight fist wrist / arm adjustment
    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI / 20, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI / 16, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI / 16, "-"]);

    ref.animations.push(animations);

    animations = [];

    // Reset fingers
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);

    // Reset arm
    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if (ref.pending === false) {
        ref.pending = true;
        ref.animate();
    }
};
