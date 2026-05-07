import { NavLink } from "react-router-dom";
import logo from "../assets/logo.png";

function Navbar() {
  return (
    <nav
      style={{
        width: "100%",
        height: "60px",
        padding: "1rem",
        backgroundColor: "white",
        borderBottom: "1px solid #eaeaea",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={logo}
          alt="Sign Language App"
          style={{
            width: "60px",   // 🔧 FIXED (was too big)
            height: "60px",
            objectFit: "contain",
          }}
        />

        <span style={{ fontSize: "18px", fontWeight: "500" }}>
          Sign-Language App
        </span>
      </div>

      <div style={{ display: "flex", gap: "2rem", paddingRight: "20px" }}>
        <NavLink
          to="/"
          end
          style={({ isActive }) => ({
            color: isActive ? "#0085FF" : "#666",
            textDecoration: "none",
            borderBottom: isActive
              ? "2px solid #0085FF"
              : "2px solid transparent",
            padding: "4px 0",
          })}
        >
          Home
        </NavLink>

        {/* ✅ FIXED ROUTE */}
        <NavLink
          to="/live"
          style={({ isActive }) => ({
            color: isActive ? "#0085FF" : "#666",
            textDecoration: "none",
            borderBottom: isActive
              ? "2px solid #0085FF"
              : "2px solid transparent",
            padding: "4px 0",
          })}
        >
          Live Translation
        </NavLink>

        <NavLink
          to="/about"
          style={({ isActive }) => ({
            color: isActive ? "#0085FF" : "#666",
            textDecoration: "none",
            borderBottom: isActive
              ? "2px solid #0085FF"
              : "2px solid transparent",
            padding: "4px 0",
          })}
        >
          About
        </NavLink>
      </div>
    </nav>
  );
}

export default Navbar;