import React, { useState, useRef } from "react";
import { Mic, Send } from "lucide-react"; // modern icons (install: npm install lucide-react)

function InputBox({ onSend }) {
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const inputRef = useRef(null);

  let recognition;

  if ("webkitSpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0].transcript)
        .join("");
      setText(transcript);
    };
  }

  const startListening = () => {
    if (recognition) {
      setListening(true);
      recognition.start();
    }
  };

  const stopListening = () => {
    if (recognition) {
      setListening(false);
      recognition.stop();
    }
  };

  const handleSend = () => {
    if (text.trim() !== "") {
      onSend(text.trim());
      setText(""); // clear after send
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        width: "320px",
        background: "#fff",
        borderRadius: "12px",
        padding: "6px 10px",
        boxShadow: "0 1px 6px rgba(0,0,0,0.2)",
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or speak..."
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontSize: "14px",
        }}
      />
      <button
        onClick={listening ? stopListening : startListening}
        style={{
          background: listening ? "#f44336" : "#2196f3",
          border: "none",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Mic color="white" size={18} />
      </button>
      <button
        onClick={handleSend}
        style={{
          background: "#4caf50",
          border: "none",
          borderRadius: "50%",
          width: "36px",
          height: "36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Send color="white" size={18} />
      </button>
    </div>
  );
}

export default InputBox;
