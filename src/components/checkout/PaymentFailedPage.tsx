import React, { useEffect, useMemo, useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { IconUser, IconLock, IconSearch, IconCart, IconArrowLeft, IconCheck } from "@/components/ui/Icons";
import { Logo } from "@/components/ui/Logo";
import { Btn } from "@/components/ui/Btn";
import { Input } from "@/components/ui/Input";

export function PaymentFailedPage({ onRetry, onBackToShop }: { onRetry: () => void; onBackToShop: () => void }) {
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", maxWidth: 440, padding: "0 24px" }}>
        <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#fee2e2", border: "2px solid #fca5a5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth={2.5} strokeLinecap="round"><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
        </div>
        <h1 style={{ ...font(38, 900, 4), color: C.text, textTransform: "uppercase", marginBottom: 12 }}>PAYMENT FAILED</h1>
        <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 15, color: C.textMuted, lineHeight: 1.6, marginBottom: 36 }}>
          Your payment was not completed. This may have been cancelled or declined by your e-wallet. No charge was made.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Btn onClick={onRetry} size="lg">Try Again</Btn>
          <Btn onClick={onBackToShop} variant="ghost" size="lg">Back to Shop</Btn>
        </div>
      </div>
    </div>
  );
}

// ─── Order Confirmed ──────────────────────────────────────────────────────────
