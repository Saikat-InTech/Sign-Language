export const one = (ref) => {
    let animations = [];

    animations.push(["mixamorigRightHandIndex1", "rotation", "z", Math.PI / 8, "+"]);

    animations.push(["mixamorigRightHandMiddle1", "rotation", "z", Math.PI / 2, "+"]);
    animations.push(["mixamorigRightHandRing1", "rotation", "z", Math.PI / 2, "+"]);
    animations.push(["mixamorigRightHandPinky1", "rotation", "z", Math.PI / 2, "+"]);

    animations.push(["mixamorigRightHand", "rotation", "z", -Math.PI / 15, "-"]);
    animations.push(["mixamorigRightForeArm", "rotation", "z", Math.PI / 10, "+"]);
    animations.push(["mixamorigRightArm", "rotation", "x", -Math.PI / 10, "-"]);

    ref.animations.push(animations);

    animations = [];

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
