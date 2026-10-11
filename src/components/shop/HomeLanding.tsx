import React from "react";
import { font, af } from "@/lib/theme";
import { Btn } from "@/components/ui/Btn";
import { useWindowWidth } from "@/hooks/useWindowWidth";
import logoSrc from "@/imports/SITHGUY HOBBYSHOP.png";

export function HomeLanding({ onShopNow }: { onShopNow: () => void }) {
  const w = useWindowWidth();
  const isMobile = w < 640;

  // Generate deterministic star positions
  const stars = Array.from({ length: 160 }, (_, i) => {
    const seed = (i * 7919 + 13) % 1000;
    const seed2 = (i * 6271 + 37) % 1000;
    const seed3 = (i * 4567 + 91) % 1000;
    const angle = (seed / 1000) * 360;
    const dist = 5 + (seed2 / 1000) * 45;
    const size = 0.5 + (seed3 / 1000) * 2.5;
    const duration = 1.5 + (seed2 / 1000) * 3;
    const delay = -(seed / 1000) * 4;
    const x = 50 + dist * Math.cos((angle * Math.PI) / 180);
    const y = 50 + dist * Math.sin((angle * Math.PI) / 180);
    return { x, y, size, duration, delay, angle };
  });

  return (
    <div style={{ position: "relative", width: "100%", flex: 1, background: "#000", overflow: "hidden", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "calc(100vh - 110px)" }}>
      {/* Starfield layer */}
      <div style={{ position: "absolute", inset: 0 }}>
        {stars.map((s, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.size,
              height: s.size,
              borderRadius: "50%",
              background: "#fff",
              opacity: 0,
              transform: "translate(-50%, -50%)",
              animation: `warp-star ${s.duration}s ${s.delay}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* Streak rays from center */}
      {Array.from({ length: 24 }, (_, i) => {
        const angle = (i / 24) * 360;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "2px",
              height: "0%",
              background: `linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.25), rgba(255,255,255,0))`,
              transformOrigin: "50% 0",
              transform: `rotate(${angle}deg)`,
              animation: `ray-pulse ${2.4 + (i % 5) * 0.4}s ${-(i * 0.1)}s ease-in-out infinite`,
              borderRadius: 2,
            }}
          />
        );
      })}

      {/* Radial glow from center */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 55% 45% at 50% 50%, rgba(245,166,35,0.08) 0%, rgba(245,166,35,0.03) 40%, transparent 70%)", pointerEvents: "none" }} />

      {/* HOME label */}
      <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)" }}>
        <span style={{ ...font(15, 700, 3), color: "rgba(255,255,255,0.85)", textTransform: "uppercase", letterSpacing: 6 }}>HOME</span>
      </div>

      {/* Center content */}
      <div style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", gap: 0 }}>
        {/* Hero logo */}
        <img
          src={logoSrc}
          alt="Sithguy Hobbyshop"
          style={{
            width: isMobile ? "80vw" : 520,
            maxWidth: "90vw",
            height: "auto",
            objectFit: "contain",
            marginBottom: 28,
            filter: "drop-shadow(0 0 40px rgba(245,166,35,0.5))",
          }}
        />

        <p style={{
          fontFamily: "'Barlow', sans-serif",
          fontSize: isMobile ? 14 : 17,
          fontWeight: 700,
          fontStyle: "italic",
          color: "rgba(255,255,255,0.9)",
          textAlign: "center",
          maxWidth: isMobile ? "90vw" : 540,
          lineHeight: 1.7,
          marginBottom: 28,
          textShadow: "0 2px 12px rgba(0,0,0,0.8)",
          padding: isMobile ? "0 12px" : 0,
        }}>
          Welcome to Sithguy Hobbyshop, your premier destination for<br />
          all things Star Wars, Marvel, DC, and other collectibles.<br />
          <span style={{ textDecoration: "underline" }}>Located in Mandaluyong City, Philippines</span>
        </p>

        {/* Social links */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 36, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { href: "https://www.tiktok.com/@sithguyhobbyshop", label: "tiktok.com", icon: (
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
              )},
              { href: "https://www.instagram.com/sithguyhobbyshop", label: "instagram.com", icon: (
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x={2} y={2} width={20} height={20} rx={5}/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1={17.5} y1={6.5} x2={17.51} y2={6.5}/></svg>
              )},
              { href: "https://www.youtube.com/@sithguyhobbyshop", label: "youtube.com", icon: (
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.5 12 3.5 12 3.5s-7.54 0-9.38.55A3.02 3.02 0 0 0 .5 6.19C0 8.04 0 12 0 12s0 3.96.5 5.81a3.02 3.02 0 0 0 2.12 2.14C4.46 20.5 12 20.5 12 20.5s7.54 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14C24 15.96 24 12 24 12s0-3.96-.5-5.81zM9.75 15.52V8.48L15.5 12l-5.75 3.52z"/></svg>
              )},
            ].map(({ href, label, icon }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 5, color: "#60a5fa", textDecoration: "none", transition: "opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                {icon}
                <span style={{ ...font(12, 600, 0.3), color: "#60a5fa" }}>{label}</span>
              </a>
            ))}
          </div>

          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { icon: (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.27h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.71 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6.18 6.18l.99-.99a2 2 0 0 1 2.11-.45c.9.35 1.85.58 2.81.71a2 2 0 0 1 1.72 2.01z"/></svg>
                ), label: "0945 206 3985", href: "tel:+639452063985" },
              { icon: (
                  <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.145 2 11.243c0 2.929 1.453 5.548 3.727 7.27V22l3.405-1.869c.909.252 1.871.388 2.868.388 5.523 0 10-4.145 10-9.276C22 6.145 17.523 2 12 2zm1.07 12.486l-2.549-2.72-4.97 2.72 5.467-5.802 2.612 2.72 4.906-2.72-5.467 5.802z"/></svg>
                ), label: "SithGuy Hobbyshop", href: "https://m.me/sithguyhobbyshop" },
            ].map(({ icon, label, href }) => (
              <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "opacity 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{icon}</span>
                <span style={{ ...font(12, 600, 0.3), color: "rgba(255,255,255,0.75)" }}>{label}</span>
              </a>
            ))}
          </div>

          <a href="https://www.facebook.com/sithguyhobbyshop" target="_blank" rel="noopener noreferrer"
            style={{ display: "flex", alignItems: "center", gap: 6, textDecoration: "none", transition: "opacity 0.15s" }}
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#1877f2", display: "flex", alignItems: "center", justifyContent: "center", ...font(13, 900, 0), color: "#fff", flexShrink: 0 }}>f</span>
            <span style={{ ...font(12, 600, 0.3), color: "#60a5fa" }}>facebook.com/sithguyhobbyshop</span>
          </a>
        </div>

        <Btn onClick={onShopNow} size="lg">Browse Collection →</Btn>
      </div>

      <style>{`
        @keyframes warp-star {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.2); }
          10%  { opacity: 0.9; }
          85%  { opacity: 0.5; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1) translate(var(--dx, 40px), var(--dy, 40px)); }
        }
        @keyframes ray-pulse {
          0%, 100% { height: 0%; opacity: 0; }
          30% { opacity: 1; }
          60% { height: 52%; opacity: 0.3; }
          100% { height: 60%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}