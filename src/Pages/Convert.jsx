import '../App.css';
import { useState, useEffect, useRef } from "react";
import xbot from '../Models/xbot.glb';
import xbotPic from '../Models/xbotPic.png';
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { one } from "../Animations/Number/one";
import { defaultPose } from "../Animations/defaultpose.jsx";

function Convert() {
  const [text, setText] = useState("");
  const componentRef = useRef({});
  const { current: ref } = componentRef;
  const inputRef = useRef();
  const boneMapRef = useRef({});

  useEffect(() => {
    ref.flag = false;
    ref.pending = false;
    ref.animations = [];

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
    ref.camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / (window.innerHeight - 70),
      0.1,
      1000
    );

    ref.renderer.setSize(window.innerWidth, window.innerHeight - 100);
    document.getElementById("canvas").innerHTML = "";
    document.getElementById("canvas").appendChild(ref.renderer.domElement);

    ref.camera.position.z = 2.5;
    ref.camera.position.y = 1.6;
    ref.camera.lookAt(0, 1.2, 0);

   const loader = new GLTFLoader();
loader.load(
  xbot,
  (gltf) => {
    ref.avatar = gltf.scene;
// console.lof(ref.avatar)
    while (ref.scene.children.length > 0) {
      ref.scene.remove(ref.scene.children[0]);
    }

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    const spotLight = new THREE.SpotLight(0xff9999, 5);
    spotLight.position.set(0, 5, 5);
    ref.scene.add(ambientLight, directionalLight, spotLight);

    ref.avatar.scale.set(0.6, 0.6, 1);
    ref.avatar.rotation.y = 0;
    ref.scene.add(ref.avatar);

    boneMapRef.current = {};
    ref.avatar.traverse((child) => {
      if (child.isSkinnedMesh || child.isMesh) {
        child.frustumCulled = false;
      }
      if (child.name?.includes("mixamorig")) {
        boneMapRef.current[child.name] = child;
      }
    });

    requestAnimationFrame(() => {
      defaultPose(ref);
      ref.renderer.render(ref.scene, ref.camera);
    });
  },
  undefined,
  (error) => console.error("GLTF Load Error:", error)
);


  }, []);

  ref.animate = () => {
    if (ref.animations.length === 0) {
      ref.pending = false;
      return;
    }

    requestAnimationFrame(ref.animate);

    if (ref.animations[0].length) {
      for (let i = 0; i < ref.animations[0].length;) {
        let [boneName, action, axis, limit, sign] = ref.animations[0][i];
        const bone = ref.avatar.getObjectByName(boneName);
        if (!bone) {
          i++;
          continue;
        }

        if (sign === "+" && bone[action][axis] < limit) {
          bone[action][axis] += 0.03;
          bone[action][axis] = Math.min(bone[action][axis], limit);
          i++;
        } else if (sign === "-" && bone[action][axis] > limit) {
          bone[action][axis] -= 0.05;
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
    for (let finger of fingers) {
      for (let i = 1; i <= 4; i++) {
        const boneName = `mixamorigRightHand${finger}${i}`;
        if (boneMapRef.current[boneName]) {
          boneMapRef.current[boneName].rotation.set(0, 0, 0);
        }
      }
    }
  };

  const resetArms = () => {
    const arms = ["mixamorigRightArm", "mixamorigRightForeArm", "mixamorigLeftArm", "mixamorigLeftForeArm"];
    arms.forEach(boneName => {
      if (boneMapRef.current[boneName]) {
        boneMapRef.current[boneName].rotation.set(0, 0, 0);
      }
    });
  };

  const handleInput = () => {
    const value = inputRef.current.value.toUpperCase();
    if (!boneMapRef.current || Object.keys(boneMapRef.current).length === 0) return;

    resetFingers();
    resetArms();
  defaultPose(ref);

    if (value === "1") {
      one(ref);
      setText("Animating: 1");
      ref.animate();
    } else {
      setText("No animation for this input.");
    }
  };

 return (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    height: '100vh',
    overflow: 'hidden',
    backgroundColor: '#f5f5f5'
  }}>
    <div id="canvas" />

    <div style={{
      textAlign: 'center',
      marginTop: '10px',
      padding: '10px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <img
        src={xbotPic}
        alt="Xbot Avatar"
        style={{
          width: "100px",
          marginBottom: "10px",
          borderRadius: "10px",
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)'
        }}
      />
      <div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter 1"
          className="input-style"
          style={{ width: "220px" }}
        />
        <button
          onClick={handleInput}
          className="btn btn-primary"
          style={{ marginLeft: "10px", padding: "8px 16px" }}
        >
          Animate
        </button>
      </div>
      <p style={{ marginTop: "10px", fontSize: "16px", color: "#333" }}>{text}</p>
    </div>
  </div>
);

}

export default Convert;
