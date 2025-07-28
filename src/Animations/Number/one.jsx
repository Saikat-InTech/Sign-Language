export const one = (ref) => {
    let animations = [];

    // Raise Index Finger
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI / 8, "+"]);

    // Bend other fingers down
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI / 2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI / 2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI / 2, "+"]);

    // Slight wrist and arm positioning
    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI / 15, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI / 10, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI / 10, "-"]);

    ref.animations.push(animations);

    animations = [];

    // Reset pose
    animations.push(["mixamorigRightHandIndex1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", 0, "-"]);

    animations.push(["mixamorigRightHand", "rotation", "z", 0, "+"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", 0, "-"]);
    animations.push(["mixamorigRightArm", "rotation", "x", 0, "+"]);

    ref.animations.push(animations);

    if (ref.pending === false) {
        ref.pending = true;
        ref.animate();
    }
};
