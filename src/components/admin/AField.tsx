import { C, A, font, af } from "@/lib/theme";

export function AField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ ...af(12, 600, 0.5), color: A.textMuted, display: "block", marginBottom: 6, textTransform: "uppercase" }}>{label}</label>
      {children}
    </div>
  );
}

