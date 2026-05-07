import React, { useRef, useEffect, useState } from "react";
import { Hands } from "@mediapipe/hands";
import { Camera } from "@mediapipe/camera_utils";
import axios from "axios";

const LiveTranslation = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [prediction, setPrediction] = useState("Waiting...");
  const [confidence, setConfidence] = useState("");
  const [handBox, setHandBox] = useState(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);

  // SAME SIZE AS TRAINING
  const CAPTURE_SIZE = 300;

  // -----------------------------------
  // MEDIAPIPE HAND DETECTION
  // -----------------------------------
  useEffect(() => {
    if (!videoRef.current) return;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.7,
      minTrackingConfidence: 0.7,
    });

    hands.onResults((results) => {
      const video = videoRef.current;

      if (!video) return;

      const canvas = canvasRef.current;

      if (!canvas) return;

      const ctx = canvas.getContext("2d");

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // NO HAND
      if (!results.multiHandLandmarks?.length) {
        setHandBox(null);
        return;
      }

      const lm = results.multiHandLandmarks[0];

      let minX = 1;
      let minY = 1;
      let maxX = 0;
      let maxY = 0;

      lm.forEach((p) => {
        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);

        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
      });

      setHandBox({
        minX,
        minY,
        maxX,
        maxY,
      });

      // DRAW LANDMARKS
      lm.forEach((point) => {
        ctx.beginPath();

        ctx.arc(
          point.x * canvas.width,
          point.y * canvas.height,
          5,
          0,
          Math.PI * 2,
        );

        ctx.fillStyle = "white";

        ctx.fill();

        ctx.strokeStyle = "black";

        ctx.lineWidth = 1;

        ctx.stroke();
      });

      // DRAW BOX
      ctx.strokeStyle = "lime";

      ctx.lineWidth = 3;

      ctx.strokeRect(
        minX * canvas.width,
        minY * canvas.height,
        (maxX - minX) * canvas.width,
        (maxY - minY) * canvas.height,
      );
    });

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        await hands.send({
          image: videoRef.current,
        });
      },
      width: 640,
      height: 480,
    });

    camera.start();

    return () => {
      camera.stop();
    };
  }, []);

  // -----------------------------------
  // CREATE WHITE BACKGROUND IMAGE
  // SAME AS TRAINING CODE
  // -----------------------------------
  const cropHand = (video) => {
    if (!handBox) return null;

    const offset = 20;

    const w = video.videoWidth;
    const h = video.videoHeight;

    let x = handBox.minX * w;
    let y = handBox.minY * h;

    let boxWidth = (handBox.maxX - handBox.minX) * w;

    let boxHeight = (handBox.maxY - handBox.minY) * h;

    // OFFSET
    x = x - offset;
    y = y - offset;

    boxWidth = boxWidth + offset * 2;
    boxHeight = boxHeight + offset * 2;

    // SAFE VALUES
    x = Math.max(0, x);
    y = Math.max(0, y);

    // CREATE WHITE IMAGE
    const canvas = document.createElement("canvas");

    canvas.width = CAPTURE_SIZE;
    canvas.height = CAPTURE_SIZE;

    const ctx = canvas.getContext("2d");

    // WHITE BACKGROUND
    ctx.fillStyle = "white";

    ctx.fillRect(0, 0, CAPTURE_SIZE, CAPTURE_SIZE);

    const aspectRatio = boxHeight / boxWidth;

    // LANDSCAPE / PORTRAIT
    if (aspectRatio > 1) {
      const k = CAPTURE_SIZE / boxHeight;

      const wCal = Math.ceil(k * boxWidth);

      const hCal = CAPTURE_SIZE;

      const wGap = Math.ceil((CAPTURE_SIZE - wCal) / 2);

      ctx.drawImage(video, x, y, boxWidth, boxHeight, wGap, 0, wCal, hCal);
    } else {
      const k = CAPTURE_SIZE / boxWidth;

      const hCal = Math.ceil(k * boxHeight);

      const hGap = Math.ceil((CAPTURE_SIZE - hCal) / 2);

      ctx.drawImage(
        video,
        x,
        y,
        boxWidth,
        boxHeight,
        0,
        hGap,
        CAPTURE_SIZE,
        hCal,
      );
    }

    return canvas;
  };

  // -----------------------------------
  // CAPTURE + PREDICT
  // -----------------------------------
  const capture = async () => {
    if (!handBox) {
      setPrediction("Show hand clearly ✋");
      return;
    }

    setLoading(true);

    try {
      const canvas = cropHand(videoRef.current);

      if (!canvas) {
        setPrediction("Capture failed");
        setLoading(false);
        return;
      }

      // PREVIEW
      setPreview(canvas.toDataURL("image/png"));

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setPrediction("Capture failed");

          setLoading(false);

          return;
        }

        const formData = new FormData();

        formData.append("image", blob, "hand.png");

        try {
          const response = await axios.post(
            "http://127.0.0.1:5000/predict",
            formData,
          );

          const data = response.data;

          console.log(data);

          if (data.error) {
            setPrediction(data.error);

            setConfidence("");
          } else {
            setPrediction(data.prediction);

            setConfidence(data.confidence);
          }
        } catch (err) {
          console.error(err);

          if (err.response) {
            setPrediction(err.response.data.error || "Backend Error");
          } else {
            setPrediction("Server Not Running");
          }

          setConfidence("");
        }

        setLoading(false);
      }, "image/png");
    } catch (err) {
      console.error(err);

      setPrediction("Error capturing hand");

      setLoading(false);
    }
  };

  // -----------------------------------
  // UI
  // -----------------------------------
  return (
    <div
      style={{
        textAlign: "center",
        padding: "20px",
        fontFamily: "Arial",
      }}>
      <h1>🧠 ISL Live Translator</h1>

      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "12px",
          borderRadius: "8px",
          marginBottom: "20px",
        }}>
        <strong>Supported Gestures:</strong>
        <br />
        Numbers → 1-9
        <br />
        Letters → A, B, C, D
        <br />
        Words → Hello, Time
      </div>

      {/* VIDEO */}
      <div
        style={{
          position: "relative",
          display: "inline-block",
        }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          width="500"
          style={{
            borderRadius: "12px",
            border: "3px solid black",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        />
      </div>

      <br />
      <br />

      {/* BUTTON */}
      <button
        onClick={capture}
        disabled={loading}
        style={{
          padding: "12px 24px",
          fontSize: "18px",
          borderRadius: "8px",
          border: "none",
          backgroundColor: "#007bff",
          color: "white",
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
        }}>
        {loading ? "Predicting..." : "Capture & Predict"}
      </button>

      {/* RESULT */}
      <div
        style={{
          marginTop: "25px",
        }}>
        <h2>
          Prediction:
          <span
            style={{
              color: "green",
            }}>
            {" "}
            {prediction}
          </span>
        </h2>

        <h3>
          Confidence:
          {confidence ? ` ${confidence}%` : ""}
        </h3>
      </div>

      {/* PREVIEW */}
      {preview && (
        <div
          style={{
            marginTop: "25px",
          }}>
          <h3>Captured Hand</h3>

          <img
            src={preview}
            alt="preview"
            width="300"
            height="300"
            style={{
              border: "3px solid black",
              borderRadius: "10px",
            }}
          />
        </div>
      )}
    </div>
  );
};

export default LiveTranslation;
