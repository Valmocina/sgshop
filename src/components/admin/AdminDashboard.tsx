import React, { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { isPreOrder } from "@/lib/preorder";
import { AdminOrdersPanel } from "@/components/admin/AdminOrdersPanel";
import type { Product, AdminTab } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { AdminSettingsPanel } from "@/components/admin/AdminSettingsPanel";
import { AdminProductRow } from "@/components/admin/AdminProductRow";
import { ProductFormModal } from "@/components/admin/ProductFormModal";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import RevenueOverview from "./RevenueOverview";


export function AdminDashboard({ products, onUpdate, onAdd, onDelete, onLogout, onViewStore, adminEmail, onChangeAdminPassword, paymongoPublicKey, onChangePaymongoKey }: {
  products: Product[];
  onUpdate: (id: number, changes: Partial<Product>) => void;
  onAdd: (data: Omit<Product, "id">) => void;
  onDelete: (id: number) => void;
  onLogout: () => void;
  onViewStore?: () => void;
  adminEmail: string;
  onChangeAdminPassword: (oldPass: string, newPass: string) => Promise<{ ok: boolean; error?: string }>;
  paymongoPublicKey: string;
  onChangePaymongoKey: (k: string) => void;
}) {
  const [tab, setTab] = useState<AdminTab>("products");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [availFilter, setAvailFilter] = useState("ALL");
  const [editProduct, setEditProduct] = useState<Product | null | "new">(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // How many paid pre-orders are still waiting for the admin to order them from the supplier.
  const [needsSupplierOrder, setNeedsSupplierOrder] = useState(0);
  const refreshOrderCount = useCallback(async () => {
    const { count } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("order_type", "preorder")
      .eq("fulfillment_status", "awaiting_order")
      .is("archived_at", null)
      .in("status", ["paid", "deposit_paid"]);
    setNeedsSupplierOrder(count ?? 0);
  }, []);
  useEffect(() => { refreshOrderCount(); }, [refreshOrderCount, tab]);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const archiveAllOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .update({ archived_at: new Date().toISOString() })
        .is("archived_at", null)
        .select("id");
      if (error) throw error;
      showToast(`${data?.length ?? 0} order${data?.length === 1 ? "" : "s"} archived.`);
      await refreshOrderCount();
      return true;
    } catch (error) {
      showToast(`Could not archive orders: ${error instanceof Error ? error.message : "Unexpected error."}`, "error");
      return false;
    }
  };

  const filtered = products.filter(p => {
    if (catFilter !== "ALL" && p.category !== catFilter) return false;
    if (availFilter === "AVAILABLE" && p.is_available === false) return false;
    if (availFilter === "UNAVAILABLE" && p.is_available !== false) return false;
    if (availFilter === "HIDDEN" && !p.is_hidden) return false;
    if (availFilter === "FEATURED" && !p.is_featured) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: products.length,
    available: products.filter(p => p.is_available !== false && !p.is_hidden).length,
    hidden: products.filter(p => p.is_hidden).length,
    featured: products.filter(p => p.is_featured).length,
    lowStock: products.filter(p => !isPreOrder(p) && p.stock <= 2).length,
    totalValue: products.reduce((s, p) => s + p.price * p.stock, 0),
  };

  const selStyle = { background: A.card, border: `1px solid ${A.border}`, borderRadius: 7, padding: "8px 10px", ...af(13, 500), color: A.text, outline: "none", cursor: "pointer" };
  const thStyle: React.CSSProperties = { padding: "10px 14px", ...af(11, 700, 0.5), color: A.textMuted, textTransform: "uppercase", textAlign: "left", borderBottom: `1px solid ${A.border}`, whiteSpace: "nowrap" };

  return (
    <div style={{ minHeight: "100vh", background: A.bg, display: "flex" }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: A.sidebar, borderRight: `1px solid ${A.border}`, display: "flex", flexDirection: "column", position: "sticky", top: 0, height: "100vh" }}>
        <div style={{ padding: "22px 18px 18px", borderBottom: `1px solid ${A.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2.5}><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            </div>
            <div>
              <p style={{ ...af(13, 700), color: A.text, lineHeight: 1 }}>Admin CMS</p>
              <p style={{ ...af(11, 400), color: A.textMuted, lineHeight: 1.4 }}>Sithguy Hobbyshop</p>
            </div>
          </div>
        </div>

        <nav style={{ padding: "14px 10px", flex: 1 }}>
            {([["products", "Products", <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x={2} y={7} width={20} height={14} rx={2}/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>],
              ["orders", "Orders", <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1={3} y1={6} x2={21} y2={6}/><path d="M16 10a4 4 0 0 1-8 0"/></svg>],
              ["stats", "Overview", <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1={18} y1={20} x2={18} y2={10}/><line x1={12} y1={20} x2={12} y2={4}/><line x1={6} y1={20} x2={6} y2={14}/></svg>],
              ["revenue", "Revenue", <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 3v18h18"/><path d="M18.7 8l-5.1 5.1-2.5-2.5L7 14.7"/></svg>],
              ["settings", "Settings", <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx={12} cy={12} r={3}/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>],
           ] as [AdminTab, string, React.ReactNode][]).map(([id, label, icon]) => (
              <button key={id} onClick={() => setTab(id)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: tab === id ? `${A.gold}18` : "transparent", border: "none", cursor: "pointer", marginBottom: 2, color: tab === id ? A.gold : A.textMuted, transition: "all 0.15s" }}
                onMouseEnter={e => { if (tab !== id) e.currentTarget.style.background = `${A.border}`; }}
                onMouseLeave={e => { if (tab !== id) e.currentTarget.style.background = "transparent"; }}>
                {icon}
              <span style={{ ...af(14, tab === id ? 700 : 500), color: tab === id ? A.gold : A.textMuted }}>{label}</span>
              {id === "orders" && needsSupplierOrder > 0 && (
                <span style={{ marginLeft: "auto", minWidth: 20, height: 20, borderRadius: 10, background: A.gold, color: "#111", ...af(11, 800), display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px" }}>{needsSupplierOrder}</span>
              )}
            </button>
          ))}
        </nav>

        <div style={{ padding: "14px 10px", borderTop: `1px solid ${A.border}` }}>
          <button onClick={onViewStore} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: A.textMuted, marginBottom: 4 }}
            onMouseEnter={e => e.currentTarget.style.background = A.border} onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
            <span style={{ ...af(13, 500), color: A.textMuted }}>View Store</span>
          </button>
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer", color: A.textMuted }}
            onMouseEnter={e => { e.currentTarget.style.background = `${A.red}18`; e.currentTarget.style.color = A.red; }}
            onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = A.textMuted; }}>
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1={21} y1={12} x2={9} y2={12}/></svg>
            <span style={{ ...af(13, 500) }}>Log Out</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, overflow: "auto" }}>
        {tab === "settings" ? (
          /* ── Settings tab ── */
          <AdminSettingsPanel
            adminEmail={adminEmail}
            onChangeAdminPassword={onChangeAdminPassword}
            paymongoPublicKey={paymongoPublicKey}
            onChangePaymongoKey={onChangePaymongoKey}
            onArchiveAllOrders={archiveAllOrders}
            showToast={showToast}
          />
        ) : tab === "orders" ? (
          /* ── Orders tab ── */
          <AdminOrdersPanel showToast={showToast} onChanged={refreshOrderCount} />
        ) : tab === "revenue" ? (
          /* ── Revenue tab ── */
          <RevenueOverview />
        ) : tab === "stats" ? (
          /* ── Overview tab ── */
          <div style={{ padding: "28px 28px" }}>
            <h1 style={{ ...af(22, 700), color: A.text, marginBottom: 24 }}>Overview</h1>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
              {[
                { label: "Total Products", value: stats.total, color: A.blue },
                { label: "Visible to Customers", value: stats.available, color: A.green },
                { label: "Hidden Products", value: stats.hidden, color: A.textMuted },
                { label: "Featured", value: stats.featured, color: A.gold },
                { label: "Low Stock (≤2)", value: stats.lowStock, color: A.red },
                { label: "Inventory Value", value: `₱${stats.totalValue.toLocaleString()}`, color: A.gold, small: true },
              ].map(({ label, value, color, small }) => (
                <div key={label} style={{ background: A.surface, borderRadius: 12, padding: "18px 20px", border: `1px solid ${A.border}` }}>
                  <p style={{ ...af(12, 600, 0.5), color: A.textMuted, textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
                  <p style={{ ...af(small ? 20 : 28, 700), color }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ background: A.surface, borderRadius: 12, border: `1px solid ${A.border}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${A.border}` }}>
                <p style={{ ...af(14, 700), color: A.text }}>Low Stock Alert</p>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr style={{ background: A.card }}>
                  <th style={thStyle}>Product</th><th style={thStyle}>Category</th>
                  <th style={thStyle}>Price</th><th style={{ ...thStyle, color: A.red }}>Stock</th>
                </tr></thead>
                <tbody>
                  {products.filter(p => !isPreOrder(p) && p.stock <= 3).map(p => (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${A.border}` }}>
                      <td style={{ padding: "10px 14px", ...af(13, 500), color: A.text }}>{p.name}</td>
                      <td style={{ padding: "10px 14px", ...af(12, 400), color: A.textMuted }}>{p.category}</td>
                      <td style={{ padding: "10px 14px", ...af(13, 700), color: A.gold }}>₱{p.price.toLocaleString()}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ ...af(12, 700), color: p.stock === 0 ? A.red : A.yellow, background: p.stock === 0 ? `${A.red}18` : `${A.yellow}18`, borderRadius: 4, padding: "2px 8px" }}>{p.stock} left</span>
                      </td>
                    </tr>
                  ))}
                  {products.filter(p => !isPreOrder(p) && p.stock <= 3).length === 0 && (
                    <tr><td colSpan={4} style={{ padding: "20px", textAlign: "center", ...af(13, 400), color: A.textMuted }}>All products have healthy stock levels</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* ── Products tab ── */
          <div style={{ padding: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
              <div>
                <h1 style={{ ...af(22, 700), color: A.text, marginBottom: 2 }}>Products</h1>
                <p style={{ ...af(13, 400), color: A.textMuted }}>{filtered.length} of {products.length} products</p>
              </div>
              <button onClick={() => setEditProduct("new")} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 18px", background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, border: "none", borderRadius: 8, ...af(14, 700), color: "#111", cursor: "pointer", boxShadow: `0 3px 12px ${A.gold}44` }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth={2.5}><line x1={12} y1={5} x2={12} y2={19}/><line x1={5} y1={12} x2={19} y2={12}/></svg>
                Add Product
              </button>
            </div>

            {/* Filters */}
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <div style={{ position: "relative", flex: "1 1 220px" }}>
                <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", opacity: 0.4 }}>
                  <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke={A.text} strokeWidth={2.5}><circle cx={11} cy={11} r={8}/><line x1={21} y1={21} x2={16.65} y2={16.65}/></svg>
                </span>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
                  style={{ ...selStyle, paddingLeft: 32, width: "100%" }} />
              </div>
              <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={selStyle}>
                {["ALL", "STARWARS", "MARVEL", "DC", "OTHERS"].map(c => <option key={c} value={c}>{c === "ALL" ? "All Categories" : c}</option>)}
              </select>
              <select value={availFilter} onChange={e => setAvailFilter(e.target.value)} style={selStyle}>
                {[["ALL", "All Status"], ["AVAILABLE", "Available"], ["UNAVAILABLE", "Unavailable"], ["HIDDEN", "Hidden"], ["FEATURED", "Featured"]].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            {/* Table */}
            <div style={{ background: A.surface, borderRadius: 12, border: `1px solid ${A.border}`, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
                  <thead>
                    <tr style={{ background: A.card }}>
                      <th style={thStyle}>Product</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Price</th>
                      <th style={thStyle}>Stock</th>
                      <th style={thStyle}>Status</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((p, i) => (
                      <AdminProductRow key={p.id} product={p} isLast={i === filtered.length - 1}
                        onEdit={() => setEditProduct(p)}
                        onDelete={() => setDeleteTarget(p)}
                        onToggleHide={() => { onUpdate(p.id, { is_hidden: !p.is_hidden }); showToast(p.is_hidden ? `"${p.name}" is now visible` : `"${p.name}" hidden from store`); }}
                        onToggleAvail={() => { onUpdate(p.id, { is_available: !p.is_available }); showToast(`Availability updated`); }}
                        onToggleFeatured={() => { onUpdate(p.id, { is_featured: !p.is_featured }); showToast(`Featured status updated`); }}
                      />
                    ))}
                    {filtered.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: "48px 0", textAlign: "center", ...af(14, 400), color: A.textMuted }}>No products match your filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {editProduct !== null && (
        <ProductFormModal
          product={editProduct === "new" ? null : editProduct}
          onCancel={() => setEditProduct(null)}
          onSave={(data) => {
            if (editProduct === "new") { onAdd(data); showToast("Product added successfully!"); }
            else { onUpdate((editProduct as Product).id, data); showToast("Product updated!"); }
            setEditProduct(null);
          }}
          onSaveAndAddAnother={(data) => {
            onAdd(data);
            showToast("Product added — add another below.");
          }}
        />
      )}
      {deleteTarget && (
        <DeleteConfirm product={deleteTarget} onCancel={() => setDeleteTarget(null)}
          onConfirm={() => { onDelete(deleteTarget.id); showToast(`"${deleteTarget.name}" deleted`, "error"); setDeleteTarget(null); }} />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: toast.type === "success" ? A.green : A.red, color: "#fff", borderRadius: 10, padding: "12px 20px", ...af(14, 600), boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 400, display: "flex", alignItems: "center", gap: 10 }}>
          {toast.type === "success" ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><polyline points="20 6 9 17 4 12"/></svg> : <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3}><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
