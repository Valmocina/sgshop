import logoSrc from "@/imports/SITHGUY HOBBYSHOP.png";
import hiltSrc from "@/imports/lightsaber-hilt.png";

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
      <div className="loading-saber-frame" aria-hidden="true">
        <div className="loading-saber">
          <img className="loading-saber-hilt" src={hiltSrc} alt="" />
          <div className="loading-saber-blade" />
        </div>
      </div>
      <p style={{ marginTop: 16, fontFamily: "'Barlow Condensed', sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: 4, color: "rgba(245,166,35,0.7)", textTransform: "uppercase" }}>
        Loading…
      </p>
      <style>{`
        .loading-saber-frame {
          position: relative;
          width: min(850px, 92vw);
          height: 48px;
        }
        .loading-saber {
          position: relative;
          width: 100%;
          height: 100%;
        }
        .loading-saber-hilt {
          position: absolute;
          left: 48px;
          top: -30px;
          width: 27px;
          height: auto;
          transform: rotate(90deg);
          z-index: 1;
          display: block;
        }
        .loading-saber-blade {
          position: absolute;
          left: 102px;
          top: 20px;
          width: 0;
          height: 8px;
          border-radius: 6px 6px 2px 2px;
          background: #fff0f0;
          box-shadow: 0 0 6px 3px #ff3030, 0 0 16px 6px #ff000099;
          animation: saber-extend 1.2s ease-out forwards;
        }
        @keyframes saber-extend {
          to { width: calc(100% - 102px); }
        }
      `}</style>
    </div>
  );
}