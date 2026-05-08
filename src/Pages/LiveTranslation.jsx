import { useEffect, useRef, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";

const API_URL = "http://127.0.0.1:5000/predict";
const CAPTURE_SIZE = 224;
const CAPTURE_BACKGROUND = "#ffffff";
const PREDICTION_INTERVAL_MS = 500;
const MIN_CONFIDENCE = 55;

export default function LiveTranslation() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const handBoxRef = useRef(null);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);
  const isPredictingRef = useRef(false);
  const predictionIntervalRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const stablePredictionRef = useRef({
    label: "",
    candidate: "",
    count: 0,
  });

  const [predictionText, setPredictionText] = useState("Waiting for hand...");
  const [preview, setPreview] = useState(null);
  const [topPredictions, setTopPredictions] = useState([]);
  const [backendStatus, setBackendStatus] = useState("Idle");
  const [handDetected, setHandDetected] = useState(false);

  useEffect(() => {
    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    handsRef.current = hands;

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.65,
    });

    hands.onResults((results) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      const width = video.videoWidth;
      const height = video.videoHeight;

      if (!width || !height) return;

      canvas.width = width;
      canvas.height = height;
      ctx.clearRect(0, 0, width, height);

      if (!results.multiHandLandmarks?.length) {
        handBoxRef.current = null;
        setHandDetected(false);
        return;
      }

      const bestHand = results.multiHandLandmarks.reduce((best, landmarks) => {
        let minX = 1;
        let minY = 1;
        let maxX = 0;
        let maxY = 0;

        landmarks.forEach((landmark) => {
          minX = Math.min(minX, landmark.x);
          minY = Math.min(minY, landmark.y);
          maxX = Math.max(maxX, landmark.x);
          maxY = Math.max(maxY, landmark.y);
        });

        const area = (maxX - minX) * (maxY - minY);
        return !best || area > best.area
          ? { landmarks, minX, minY, maxX, maxY, area }
          : best;
      }, null);

      if (!bestHand || bestHand.area < 0.015) {
        handBoxRef.current = null;
        setHandDetected(false);
        return;
      }

      const { landmarks, minX, minY, maxX, maxY } = bestHand;
      handBoxRef.current = { minX, minY, maxX, maxY };
      setHandDetected(true);

      const boxX = minX * width;
      const boxY = minY * height;
      const boxWidth = (maxX - minX) * width;
      const boxHeight = (maxY - minY) * height;

      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

      landmarks.forEach((landmark) => {
        ctx.beginPath();
        ctx.arc(landmark.x * width, landmark.y * height, 3, 0, 2 * Math.PI);
        ctx.fillStyle = "#ff3b30";
        ctx.fill();
      });
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await hands.send({ image: videoRef.current });
        }
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    camera.start();

    predictionIntervalRef.current = window.setInterval(() => {
      void runPrediction();
    }, PREDICTION_INTERVAL_MS);

    return () => {
      if (predictionIntervalRef.current) {
        window.clearInterval(predictionIntervalRef.current);
      }

      hands.close();
    };
  }, []);

  const getCropBounds = (video) => {
    const handBox = handBoxRef.current;
    const width = video.videoWidth;
    const height = video.videoHeight;

    const rawX = handBox.minX * width;
    const rawY = handBox.minY * height;
    const rawWidth = (handBox.maxX - handBox.minX) * width;
    const rawHeight = (handBox.maxY - handBox.minY) * height;

    const size = Math.max(rawWidth, rawHeight) * 1.55;
    const centerX = rawX + rawWidth / 2;
    const centerY = rawY + rawHeight / 2;

    let x = Math.max(0, centerX - size / 2);
    let y = Math.max(0, centerY - size / 2);
    let cropSize = Math.min(size, width, height);

    if (x + cropSize > width) x = width - cropSize;
    if (y + cropSize > height) y = height - cropSize;

    return { x, y, cropSize };
  };

  const buildCaptureCanvas = (video, mirrored) => {
    const { x, y, cropSize } = getCropBounds(video);

    const canvas = document.createElement("canvas");
    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;

    const ctx = canvas.getContext("2d");
    ctx.fillStyle = CAPTURE_BACKGROUND;
    ctx.fillRect(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

    if (mirrored) {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(
        video,
        x,
        y,
        cropSize,
        cropSize,
        -CAPTURE_SIZE,
        0,
        CAPTURE_SIZE,
        CAPTURE_SIZE,
      );
      ctx.restore();
    } else {
      ctx.drawImage(
        video,
        x,
        y,
        cropSize,
        cropSize,
        0,
        0,
        CAPTURE_SIZE,
        CAPTURE_SIZE,
      );
    }

    return canvas;
  };

  const canvasToBlob = (canvas) =>
    new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
          return;
        }

        reject(new Error("Could not create image blob"));
      }, "image/jpeg", 0.95);
    });

  const predictImage = async (blob) => {
    const formData = new FormData();
    formData.append("image", blob, "frame.jpg");

    const response = await fetch(API_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error || "Prediction failed");
    }

    if (data?.prediction && !data.result) {
      return {
        ...data,
        result: data.prediction,
      };
    }

    return data;
  };

  const getStableLabel = (label) => {
    const state = stablePredictionRef.current;

    if (state.candidate === label) {
      state.count += 1;
    } else {
      state.candidate = label;
      state.count = 1;
    }

    if (state.count >= 2) {
      state.label = label;
    }

    return state.label || label;
  };

  const runPrediction = async () => {
    const video = videoRef.current;
    const handBox = handBoxRef.current;

    if (!video || !handBox || isPredictingRef.current) {
      return;
    }

    isPredictingRef.current = true;
    setBackendStatus("Predicting...");

    try {
      const normalCanvas = buildCaptureCanvas(video, false);
      const mirroredCanvas = buildCaptureCanvas(video, true);
      previewCanvasRef.current = normalCanvas;

      const [normalBlob, mirroredBlob] = await Promise.all([
        canvasToBlob(normalCanvas),
        canvasToBlob(mirroredCanvas),
      ]);

      const [normalPrediction, mirroredPrediction] = await Promise.all([
        predictImage(normalBlob),
        predictImage(mirroredBlob),
      ]);

      const predictions = [normalPrediction, mirroredPrediction].filter(
        (item) => item && !item.error,
      );

      if (!predictions.length) {
        setPredictionText("Server error");
        setBackendStatus("Backend error");
        return;
      }

      const bestPrediction = predictions.reduce((best, current) =>
        Number(current.confidence) > Number(best.confidence) ? current : best,
      );

      setPreview(normalCanvas.toDataURL("image/jpeg"));
      setTopPredictions(bestPrediction.top_predictions || []);

      if (Number(bestPrediction.confidence) < MIN_CONFIDENCE) {
        setPredictionText("Show gesture clearly");
        setBackendStatus("Low confidence");
        return;
      }

      const stableLabel = getStableLabel(bestPrediction.result);
      setPredictionText(`${stableLabel} (${Number(bestPrediction.confidence).toFixed(2)}%)`);
      setBackendStatus("Live");
    } catch (error) {
      setPredictionText("Server error");
      setBackendStatus("Backend unavailable");
    } finally {
      isPredictingRef.current = false;
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "24px" }}>
      <h2>Live ISL Translation</h2>
      <p style={{ marginTop: "8px", color: "#4b5563" }}>
        {handDetected ? "Hand detected" : "Show one hand inside the camera"}
      </p>

      <div style={{ position: "relative", display: "inline-block" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "420px",
            maxWidth: "92vw",
            borderRadius: "16px",
            background: "#111827",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "420px",
            maxWidth: "92vw",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>

      <div style={{ marginTop: "18px" }}>
        <h1 style={{ marginBottom: "8px" }}>{predictionText}</h1>
        <p style={{ color: "#6b7280" }}>Backend status: {backendStatus}</p>
      </div>

      {preview && (
        <div style={{ marginTop: "22px" }}>
          <h3>Cropped Input (224x224)</h3>
          <img
            src={preview}
            alt="cropped"
            style={{
              width: "180px",
              border: "2px solid #ef4444",
              borderRadius: "12px",
              marginTop: "10px",
              background: "#ffffff",
            }}
          />
        </div>
      )}

      {!!topPredictions.length && (
        <div style={{ marginTop: "18px" }}>
          <h3>Top Predictions</h3>
          {topPredictions.slice(0, 3).map((item) => (
            <p key={item.label} style={{ margin: "6px 0", color: "#374151" }}>
              {item.label}: {Number(item.confidence).toFixed(2)}%
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
