import { useState } from "react";
import { formatPeso, type OrderRow } from "./revenueTypes";

const BORDER = "#2A2A2A";
const CARD = "#202020";
const SURFACE = "#1A1A1A";
const TEXT = "#F0F0F0";
const TEXT_MUTED = "#666";
const GOLD = "#F5A623";
const GREEN = "#22c55e";
const RED = "#ef4444";
const YELLOW = "#eab308";

const thStyle: React.CSSProperties = {
  padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 11, fontWeight: 700,
  letterSpacing: 0.5, color: TEXT_MUTED, textTransform: "uppercase", textAlign: "left",
  borderBottom: `1px solid ${BORDER}`, whiteSpace: "nowrap",
};

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  paid: { color: GREEN, label: "Paid" },
  deposit_paid: { color: GOLD, label: "Deposit paid" },
  refunded: { color: YELLOW, label: "Refunded" },
  pending: { color: TEXT_MUTED, label: "Pending" },
  failed: { color: RED, label: "Failed" },
  cancelled: { color: RED, label: "Cancelled" },
};

export default function RecentTransactions({
  transactions,
  onClearAll,
  clearing,
}: {
  transactions: OrderRow[];
  onClearAll: () => Promise<void>;
  clearing: boolean;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmClear, setConfirmClear] = useState(false);

  const filtersActive = search.trim() !== "" || statusFilter !== "ALL";

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
  };

  const filtered = transactions.filter(t => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!t.id.toLowerCase().includes(q) && !t.customer_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Toolbar */}
      <div className="no-print" style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search order ID or customer..."
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "8px 12px", fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT, outline: "none", flex: "1 1 220px" }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 7, padding: "8px 10px", fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT, outline: "none", cursor: "pointer" }}>
          <option value="ALL">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="deposit_paid">Deposit paid</option>
          <option value="refunded">Refunded</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        {filtersActive && (
          <button onClick={resetFilters} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "8px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: "pointer" }}>
            Reset
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button onClick={() => setConfirmClear(true)} disabled={clearing || transactions.length === 0}
          style={{ background: `${RED}12`, border: `1px solid ${RED}44`, borderRadius: 7, padding: "8px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 600, color: RED, cursor: transactions.length === 0 ? "default" : "pointer", opacity: transactions.length === 0 ? 0.5 : 1 }}>
          {clearing ? "Clearing…" : "Clear All Data"}
        </button>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ background: CARD }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Date</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              <th style={thStyle}>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t, i) => {
              const st = STATUS_STYLE[t.status] || { color: TEXT_MUTED, label: t.status };
              return (
                <tr key={t.id} style={{ borderBottom: i === filtered.length - 1 ? "none" : `1px solid ${BORDER}` }}>
                  <td style={{ padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 12, color: TEXT_MUTED }}>{t.id.slice(0, 8)}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT }}>{t.customer_name}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 12, color: TEXT_MUTED }}>{new Date(t.created_at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</td>
                  <td style={{ padding: "10px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 13, fontWeight: 700, color: GOLD, textAlign: "right" }}>{formatPeso(t.total)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ fontFamily: "'Barlow', sans-serif", fontSize: 11, fontWeight: 700, color: st.color, background: `${st.color}18`, borderRadius: 4, padding: "3px 9px" }}>{st.label}</span>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "36px 0", textAlign: "center", fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT_MUTED }}>
                {transactions.length === 0 ? "No transactions in this period yet." : "No transactions match your filters."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Destructive confirm dialog */}
      {confirmClear && (
        <div className="no-print" style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 420, background: SURFACE, borderRadius: 14, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
            <div style={{ padding: "28px 28px 24px", textAlign: "center" }}>
              <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${RED}18`, border: `1.5px solid ${RED}44`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke={RED} strokeWidth={2.5} strokeLinecap="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6M14 11v6" /></svg>
              </div>
              <h3 style={{ fontFamily: "'Barlow', sans-serif", fontSize: 17, fontWeight: 700, color: TEXT, marginBottom: 8 }}>Clear All Revenue Data?</h3>
              <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT_MUTED, lineHeight: 1.6 }}>
                This permanently deletes <strong style={{ color: TEXT }}>every order record</strong> — including paid, pending, and refunded orders. This cannot be undone. Product listings are not affected.
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, padding: "0 20px 20px" }}>
              <button onClick={() => setConfirmClear(false)} style={{ flex: 1, padding: "11px 0", background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 8, fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 600, color: TEXT_MUTED, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={async () => { setConfirmClear(false); await onClearAll(); }} style={{ flex: 1, padding: "11px 0", background: RED, border: "none", borderRadius: 8, fontFamily: "'Barlow', sans-serif", fontSize: 14, fontWeight: 700, color: "#fff", cursor: "pointer", boxShadow: `0 3px 10px ${RED}44` }}>
                Delete Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
