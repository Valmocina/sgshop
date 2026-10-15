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
          width: 56px;
          height: 190px;
        }
        .loading-saber-hilt {
          position: absolute;
          left: 15px;
          bottom: 0;
          width: 26px;
          height: 38px;
          border: 1px solid #999;
          border-radius: 5px 5px 7px 7px;
          background: linear-gradient(90deg, #252525, #c7c7c7 18%, #555 38%, #bdbdbd 55%, #343434 78%, #999);
          box-shadow: 0 0 5px #aaa8, inset 0 0 3px #111;
          z-index: 1;
        }
        .loading-saber-grip {
          position: absolute;
          left: 3px;
          top: 8px;
          width: 18px;
          height: 20px;
          border-radius: 3px;
          background: repeating-linear-gradient(90deg, #242424 0 3px, #777 3px 4px, #353535 4px 6px);
          box-shadow: inset 0 1px 1px #aaa8, inset 0 -1px 1px #000;
        }
        .loading-saber-emitter {
          position: absolute;
          left: -5px;
          top: -4px;
          width: 34px;
          height: 8px;
          border: 1px solid #bbb;
          border-radius: 3px;
          background: linear-gradient(180deg, #eee, #555 45%, #aaa);
          box-shadow: 0 0 3px #ddd8;
        }
        .loading-saber-blade {
          position: absolute;
          left: 25px;
          bottom: 34px;
          width: 6px;
          height: 0;
          border-radius: 6px 6px 2px 2px;
          background: #fff0f0;
          box-shadow: 0 0 5px 2px #ff3030, 0 0 14px 5px #ff000099;
          animation: saber-extend 1.2s ease-out forwards;
        }
        @keyframes saber-extend {
          to { height: calc(100% - 34px); }
        }
      `}</style>
    </div>
  );
}