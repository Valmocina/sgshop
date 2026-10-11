import type { CSSProperties } from "react";

export const C = {
  gold: "#F5A623",
  goldDark: "#D4891A",
  bg: "#111111",
  surface: "#1C1C1C",
  surfaceHover: "#252525",
  card: "#242424",
  border: "#2E2E2E",
  borderLight: "#3A3A3A",
  text: "#F0F0F0",
  textMuted: "#888",
  textDim: "#555",
  lightBg: "#E8E8E8",
  lightCard: "#D8D8D8",
  lightBorder: "#C0C0C0",
};

export const font = (size: number, weight = 700, spacing = 0) => ({
  fontFamily: "'Barlow Condensed', sans-serif",
  fontSize: size, fontWeight: weight, letterSpacing: spacing,
} as CSSProperties);

export const A = {
  bg: "#0D0D0D",
  sidebar: "#141414",
  surface: "#1A1A1A",
  card: "#202020",
  border: "#2A2A2A",
  borderLight: "#333",
  text: "#F0F0F0",
  textMuted: "#666",
  gold: "#F5A623",
  goldDark: "#D4891A",
  green: "#22c55e",
  red: "#ef4444",
  blue: "#3b82f6",
  yellow: "#eab308",
};

export const af = (size: number, weight = 600, spacing = 0) => ({
  fontFamily: "'Barlow', sans-serif",
  fontSize: size,
  fontWeight: weight,
  letterSpacing: spacing,
} as CSSProperties);
