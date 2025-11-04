import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import InputBox from "../Pages/InputBox";
import xbot from "../Models/xbot.glb";
import { defaultPose } from "../Animations/defaultpose.jsx";
import { one } from "../Animations/Number/one";
import { two } from "../Animations/Number/two";
import { three } from "../Animations/Number/three";
import { four } from "../Animations/Number/four";
import { five } from "../Animations/Number/five";
import { six } from "../Animations/Number/six";
import * as alphabets from "../Animations/alphabets";
import * as words from "../Animations/words";
// import { fetchAIAnimation, applyAIToRef } from "../utils/applyAI"; // ❌ AI commented

function Home() {
  const [text, setText] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const componentRef = useRef({});
  const { current: ref } = componentRef;
  const boneMapRef = useRef({});
  const [messages, setMessages] = useState([
    { text: "Hello, how are you?", type: "message" },
    { text: "I am learning sign language.", type: "message" },
  ]);

  // 🧩 Initialize Scene
  useEffect(() => {
    ref.flag = false;
    ref.pending = false;
    ref.animations = [];
    ref.speedFactor = 1;
    ref.lastCommand = null;

    ref.scene = new THREE.Scene();
    ref.scene.background = new THREE.Color(0xeeeeee);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    ref.scene.add(ambientLight, directionalLight);

    const spotLight = new THREE.SpotLight(0xff9999, 5);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(spotLight);

    ref.renderer = new THREE.WebGLRenderer({ antialias: true });
    const container = document.getElementById("avatar-container");
    const width = Math.max(container.clientWidth, 200);
    const height = Math.max(container.clientHeight, 200);
    ref.camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 1000);
    ref.camera.position.set(0, 1.6, 2.5);
    ref.camera.lookAt(0, 1.2, 0);
    ref.renderer.setSize(width, height);
    ref.renderer.setPixelRatio(window.devicePixelRatio || 1);
    ref.camera.updateProjectionMatrix();
    container.innerHTML = "";
    container.appendChild(ref.renderer.domElement);

    const onResize = () => {
      const w = Math.max(container.clientWidth, 200);
      const h = Math.max(container.clientHeight, 200);
      ref.renderer.setSize(w, h);
      ref.camera.aspect = w / h;
      ref.camera.updateProjectionMatrix();
      ref.renderer.render(ref.scene, ref.camera);
    };
    window.addEventListener("resize", onResize);

    const loader = new GLTFLoader();
    loader.load(
      xbot,
      (gltf) => {
        ref.avatar = gltf.scene;
        while (ref.scene.children.length > 0)
          ref.scene.remove(ref.scene.children[0]);
        const amb = new THREE.AmbientLight(0xffffff, 1);
        const dir = new THREE.DirectionalLight(0xffffff, 1);
        dir.position.set(5, 5, 5);
        const spot = new THREE.SpotLight(0xff9999, 5);
        spot.position.set(0, 5, 5);
        ref.scene.add(amb, dir, spot);
        ref.avatar.scale.set(1.6, 1, 2);
        ref.avatar.position.y = 0;
        ref.scene.add(ref.avatar);

        boneMapRef.current = {};
        ref.avatar.traverse((child) => {
          if (child.isSkinnedMesh || child.isMesh) child.frustumCulled = false;
          if (child.name?.includes("mixamorig"))
            boneMapRef.current[child.name] = child;
        });

        requestAnimationFrame(() => {
          defaultPose(ref);
          ref.renderer.render(ref.scene, ref.camera);
        });
      },
      undefined,
      (error) => console.error("GLTF Load Error:", error)
    );

    return () => {
      window.removeEventListener("resize", onResize);
      try {
        ref.renderer?.dispose?.();
      } catch {}
    };
  }, [ref]);

  // 🌀 Animation Runner
  ref.animate = () => {
    if (!ref.animations.length) {
      ref.pending = false;
      setIsPlaying(false);
      return;
    }
    requestAnimationFrame(ref.animate);
    const factor = ref.speedFactor || 1;
    if (ref.animations[0].length) {
      for (let i = 0; i < ref.animations[0].length; ) {
        let [boneName, action, axis, limit, sign] = ref.animations[0][i];
        const bone = ref.avatar.getObjectByName(boneName);
        if (!bone) {
          i++;
          continue;
        }
        if (sign === "+" && bone[action][axis] < limit) {
          bone[action][axis] += 0.01 * factor;
          bone[action][axis] = Math.min(bone[action][axis], limit);
          i++;
        } else if (sign === "-" && bone[action][axis] > limit) {
          bone[action][axis] -= 0.02 * factor;
          bone[action][axis] = Math.max(bone[action][axis], limit);
          i++;
        } else {
          ref.animations[0].splice(i, 1);
        }
      }
    } else {
      ref.animations.shift();
    }
    ref.renderer.render(ref.scene, ref.camera);
  };

  const resetFingers = () => {
    const fingers = ["Thumb", "Index", "Middle", "Ring", "Pinky"];
    for (let f of fingers) {
      for (let i = 1; i <= 4; i++) {
        const bone = `mixamorigRightHand${f}${i}`;
        boneMapRef.current[bone]?.rotation.set(0, 0, 0);
      }
    }
  };

  const resetArms = () => {
    [
      "mixamorigRightArm",
      "mixamorigRightForeArm",
      "mixamorigLeftArm",
      "mixamorigLeftForeArm",
    ].forEach((b) => boneMapRef.current[b]?.rotation.set(0, 0, 0));
  };

  // 🧠 Handle Input
  const handleInput = async (manualValue) => {
    const input = (manualValue || "").toUpperCase().replace(/[^A-Z0-9\s]/g, "");
    setMessages((m) => [...m, { text: manualValue, type: "user" }]);
    ref.lastCommand = input;
    if (!ref.avatar || !Object.keys(boneMapRef.current).length) return;

    resetFingers();
    resetArms();
    defaultPose(ref);
    ref.animations = [];
    setText("");
    setIsPlaying(true);

    const numberMap = { 1: one, 2: two, 3: three, 4: four, 5: five, 6: six };

    if (numberMap[input]) {
      numberMap[input](ref);
      ref.animate();
      return;
    }

    if (words[input]) {
      try {
        words[input](ref);
        setText(`Animating: ${input}`);
        ref.pending = true;
        ref.animate();
        return;
      } catch (err) {
        console.error(`Error animating ${input}:`, err);
      }
    }

    // 🧩 AI generation commented out
    /*
    try {
      setText(`Generating AI animation for "${input}"...`);
      const aiRes = await fetchAIAnimation(input);
      if (aiRes && aiRes.pose) {
        applyAIToRef(ref, [aiRes.pose]);
        setText(`AI animated: ${input}`);
        ref.animate();
        return;
      }
    } catch (err) {
      console.warn("AI fallback failed:", err.message);
    }
    */

    // fallback → animate letter by letter
    const letters = input.split("");
    let delay = 0;
    const playLetter = (letter, delayMs) => {
      setTimeout(() => {
        const fn = (ref.alphabetMap || {})[letter] || alphabets[letter];
        if (typeof fn === "function") {
          resetFingers();
          resetArms();
          defaultPose(ref);
          fn(ref);
          setText(`Animating: ${letter}`);
          ref.pending = true;
          ref.animate();
        }
      }, delayMs);
    };
    letters.forEach((l) => {
      if (/[A-Z]/.test(l)) {
        playLetter(l, delay);
        delay += 1500;
      }
    });
    setTimeout(() => {
      setText(`Finished animating: ${input}`);
      setIsPlaying(false);
    }, delay + 500);
  };

  // 🎛 Controls
  const handleRewind = () => {
    ref.animations = [];
    ref.pending = false;
    resetFingers();
    resetArms();
    defaultPose(ref);
    ref.renderer?.render(ref.scene, ref.camera);
    setIsPlaying(false);
    setText("Rewound");
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      ref.animations = [];
      setIsPlaying(false);
      setText("Stopped");
      return;
    }
    setIsPlaying(true);
    setText("Playing");
    if ((ref.animations && ref.animations.length > 0) || ref.pending) {
      ref.animate();
      return;
    }
    const last = ref.lastCommand;
    if (!last) {
      setText("Nothing to play");
      setIsPlaying(false);
      return;
    }
    const num = {
      ONE: one,
      TWO: two,
      THREE: three,
      FOUR: four,
      FIVE: five,
      SIX: six,
    };
    if (num[last]) num[last](ref);
    ref.animate();
  };

  const handleSpeed = () => {
    const next = ref.speedFactor === 2 ? 1 : 2;
    ref.speedFactor = next;
    setSpeed(next);
    setText(`Speed: ${next}x`);
  };

  // 🧩 UI — unchanged CSS
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "24px",
        padding: "24px",
        boxSizing: "border-box",
      }}>
      <div
        style={{
          width: "520px",
          height: "420px",
          backgroundColor: "#fff",
          borderRadius: "12px",
          border: "2px solid #0085FF",
          padding: "18px",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}>
        <div
          style={{
            flex: 1,
            backgroundColor: "#f8f9fa",
            borderRadius: "10px",
            border: "1px solid #e0e3e7",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}>
          <div
            id="avatar-container"
            style={{ width: "100%", height: "100%" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            marginTop: "12px",
          }}>
          <button
            onClick={handleRewind}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "1px solid #e0e3e7",
              background: "white",
              cursor: "pointer",
            }}>
            ⏪ Rewind
          </button>
          <button
            onClick={handlePlayPause}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "1px solid #e0e3e7",
              background: "white",
              cursor: "pointer",
            }}>
            {isPlaying ? "⏸ Stop" : "▶ Play"}
          </button>
          <button
            onClick={handleSpeed}
            style={{
              padding: "8px 14px",
              borderRadius: "20px",
              border: "1px solid #e0e3e7",
              background: "white",
              cursor: "pointer",
            }}>
            Speed {ref.speedFactor ? `${ref.speedFactor}x` : `${speed}x`} ⚡
          </button>
        </div>
      </div>

      {/* Right Panel */}
      <div
        style={{
          width: "420px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "2px solid #e9eef6",
            padding: "16px",
            boxSizing: "border-box",
          }}>
          <h3 style={{ margin: 0, color: "#333" }}>Transcript Box</h3>
          <div
            style={{
              marginTop: "12px",
              background: "#f5f7fa",
              borderRadius: "8px",
              padding: "12px",
              minHeight: "160px",
            }}>
            {messages.map((m, i) => (
              <div key={i} style={{ padding: "6px 0", color: "#333" }}>
                <span style={{ color: "#0085FF" }}>{">"}</span> {m.text}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            padding: "12px",
            border: "1px solid #e0e3e7",
          }}>
          <InputBox onSend={(val) => handleInput(val)} />
          <div style={{ marginTop: 8, color: "#666", fontSize: 14 }}>
            {text}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
