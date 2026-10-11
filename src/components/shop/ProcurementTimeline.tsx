import { C, font } from "@/lib/theme";
import { IconCheck } from "@/components/ui/Icons";
import { FULFILLMENT_STEPS } from "@/lib/preorder";
import { useWindowWidth } from "@/hooks/useWindowWidth";

/**
 * Shows the pre-order journey. With no `activeIndex` it's the "what to expect"
 * explainer on the product page; with one, it's a live progress tracker where
 * steps up to and including `activeIndex` are highlighted.
 */
export function ProcurementTimeline({ activeIndex, title = "How your pre-order works" }: {
  activeIndex?: number; title?: string;
}) {
  const isMobile = useWindowWidth() < 640;
  const tracking = activeIndex !== undefined;

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: isMobile ? "18px 16px" : "22px 26px" }}>
      <p style={{ ...font(12, 700, 2), color: C.textMuted, textTransform: "uppercase", marginBottom: 18 }}>{title}</p>
      <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: isMobile ? 16 : 14 }}>
        {FULFILLMENT_STEPS.map((step, i) => {
          const done = tracking && i <= activeIndex!;
          const current = tracking && i === activeIndex;
          return (
            <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: isMobile ? "row" : "column", gap: isMobile ? 12 : 8, alignItems: isMobile ? "flex-start" : "stretch", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: done ? C.gold : C.card, border: `1.5px solid ${done || current ? C.gold : C.borderLight}`,
                  boxShadow: current ? `0 0 0 4px ${C.gold}22` : "none",
                  ...font(13, 800, 0), color: done ? "#111" : C.textMuted,
                }}>
                  {done && !current ? <IconCheck s={14} c="#111" /> : i + 1}
                </span>
                {!isMobile && i < FULFILLMENT_STEPS.length - 1 && (
                  <span style={{ flex: 1, height: 2, background: tracking && i < activeIndex! ? C.gold : C.border, borderRadius: 2 }} />
                )}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ ...font(14, 700, 0.3), color: done ? C.text : C.textMuted, textTransform: "uppercase", lineHeight: 1.25, marginBottom: 4 }}>{step.customer}</p>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 12, color: C.textDim, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
