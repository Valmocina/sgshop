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
        <div className="loading-saber-hilt">
          <span className="loading-saber-grip" />
          <span className="loading-saber-emitter" />
        </div>
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
          top: 0;
          width: 48px;
          height: 12px;
          border: 1px solid #aaa;
          border-radius: 7px 4px 4px 7px;
          background: linear-gradient(180deg, #f1f1f1 0%, #777 24%, #292929 48%, #555 72%, #c8c8c8 100%);
          box-shadow: 0 0 5px #aaa8, inset 0 0 3px #111;
          z-index: 1;
        }
        .loading-saber-grip {
          position: absolute;
          left: 7px;
          top: 2px;
          width: 25px;
          height: 6px;
          border-radius: 2px;
          background: repeating-linear-gradient(90deg, #242424 0 4px, #777 4px 5px, #353535 5px 8px);
          box-shadow: inset 0 1px 1px #aaa8, inset 0 -1px 1px #000;
        }
        .loading-saber-emitter {
          position: absolute;
          right: 3px;
          top: -1px;
          width: 12px;
          height: 12px;
          border: 1px solid #bbb;
          border-radius: 3px;
          background: linear-gradient(90deg, #333, #ddd 35%, #777 65%, #222);
          box-shadow: 0 0 3px #ddd8;
        }
        .loading-saber-blade {
          position: absolute;
          left: 44px;
          top: 4px;
          width: 0;
          height: 4px;
          border-radius: 4px;
          background: #fff0f0;
          box-shadow: 0 0 5px 2px #ff3030, 0 0 14px 5px #ff000099;
          animation: saber-extend 1.2s ease-out forwards;
        }
        @keyframes saber-extend {
          to { width: calc(100% - 44px); }
        }
      `}</style>
    </div>
  );
}