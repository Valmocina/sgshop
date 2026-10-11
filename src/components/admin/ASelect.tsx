import { C, A, font, af } from "@/lib/theme";

export function ASelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: "100%", background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 8, padding: "10px 12px", ...af(14, 400), color: A.text, outline: "none", cursor: "pointer" }}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

