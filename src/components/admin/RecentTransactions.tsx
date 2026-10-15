import { useState } from "react";
import { formatPeso, type OrderRow } from "./revenueTypes";

const BORDER = "#2A2A2A";
const CARD = "#202020";
const TEXT = "#F0F0F0";
const TEXT_MUTED = "#666";
const GOLD = "#F5A623";
const GREEN = "#22c55e";
const RED = "#ef4444";
const YELLOW = "#eab308";
const BLUE = "#3b82f6";

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
  onArchive,
}: {
  transactions: OrderRow[];
  onArchive: (id: string, archived: boolean) => Promise<boolean>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const filtersActive = search.trim() !== "" || statusFilter !== "ALL" || showArchived;

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setShowArchived(false);
  };

  const filtered = transactions.filter(t => {
    if (!!t.archived_at !== showArchived) return false;
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      if (!t.id.toLowerCase().includes(q) && !t.customer_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });
  const printTransactions = () => {
    const clearPrintTarget = () => {
      delete document.body.dataset.adminPrint;
      window.removeEventListener("afterprint", clearPrintTarget);
    };
    document.body.dataset.adminPrint = "transactions";
    window.addEventListener("afterprint", clearPrintTarget);
    window.print();
  };

  return (
    <div className="recent-transactions-print-area">
      <h2 className="print-only" style={{ fontFamily: "'Barlow', sans-serif", fontSize: 20, color: "#111" }}>Recent Transactions{showArchived ? " — Archived" : ""}</h2>
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
        <button onClick={() => setShowArchived(value => !value)}
          style={{ background: showArchived ? `${BLUE}18` : "transparent", border: `1px solid ${showArchived ? `${BLUE}66` : BORDER}`, borderRadius: 7, padding: "8px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 600, color: showArchived ? BLUE : TEXT_MUTED, cursor: "pointer" }}>
          {showArchived ? "View Active" : "View Archived"}
        </button>
        <button onClick={printTransactions} disabled={filtered.length === 0}
          style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 7, padding: "8px 14px", fontFamily: "'Barlow', sans-serif", fontSize: 12, fontWeight: 600, color: TEXT_MUTED, cursor: filtered.length === 0 ? "default" : "pointer", opacity: filtered.length === 0 ? 0.5 : 1 }}>
          Print
        </button>
      </div>

      {/* Table */}
      <div className="recent-transactions-table" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 640 }}>
          <thead>
            <tr style={{ background: CARD }}>
              <th style={thStyle}>Order ID</th>
              <th style={thStyle}>Customer</th>
              <th style={thStyle}>Date</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Amount</th>
              <th style={thStyle}>Status</th>
              <th className="no-print" style={thStyle}>Action</th>
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
                  <td className="no-print" style={{ padding: "8px 14px" }}>
                    <button disabled={busyId === t.id} onClick={async () => {
                      setBusyId(t.id);
                      try { await onArchive(t.id, !showArchived); }
                      finally { setBusyId(null); }
                    }} style={{ background: "transparent", border: `1px solid ${BORDER}`, borderRadius: 6, padding: "5px 9px", color: showArchived ? BLUE : TEXT_MUTED, fontFamily: "'Barlow', sans-serif", fontSize: 11, fontWeight: 600, cursor: busyId === t.id ? "wait" : "pointer" }}>
                      {busyId === t.id ? "Saving…" : showArchived ? "Restore" : "Archive"}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "36px 0", textAlign: "center", fontFamily: "'Barlow', sans-serif", fontSize: 13, color: TEXT_MUTED }}>
                {transactions.length === 0 ? "No transactions in this period yet." : `No ${showArchived ? "archived" : "active"} transactions match your filters.`}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
