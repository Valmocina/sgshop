import React, { useState } from "react";
import type { Product, Category, Condition, Franchise, Brand, Scale } from "@/types/store";
import { C, A, font, af } from "@/lib/theme";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { NavBar } from "@/components/shop/NavBar";
import { Sidebar } from "@/components/shop/Sidebar";
import { ProductCard } from "@/components/shop/ProductCard";
import { HomeLanding } from "@/components/shop/HomeLanding";
import { useWindowWidth } from "@/hooks/useWindowWidth";

export function ShopPage({ cartCount, onProductClick, onCartClick, onAccountClick, products, activeCategory, onCategoryChange }: {
  cartCount: number; onProductClick: (p: Product) => void; onCartClick: () => void; onAccountClick: () => void;
  products: Product[]; activeCategory: Category; onCategoryChange: (c: Category) => void;
}) {
  const setActiveCategory = onCategoryChange;
  const [showFilters, setShowFilters] = useState(false);
  const w = useWindowWidth();
  const isMobile = w < 768;

  const [searchQuery, setSearchQuery] = useState("");
  const [filterSearch, setFilterSearch] = useState("");
  const [newArrival, setNewArrival] = useState(false);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [scales, setScales] = useState<Scale[]>([]);
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  //filter products based on visibility and availability
  const visibleProducts = products.filter(p => !p.is_hidden && p.is_available !== false);
  const filtered = visibleProducts.filter((p) => {
    // Category Filtering
    if (activeCategory === "POPULAR") {
      if (!p.new && !p.is_featured) return false;
    } else if (activeCategory !== "HOME" && activeCategory !== "ALL") {
      if (p.category?.toUpperCase() !== activeCategory) return false;
    }

    if (newArrival && !p.new) return false;

    const q = (filterSearch || searchQuery).trim().toLowerCase();
    if (q && !p.name.toLowerCase().includes(q)) return false;

    if (conditions.length && !conditions.includes(p.condition)) return false;
    if (franchises.length && !franchises.includes(p.franchise)) return false;
    if (brands.length && !brands.includes(p.brand)) return false;
    if (scales.length && !scales.includes(p.scale)) return false;

    if (minPrice && p.price < Number(minPrice)) return false;
    if (maxPrice && p.price > Number(maxPrice)) return false;

    return true;
  });

  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", flexDirection: "column" }}>
      <ShopHeader cartCount={cartCount} onCartClick={onCartClick} onAccountClick={onAccountClick} searchQuery={searchQuery} onSearchChange={setSearchQuery} />
      <NavBar active={activeCategory} onChange={setActiveCategory} />

      {activeCategory === "HOME" ? (
        <HomeLanding onShopNow={() => setActiveCategory("ALL")} />
      ) : (
      <div style={{ flex: 1, display: "flex", gap: 16, padding: isMobile ? 10 : 16, alignItems: "flex-start", position: "relative" }}>
        {/* Mobile filter drawer overlay */}
        {isMobile && showFilters && (
          <div style={{ position: "fixed", inset: 0, zIndex: 200, display: "flex" }}>
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setShowFilters(false)} />
            <div style={{ position: "relative", zIndex: 1, width: "100vw", background: C.surface, height: "100%", overflowY: "auto", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px 0", flexShrink: 0 }}>
                <span style={{ ...font(15, 700, 1.5), color: C.text, textTransform: "uppercase" }}>Filters</span>
                <button onClick={() => setShowFilters(false)} style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, fontSize: 26, lineHeight: 1 }}>×</button>
              </div>
              {/* Force sidebar to fill full width on mobile */}
              <div style={{ flex: 1 }}>
                <Sidebar filterSearch={filterSearch} setFilterSearch={setFilterSearch} newArrival={newArrival} setNewArrival={setNewArrival} conditions={conditions} setConditions={setConditions} franchises={franchises} setFranchises={setFranchises} brands={brands} setBrands={setBrands} scales={scales} setScales={setScales} minPrice={minPrice} setMinPrice={setMinPrice} maxPrice={maxPrice} setMaxPrice={setMaxPrice}
                  onReset={() => { setConditions([]); setFranchises([]); setBrands([]); setScales([]); setMinPrice(""); setMaxPrice(""); setNewArrival(false); setFilterSearch(""); }} mobile />
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        {!isMobile && (
          <Sidebar filterSearch={filterSearch} setFilterSearch={setFilterSearch} newArrival={newArrival} setNewArrival={setNewArrival} conditions={conditions} setConditions={setConditions} franchises={franchises} setFranchises={setFranchises} brands={brands} setBrands={setBrands} scales={scales} setScales={setScales} minPrice={minPrice} setMinPrice={setMinPrice} maxPrice={maxPrice} setMaxPrice={setMaxPrice}
            onReset={() => { setConditions([]); setFranchises([]); setBrands([]); setScales([]); setMinPrice(""); setMaxPrice(""); setNewArrival(false); setFilterSearch(""); }} />
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ background: C.surface, borderRadius: 10, padding: "10px 14px", marginBottom: 14, display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${C.border}`, gap: 8 }}>
            <span style={{ ...font(13, 700, 1), color: C.text }}>{filtered.length} {filtered.length === 1 ? "item" : "items"}</span>
            {isMobile ? (
              <button onClick={() => setShowFilters(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: C.card, border: `1px solid ${C.borderLight}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", ...font(12, 700, 1), color: C.text }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1={4} y1={6} x2={20} y2={6}/><line x1={8} y1={12} x2={16} y2={12}/><line x1={11} y1={18} x2={13} y2={18}/></svg>
                FILTERS {(conditions.length + franchises.length + brands.length + scales.length + (newArrival ? 1 : 0)) > 0 ? `(${conditions.length + franchises.length + brands.length + scales.length + (newArrival ? 1 : 0)})` : ""}
              </button>
            ) : (
              <span style={{ ...font(12, 500, 0.5), color: C.textMuted }}>{activeCategory}</span>
            )}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(auto-fill, minmax(180px, 1fr))" : "repeat(auto-fill, minmax(340px, 1fr))", gap: isMobile ? 14 : 24 }}>
            {filtered.map((p) => <ProductCard key={p.id} product={p} onClick={() => onProductClick(p)} />)}
            {filtered.length === 0 && (
              <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "80px 0" }}>
                <p style={{ ...font(22, 700, 3), color: C.textDim }}>NO ITEMS FOUND</p>
                <p style={{ ...font(14, 400, 0), color: C.textDim, marginTop: 8, fontFamily: "'Barlow', sans-serif" }}>Try adjusting your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

// ─── Product Detail ───────────────────────────────────────────────────────────
