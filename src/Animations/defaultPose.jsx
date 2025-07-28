// ✅ Updated defaultPose to set pose immediately without animation
export const defaultPose = (ref) => {
  const pose = [
    ["mixamorigNeck", "rotation", "x", Math.PI / 12],
    ["mixamorigLeftArm", "rotation", "z", -Math.PI / 3],
    ["mixamorigLeftForeArm", "rotation", "y", -Math.PI / 1.5],
    ["mixamorigRightArm", "rotation", "z", Math.PI / 3],
    ["mixamorigRightForeArm", "rotation", "y", Math.PI / 1.5],
  ];

  for (const [boneName, action, axis, value] of pose) {
    const bone = ref.avatar.getObjectByName(boneName);
    if (bone) {
      bone[action][axis] = value;
    }
  }
};
