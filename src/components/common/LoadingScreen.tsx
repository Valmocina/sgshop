import logoSrc from "@/imports/SITHGUY HOBBYSHOP.png";

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
          filter: "drop-shadow(0 0 32px rgba(245,166,35,0.6))",
          marginBottom: 40,
        }}
      />
      <div className="loading-saber" aria-hidden="true">
        <div className="loading-saber-hilt" />
        <div className="loading-saber-blade" />
      </div>
      <p style={{ marginTop: 16, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 4, color: "rgba(245,166,35,0.7)", textTransform: "uppercase" }}>
        Loading…
      </p>
      <style>{`
        .loading-saber {
          position: relative;
          width: min(300px, 70vw);
          height: 12px;
        }
        .loading-saber-hilt {
          position: absolute;
          left: 0;
          top: 2px;
          width: 34px;
          height: 8px;
          border-radius: 3px;
          background: linear-gradient(#ddd, #777 45%, #bbb 55%, #555);
          box-shadow: 0 0 5px #aaa8;
        }
        .loading-saber-blade {
          position: absolute;
          left: 31px;
          top: 4px;
          width: 0;
          height: 4px;
          border-radius: 4px;
          background: #fff0f0;
          box-shadow: 0 0 5px 2px #ff3030, 0 0 14px 5px #ff000099;
          animation: saber-extend 1.2s ease-out forwards;
        }
        @keyframes saber-extend {
          to { width: calc(100% - 31px); }
        }
      `}</style>
    </div>
  );
}