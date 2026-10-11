import { C } from "@/lib/theme";

// Define an actual value for logoSrc (replace with your logo path or URL if different)
const logoSrc = "/logo.png"; 

export function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <img
        src={logoSrc}
        alt="Sithguy Hobbyshop"
        style={{
          width: "min(420px, 80vw)",
          height: "auto",
          objectFit: "contain",
          animation: "logo-pulse 1.4s ease-in-out infinite",
          filter: "drop-shadow(0 0 32px rgba(245,166,35,0.6))",
          marginBottom: 40,
        }}
      />
      {/* Lightsaber progress bar */}
      <div style={{ width: "min(300px, 70vw)", height: 4, background: "#1a1a1a", borderRadius: 4, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 4,
          background: `linear-gradient(90deg, ${C.goldDark}, ${C.gold}, #fff8, ${C.gold})`,
          backgroundSize: "200% 100%",
          animation: "saber-sweep 1.2s linear infinite",
        }} />
      </div>
      <p style={{ marginTop: 16, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 4, color: "rgba(245,166,35,0.7)", textTransform: "uppercase" }}>
        Loading…
      </p>
      <style>{`
        @keyframes logo-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.85; transform: scale(0.97); }
        }
        @keyframes saber-sweep {
          0% { background-position: 200% 0; width: 30%; }
          50% { width: 80%; }
          100% { background-position: -200% 0; width: 30%; }
        }
      `}</style>
    </div>
  );
}