import React, { useState } from "react";
import type { Product } from "@/types/store";
import { isPreOrder } from "@/lib/preorder";
import { A, af } from "@/lib/theme";
import { supabase } from "@/lib/supabase"; // Fixes: Cannot find name 'supabase'
import { AField } from "@/components/admin/AField";
import { AInput } from "@/components/admin/AInput";
import { ASelect } from "@/components/admin/ASelect";
import { AToggle } from "@/components/admin/AToggle";

// Fixes: Cannot find name 'BLANK_FORM'
const BLANK_FORM = {
  name: "",
  description: "",
  category: "STARWARS" as const,
  franchise: "Star Wars" as const,
  brand: "Hot Toys" as const,
  scale: "1:6" as const,
  condition: "Brand New" as const,
  price: "",
  stock: "",
  image: "",
  is_available: true,
  is_featured: false,
  new: true,
  details: ["", "", ""],
  est_arrival: "",
  deposit_amount: "",
  sourcing_country: "",
};

export function ProductFormModal({ product, onSave, onSaveAndAddAnother, onCancel }: {
  product: Product | null;
  onSave: (data: Omit<Product, "id">) => void;
  onSaveAndAddAnother?: (data: Omit<Product, "id">) => void;
  onCancel: () => void;
}) {
  const blankForm = { ...BLANK_FORM, details: ["", "", ""] };
  const [form, setForm] = useState(product ? {
    name: product.name, description: product.description || "",
    category: product.category, franchise: product.franchise,
    brand: product.brand, scale: product.scale, condition: product.condition,
    price: String(product.price), stock: String(product.stock), image: product.image,
    is_available: product.is_available !== false,
    is_featured: product.is_featured || false,
    new: product.new,
    details: [...product.details, "", ""].slice(0, 3),
    est_arrival: product.est_arrival ?? "",
    deposit_amount: product.deposit_amount != null ? String(product.deposit_amount) : "",
    sourcing_country: product.sourcing_country ?? "",
  } : blankForm);

  // Lifesize figures are never stocked: the customer orders first, then the admin orders from the supplier.
  const preorder = isPreOrder({ scale: form.scale as Product["scale"] });

  const [imgPreview, setImgPreview] = useState(product?.image || "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState(false);

  const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }));

  // Upload image file directly to Supabase Storage
  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      setImgPreview(publicUrl);
      set("image", publicUrl);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      alert(`Image upload failed: ${err.message || 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0) e.price = "Valid price required";
    if (!preorder && (!form.stock || isNaN(Number(form.stock)) || Number(form.stock) < 0)) e.stock = "Valid stock required";
    if (preorder && form.deposit_amount !== "") {
      const dep = Number(form.deposit_amount);
      if (isNaN(dep) || dep <= 0) e.deposit_amount = "Enter a valid deposit, or leave blank for the 30% default";
      else if (dep > Number(form.price)) e.deposit_amount = "Deposit can't be more than the price";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildData = (): Omit<Product, "id"> => ({
    name: form.name.trim().toUpperCase(),
    description: form.description,
    category: form.category as any,
    franchise: form.franchise as any,
    brand: form.brand as any,
    scale: form.scale as any,
    condition: form.condition as any,
    price: Number(form.price),
    stock: preorder ? 0 : Number(form.stock),
    image: form.image || "https://images.unsplash.com/photo-1587502536263-aa47cd87e898?w=500&h=500&fit=crop&auto=format",
    is_available: form.is_available,
    is_featured: form.is_featured,
    is_hidden: false,
    new: form.new,
    details: form.details.filter(d => d.trim()),
    est_arrival: preorder ? form.est_arrival.trim() || null : null,
    deposit_amount: preorder && form.deposit_amount !== "" ? Number(form.deposit_amount) : null,
    sourcing_country: preorder ? form.sourcing_country.trim() || null : null,
  });

  const submit = () => {
    if (!validate()) return;
    onSave(buildData());
  };

  const submitAndAddAnother = () => {
    if (!validate()) return;
    onSaveAndAddAnother?.(buildData());
    setForm(blankForm);
    setImgPreview("");
    setErrors({});
  };

  const overlayStyle: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 };

  return (
    <div style={overlayStyle}>
      <div style={{ width: "100%", maxWidth: 700, background: A.surface, borderRadius: 16, border: `1px solid ${A.border}`, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${A.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: A.card }}>
          <h2 style={{ ...af(17, 700), color: A.text }}>{product ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onCancel} style={{ background: "none", border: "none", cursor: "pointer", color: A.textMuted, padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = A.text} onMouseLeave={e => e.currentTarget.style.color = A.textMuted}>
            <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1={18} y1={6} x2={6} y2={18}/><line x1={6} y1={6} x2={18} y2={18}/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", padding: "24px", flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
            {/* Left col */}
            <div>
              <AField label="Product Name">
                <AInput value={form.name} onChange={v => set("name", v)} placeholder="e.g. HOT TOYS: IRON MAN MK85" />
                {errors.name && <p style={{ ...af(11, 500), color: A.red, marginTop: 4 }}>{errors.name}</p>}
              </AField>
              <AField label="Description">
                <textarea value={form.description} onChange={e => set("description", e.target.value)}
                  placeholder="Short product description..."
                  style={{ width: "100%", background: A.card, border: `1.5px solid ${A.border}`, borderRadius: 8, padding: "10px 12px", ...af(14, 400), color: A.text, outline: "none", resize: "vertical", minHeight: 80 }} />
              </AField>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <AField label="Price (₱)">
                  <AInput value={form.price} onChange={v => set("price", v)} placeholder="25000" type="number" />
                  {errors.price && <p style={{ ...af(11, 500), color: A.red, marginTop: 4 }}>{errors.price}</p>}
                </AField>
                <AField label="Stock Qty">
                  {preorder ? (
                    <div style={{ background: A.card, border: `1.5px dashed ${A.border}`, borderRadius: 8, padding: "10px 12px", ...af(13, 500), color: A.textMuted }}>
                      Not stocked — pre-order
                    </div>
                  ) : (
                    <>
                      <AInput value={form.stock} onChange={v => set("stock", v)} placeholder="5" type="number" />
                      {errors.stock && <p style={{ ...af(11, 500), color: A.red, marginTop: 4 }}>{errors.stock}</p>}
                    </>
                  )}
                </AField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <AField label="Category">
                  <ASelect value={form.category} onChange={v => set("category", v)} options={["STARWARS", "MARVEL", "DC", "OTHERS", "POPULAR"]} />
                </AField>
                <AField label="Franchise">
                  <ASelect value={form.franchise} onChange={v => set("franchise", v)} options={["Star Wars", "Marvel", "DC", "Others"]} />
                </AField>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
                <AField label="Brand">
                  <ASelect value={form.brand} onChange={v => set("brand", v)} options={["Sideshow", "Hot Toys", "Queen Studios", "Hasbro", "Others"]} />
                </AField>
                <AField label="Scale">
                  <ASelect value={form.scale} onChange={v => set("scale", v)} options={["1:2", "1:3", "1:4", "1:6", "1:8", "1:16", "1:32", "Lifesize"]} />
                </AField>
              </div>
              {preorder && (
                <div style={{ background: `${A.gold}0d`, border: `1px solid ${A.gold}33`, borderRadius: 10, padding: "14px 14px 2px", marginBottom: 16 }}>
                  <p style={{ ...af(12, 700, 0.5), color: A.gold, textTransform: "uppercase", marginBottom: 4 }}>Pre-order details</p>
                  <p style={{ ...af(12, 400), color: A.textMuted, marginBottom: 14, lineHeight: 1.5 }}>
                    Lifesize items aren't kept in stock. Customers pre-order, then you place the order with your supplier from the Orders tab.
                  </p>
                  <AField label="Estimated arrival">
                    <AInput value={form.est_arrival} onChange={v => set("est_arrival", v)} placeholder="e.g. 8–12 weeks" />
                  </AField>
                  <AField label="Deposit per unit (₱) — optional">
                    <AInput value={form.deposit_amount} onChange={v => set("deposit_amount", v)} placeholder="Blank = 30% of price" type="number" />
                    {errors.deposit_amount && <p style={{ ...af(11, 500), color: A.red, marginTop: 4 }}>{errors.deposit_amount}</p>}
                  </AField>
                  <AField label="Sourcing country">
                    <AInput value={form.sourcing_country} onChange={v => set("sourcing_country", v)} placeholder="e.g. Japan" />
                  </AField>
                </div>
              )}
              <AField label="Condition">
                <ASelect value={form.condition} onChange={v => set("condition", v)} options={["Brand New", "Mint in Box", "Back in Box", "Loose No Box"]} />
              </AField>
              <AField label="Details (bullet points)">
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ marginBottom: 6 }}>
                    <AInput value={form.details[i]} onChange={v => { const d = [...form.details]; d[i] = v; set("details", d); }} placeholder={`Detail ${i + 1}`} />
                  </div>
                ))}
              </AField>
            </div>

            {/* Right col */}
            <div>
              <AField label="Product Image">
                <div style={{ border: `2px dashed ${A.border}`, borderRadius: 10, padding: 12, textAlign: "center", marginBottom: 10 }}>
                  {imgPreview ? (
                    <img src={imgPreview} alt="preview" style={{ width: "100%", height: 180, objectFit: "cover", borderRadius: 6, marginBottom: 8 }} />
                  ) : (
                    <div style={{ height: 180, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
                      <svg width={40} height={40} viewBox="0 0 24 24" fill="none" stroke={A.textMuted} strokeWidth={1.5}><rect x={3} y={3} width={18} height={18} rx={2}/><circle cx={8.5} cy={8.5} r={1.5}/><polyline points="21 15 16 10 5 21"/></svg>
                      <p style={{ ...af(12, 400), color: A.textMuted }}>No image selected</p>
                    </div>
                  )}

                  <label style={{ display: "inline-block", background: A.card, border: `1px solid ${A.border}`, borderRadius: 6, padding: "7px 16px", ...af(12, 600), color: A.text, cursor: uploading ? "wait" : "pointer", opacity: uploading ? 0.6 : 1 }}>
                    {uploading ? "Uploading..." : "Upload Image"}
                    <input type="file" accept="image/*" onChange={handleImageFile} disabled={uploading} style={{ display: "none" }} />
                  </label>
                </div>
                <p style={{ ...af(11, 400), color: A.textMuted, marginBottom: 6 }}>Or paste image URL:</p>
                <AInput value={form.image} onChange={v => { set("image", v); setImgPreview(v); }} placeholder="https://..." />
              </AField>

              <div style={{ background: A.card, borderRadius: 10, padding: "16px", border: `1px solid ${A.border}`, display: "flex", flexDirection: "column", gap: 14, marginTop: 8 }}>
                <p style={{ ...af(12, 600, 0.5), color: A.textMuted, textTransform: "uppercase", marginBottom: 2 }}>Product Flags</p>
                <AToggle label="Available for purchase" checked={form.is_available} onChange={() => set("is_available", !form.is_available)} />
                <AToggle label="Featured product" checked={form.is_featured} onChange={() => set("is_featured", !form.is_featured)} activeColor={A.gold} />
                <AToggle label="Mark as New Arrival" checked={form.new} onChange={() => set("new", !form.new)} activeColor={A.blue} />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${A.border}`, display: "flex", gap: 10, justifyContent: "flex-end", background: A.card }}>
          <button onClick={onCancel} disabled={uploading} style={{ padding: "10px 20px", background: "transparent", border: `1px solid ${A.border}`, borderRadius: 8, ...af(14, 600), color: A.textMuted, cursor: "pointer" }}>
            Cancel
          </button>
          {!product && (
            <button onClick={submitAndAddAnother} disabled={uploading} style={{ padding: "10px 20px", background: "transparent", border: `1.5px solid ${A.gold}`, borderRadius: 8, ...af(14, 700), color: A.gold, cursor: "pointer" }}>
              Save &amp; Add Another
            </button>
          )}
          <button onClick={submit} disabled={uploading} style={{ padding: "10px 28px", background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`, border: "none", borderRadius: 8, ...af(14, 700), color: "#111", cursor: "pointer", opacity: uploading ? 0.6 : 1 }}>
            {product ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}