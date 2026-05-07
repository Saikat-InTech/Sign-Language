import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";
import Navbar from "./components/Navbar";
import Home from "./Pages/Home";
import About from "./Pages/About";
import LiveTranslation from "./Pages/LiveTranslation"; // ✅ ADD THIS

function App() {
  return (
    <BrowserRouter>
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />

            {/* ✅ NEW ROUTE */}
            <Route path="/live" element={<LiveTranslation />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;