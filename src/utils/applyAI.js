// // src/utils/applyAI.js
// export async function fetchAIAnimation(word) {
//   const res = await fetch("http://localhost:5000/generate-animation", {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ word }),
//   });
//   if (!res.ok) {
//     const err = await res.json().catch(() => ({}));
//     throw new Error(err.error || "Failed to fetch animation");
//   }
//   return res.json(); // { animations: [...], source: "ai" }
// }

// // applies the returned animations to ref.animations exactly as your TIME did
// export function applyAIToRef(ref, animations) {
//   // animations is an array of blocks; push each block to ref.animations
//   if (!ref || !Array.isArray(animations)) return;
//   for (const block of animations) {
//     // each block is an array like [["mixamorig...","rotation","x",0.1,"+"], ...]
//     ref.animations.push(block);
//   }
//   // ensure animate is running
//   if (ref.pending === false) {
//     ref.pending = true;
//     try {
//       ref.animate();
//     } catch (e) {
//       /* ignore */
//     }
//   }
// }
