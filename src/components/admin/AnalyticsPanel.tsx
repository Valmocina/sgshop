import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { A, af } from "@/lib/theme";
import { serializeSasXlsx } from "@/lib/analyticsXlsx";
import {
  DATASET_HEADERS,
  SAS_RESULT_HEADERS,
  duplicateRowIndices,
  isValidDate,
  parseDatasetCsv,
  parseSasResultsCsv,
  qualityForRow,
  serializeCsv,
  type AnalyticsRow,
  type SasResult,
} from "@/lib/analyticsCsv";

type OrderItem = {
  product_name: string;
  category: string;
  unit_price: number;
  unit_cost: number | null;
  quantity: number;
};
type Order = {
  status: string;
  payment_method: string | null;
  customer_region: string | null;
  created_at: string;
  order_items: OrderItem[];
};

const STATUSES = ["pending", "paid", "deposit_paid", "failed", "cancelled", "refunded"];
const cardStyle: React.CSSProperties = {
  background: A.surface,
  border: `1px solid ${A.border}`,
  borderRadius: 12,
  padding: 18,
};
const inputStyle: React.CSSProperties = {
  background: A.card,
  border: `1px solid ${A.border}`,
  borderRadius: 7,
  padding: "8px 10px",
  ...af(13, 400),
  color: A.text,
  outline: "none",
};

function downloadCsv(filename: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadXlsx(filename: string, rows: AnalyticsRow[]) {
  const url = URL.createObjectURL(new Blob([serializeSasXlsx(rows)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function printableReport() {
  const clear = () => {
    delete document.body.dataset.adminPrint;
    window.removeEventListener("afterprint", clear);
  };
  document.body.dataset.adminPrint = "analytics";
  window.addEventListener("afterprint", clear);
  window.print();
}

function asRows(orders: Order[]): AnalyticsRow[] {
  return orders.flatMap((order, index) => {
    const ref = `ORDER-${String(index + 1).padStart(4, "0")}`;
    return (order.order_items ?? []).map((item) => ({
      order_ref: ref,
      order_date: order.created_at,
      status: order.status,
      product_name: item.product_name ?? "",
      category: item.category ?? "",
      unit_price: Number(item.unit_price),
      unit_cost: item.unit_cost == null ? null : Number(item.unit_cost),
      quantity: Number(item.quantity),
      payment_method: order.payment_method ?? "",
      region: order.customer_region ?? "",
    }));
  });
}

function lineSales(row: AnalyticsRow) {
  return (row.unit_price ?? 0) * (row.quantity ?? 0);
}

function dateKey(value: string) {
  const isoDate = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/)?.[1];
  if (isoDate) return isValidDate(isoDate) ? isoDate : "";
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime())
    ? `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}-${String(parsed.getDate()).padStart(2, "0")}`
    : "";
}

function percentage(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(1000, Math.max(-100, parsed)) : 0;
}

export function AnalyticsPanel() {
  const [rows, setRows] = useState<AnalyticsRow[]>([]);
  const [source, setSource] = useState("Store orders");
  const [sasResults, setSasResults] = useState<SasResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [qualityFilter, setQualityFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [priceChange, setPriceChange] = useState("0");
  const [costChange, setCostChange] = useState("0");
  const [quantityChange, setQuantityChange] = useState("0");

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const fetched: Order[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error: queryError } = await supabase
          .from("orders")
          .select("status, payment_method, customer_region, created_at, order_items(product_name, category, unit_price, unit_cost, quantity)")
          .order("created_at", { ascending: true })
          .range(offset, offset + 999);
        if (queryError) throw queryError;
        const page = (data ?? []) as unknown as Order[];
        fetched.push(...page);
        if (page.length < 1000) break;
      }
      setRows(asRows(fetched));
      setSource("Store orders");
      setNotice("");
    } catch (loadError) {
      console.error("Could not load analytics orders:", loadError);
      setError(loadError instanceof Error ? loadError.message : "Could not load order data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, []);

  const annotated = useMemo(() => rows.map((row, index) => {
    return { row, index, issues: qualityForRow(row) };
  }), [rows]);

  const duplicateIndices = useMemo(() => duplicateRowIndices(rows), [rows]);
  const assessed = useMemo(() => annotated.map((entry) => ({
    ...entry,
    issues: duplicateIndices.has(entry.index) ? [...entry.issues, "duplicate"] : entry.issues,
  })), [annotated, duplicateIndices]);

  const filtered = useMemo(() => assessed.filter(({ row, issues }) => {
    const query = search.trim().toLowerCase();
    if (query && !`${row.order_ref} ${row.product_name} ${row.category} ${row.region}`.toLowerCase().includes(query)) return false;
    if (statusFilter !== "all" && row.status !== statusFilter) return false;
    const date = dateKey(row.order_date);
    if (startDate && (!date || date < startDate)) return false;
    if (endDate && (!date || date > endDate)) return false;
    if (qualityFilter === "issues" && !issues.length) return false;
    if (qualityFilter === "valid" && issues.length) return false;
    return true;
  }), [assessed, search, statusFilter, startDate, endDate, qualityFilter]);

  const quality = useMemo(() => ({
    missing: assessed.filter(({ issues }) => issues.some((issue) => issue.startsWith("missing:"))).length,
    invalid: assessed.filter(({ issues }) => issues.some((issue) => issue.startsWith("invalid:"))).length,
    duplicates: duplicateIndices.size,
  }), [assessed, duplicateIndices]);

  const metrics = useMemo(() => {
    const salesRows = filtered
      .filter(({ row, issues }) => !issues.includes("duplicate")
        && !issues.some((issue) => issue.startsWith("invalid:"))
        && !issues.some((issue) => ["order_ref", "order_date", "status", "product_name", "unit_price", "quantity"].some((field) => issue === `missing:${field}`)))
      .map(({ row }) => row)
      .filter((row) => row.status === "paid"
        && row.unit_price != null && Number.isFinite(row.unit_price)
        && row.quantity != null && Number.isInteger(row.quantity) && row.quantity > 0);
    const revenue = salesRows.reduce((sum, row) => sum + lineSales(row), 0);
    const costedRows = salesRows.filter((row) => row.unit_cost != null && Number.isFinite(row.unit_cost) && row.unit_cost >= 0);
    const cost = costedRows.reduce((sum, row) => sum + (row.unit_cost ?? 0) * (row.quantity ?? 0), 0);
    const quantity = salesRows.reduce((sum, row) => sum + (row.quantity ?? 0), 0);
    const byMonth = new Map<string, number>();
    const byProduct = new Map<string, number>();
    for (const row of salesRows) {
      const month = dateKey(row.order_date).slice(0, 7);
      byMonth.set(month, (byMonth.get(month) ?? 0) + lineSales(row));
      byProduct.set(row.product_name, (byProduct.get(row.product_name) ?? 0) + (row.quantity ?? 0));
    }
    return {
      revenue,
      costedRevenue: costedRows.reduce((sum, row) => sum + lineSales(row), 0),
      cost,
      profit: costedRows.reduce((sum, row) => sum + lineSales(row) - (row.unit_cost ?? 0) * (row.quantity ?? 0), 0),
      quantity,
      costedRows: costedRows.length,
      salesRows: salesRows.length,
      months: Array.from(byMonth.entries()).sort(([a], [b]) => a.localeCompare(b)),
      topProducts: Array.from(byProduct.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [filtered]);

  const projectedRevenue = metrics.revenue
    * (1 + percentage(priceChange) / 100)
    * (1 + percentage(quantityChange) / 100);
  const projectedKnownProfit = metrics.costedRevenue
    * (1 + percentage(priceChange) / 100)
    * (1 + percentage(quantityChange) / 100)
    - metrics.cost
    * (1 + percentage(costChange) / 100)
    * (1 + percentage(quantityChange) / 100);

  const importDataset = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setNotice("");
    try {
      const imported = parseDatasetCsv(await file.text());
      setRows(imported);
      setSource(`Uploaded: ${file.name}`);
      setNotice(`Loaded ${imported.length} rows for this session. Uploaded rows are analytics-only and were not saved to Supabase.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not read the dataset CSV.");
    }
  };

  const importSasResults = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    try {
      const imported = parseSasResultsCsv(await file.text());
      setSasResults(imported);
      setNotice(`Loaded ${imported.length} SAS result rows for this session.`);
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "Could not read the SAS results CSV.");
    }
  };

  const exportRows = () => downloadXlsx(
    `sithguy-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`,
    filtered.map(({ row }) => row),
  );
  const exportSasResults = () => downloadCsv("sas-results.csv", serializeCsv(
    SAS_RESULT_HEADERS,
    sasResults.map((result) => [
      result.period,
      result.metric,
      result.actual,
      result.forecast,
      result.lower_bound,
      result.upper_bound,
    ]),
  ));
  const downloadTemplate = (headers: string[], filename: string) => downloadCsv(filename, serializeCsv(headers, []));

  const tableRows = filtered.slice(0, 100);
  const maxMonthRevenue = Math.max(1, ...metrics.months.map(([, revenue]) => revenue));
  const sasChart = useMemo(() => {
    const metric = sasResults[0]?.metric;
    const points = metric ? sasResults.filter((result) => result.metric === metric).slice(-12) : [];
    const maxValue = Math.max(1, ...points.flatMap((point) => [Math.abs(point.actual ?? 0), Math.abs(point.forecast ?? 0)]));
    return { metric, points, maxValue };
  }, [sasResults]);
  const recommendations = [
    rows.length < 100 ? "Add more real records to reach the 100-row analysis target; this dashboard does not invent sales." : "",
    quality.missing ? `Complete missing cost, region, and payment fields on ${quality.missing} row(s) to improve analysis.` : "",
    metrics.topProducts[0] ? `Review stock for ${metrics.topProducts[0][0]}, the top seller in the current selection.` : "",
    metrics.salesRows > 0 && metrics.costedRows < metrics.salesRows ? "Record unit cost for more products before relying on profit totals." : "",
  ].filter(Boolean);

  const buttonStyle: React.CSSProperties = {
    ...af(12, 700),
    color: "#111",
    background: `linear-gradient(135deg, ${A.gold}, ${A.goldDark})`,
    border: 0,
    borderRadius: 7,
    padding: "9px 13px",
    cursor: "pointer",
  };
  const outlineButton: React.CSSProperties = {
    ...af(12, 600),
    color: A.text,
    background: A.card,
    border: `1px solid ${A.border}`,
    borderRadius: 7,
    padding: "9px 13px",
    cursor: "pointer",
  };

  return (
    <div className="analytics-print-area admin-content-padding" style={{ padding: 28, color: A.text }}>
      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
        <div>
          <h1 style={{ ...af(22, 700), marginBottom: 4 }}>SAS Analytics</h1>
          <p style={{ ...af(13, 400), color: A.textMuted }}>Export sales data as an Excel workbook for SAS, then import your results.</p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button style={outlineButton} onClick={() => void loadOrders()} disabled={loading}>{loading ? "Loading..." : "Reload store orders"}</button>
          <button style={outlineButton} onClick={() => downloadTemplate(DATASET_HEADERS, "sithguy-dataset-template.csv")}>Dataset template</button>
          <button style={buttonStyle} onClick={exportRows} disabled={!filtered.length}>Export filtered XLSX</button>
          <button style={outlineButton} onClick={printableReport}>Print / Save report</button>
        </div>
      </div>

      <p className="print-only" style={{ ...af(13, 500), marginBottom: 14 }}>Dataset: {source} · Generated {new Date().toLocaleString()}</p>
      {error && <p role="alert" style={{ ...af(13, 500), color: A.red, background: `${A.red}18`, padding: 12, borderRadius: 8, marginBottom: 14 }}>{error}</p>}
      {notice && <p style={{ ...af(13, 500), color: A.green, background: `${A.green}18`, padding: 12, borderRadius: 8, marginBottom: 14 }}>{notice}</p>}

      <div className="no-print" style={{ ...cardStyle, marginBottom: 16 }}>
        <p style={{ ...af(12, 700), color: A.textMuted, textTransform: "uppercase", marginBottom: 10 }}>Dataset · {source}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ ...outlineButton, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
            Import dataset CSV
            <input type="file" accept=".csv,text/csv" onChange={importDataset} style={{ display: "none" }} />
          </label>
          <span style={{ ...af(12, 400), color: A.textMuted }}>Excel: Save As → CSV UTF-8; use plain numbers without currency symbols. Upload replaces this view only.</span>
          <span style={{ ...af(12, 700), color: rows.length >= 100 ? A.green : A.yellow, marginLeft: "auto" }}>
            {rows.length} / 100 records{rows.length >= 100 ? " · target met" : " · target not met"}
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 16 }}>
          {[
            ["Rows with missing values", quality.missing, A.yellow],
            ["Rows with invalid values", quality.invalid, A.red],
            ["Duplicate rows", quality.duplicates, A.yellow],
          ].map(([label, count, color]) => (
            <div key={String(label)} style={{ background: A.card, borderRadius: 8, padding: 12 }}>
              <p style={{ ...af(11, 600), color: A.textMuted }}>{label}</p>
              <p style={{ ...af(20, 700), color: String(color) }}>{count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="no-print" style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <p style={{ ...af(14, 700), marginBottom: 3 }}>Filter and preview</p>
            <p style={{ ...af(12, 400), color: A.textMuted }}>Showing {filtered.length} of {rows.length} rows; preview is limited to 100.</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input aria-label="Search dataset" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, category, region..." style={inputStyle} />
            <select aria-label="Filter by status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} style={inputStyle}>
              <option value="all">All statuses</option>
              {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <select aria-label="Filter by data quality" value={qualityFilter} onChange={(event) => setQualityFilter(event.target.value)} style={inputStyle}>
              <option value="all">All rows</option>
              <option value="issues">Rows with issues</option>
              <option value="valid">Rows without issues</option>
            </select>
            <input aria-label="Start date" type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} style={inputStyle} />
            <input aria-label="End date" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} style={inputStyle} />
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1050 }}>
            <thead><tr style={{ textAlign: "left", color: A.textMuted }}>
              {["Order ref", "Date", "Status", "Product", "Price", "Cost", "Qty", "Region", "Data quality"].map((heading) => (
                <th key={heading} style={{ ...af(11, 700), padding: "9px 8px", borderBottom: `1px solid ${A.border}` }}>{heading}</th>
              ))}
            </tr></thead>
            <tbody>
              {tableRows.map(({ row, index, issues }) => (
                <tr key={`${row.order_ref}-${index}`}>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.order_ref || "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.order_date || "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.status || "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.product_name || "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.unit_price ?? "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.unit_cost ?? "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.quantity ?? "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}` }}>{row.region || "—"}</td>
                  <td style={{ padding: 8, borderBottom: `1px solid ${A.border}`, color: issues.length ? A.yellow : A.green }}>{issues.join(", ") || "OK"}</td>
                </tr>
              ))}
              {!tableRows.length && <tr><td colSpan={9} style={{ padding: 24, textAlign: "center", color: A.textMuted }}>No rows match these filters.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="analytics-report-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 12, marginBottom: 16 }}>
        {[
          ["Net sales", `₱${metrics.revenue.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`],
          ["Known costs", `₱${metrics.cost.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`],
          ["Known profit", `₱${metrics.profit.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`],
          ["Units sold", metrics.quantity.toLocaleString()],
        ].map(([label, value]) => (
          <div key={label} style={cardStyle}>
            <p style={{ ...af(11, 700), color: A.textMuted, textTransform: "uppercase", marginBottom: 8 }}>{label}</p>
            <p style={{ ...af(23, 700), color: A.gold }}>{value}</p>
          </div>
        ))}
      </div>
      <p style={{ ...af(12, 400), color: A.textMuted, margin: "-4px 0 16px" }}>
        Sales and cost totals use paid rows. Known profit covers {metrics.costedRows} of {metrics.salesRows} sale rows with recorded unit cost; missing costs are excluded, not treated as zero.
      </p>

      <div className="analytics-report-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 16 }}>
        <section style={cardStyle}>
          <h2 style={{ ...af(14, 700), marginBottom: 14 }}>Monthly sales</h2>
          {metrics.months.length ? metrics.months.slice(-12).map(([month, revenue]) => (
            <div key={month} style={{ display: "grid", gridTemplateColumns: "70px 1fr 100px", gap: 8, alignItems: "center", margin: "10px 0" }}>
              <span style={{ ...af(11, 500), color: A.textMuted }}>{month}</span>
              <div style={{ height: 10, background: A.card, borderRadius: 5 }}>
                <div style={{ width: `${Math.max(1, revenue / maxMonthRevenue * 100)}%`, height: "100%", background: A.gold, borderRadius: 5 }} />
              </div>
              <span style={{ ...af(11, 600), textAlign: "right" }}>₱{revenue.toLocaleString("en-PH", { maximumFractionDigits: 0 })}</span>
            </div>
          )) : <p style={{ ...af(12, 400), color: A.textMuted }}>No paid sales in the current selection.</p>}
        </section>
        <section style={cardStyle}>
          <h2 style={{ ...af(14, 700), marginBottom: 14 }}>Business insights & recommendations</h2>
          {metrics.topProducts.length > 0 && <p style={{ ...af(12, 500), marginBottom: 10 }}>Top seller: <strong>{metrics.topProducts[0][0]}</strong> ({metrics.topProducts[0][1]} units).</p>}
          {recommendations.length ? recommendations.map((item) => (
            <p key={item} style={{ ...af(12, 400), color: A.textMuted, padding: "8px 0", borderTop: `1px solid ${A.border}` }}>{item}</p>
          )) : <p style={{ ...af(12, 400), color: A.textMuted }}>No recommendations for the current selection.</p>}
          <p style={{ ...af(11, 400), color: A.textMuted, marginTop: 10 }}>Rule-based guidance from this dataset; validate decisions against your business context.</p>
        </section>
      </div>

      <section className="no-print" style={{ ...cardStyle, marginBottom: 16 }}>
        <h2 style={{ ...af(14, 700), marginBottom: 4 }}>What-if analysis</h2>
        <p style={{ ...af(12, 400), color: A.textMuted, marginBottom: 14 }}>Applies percentage changes to current sales; this is a scenario, not a demand forecast.</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          {([
            { label: "Price change %", value: priceChange, update: setPriceChange },
            { label: "Unit cost change %", value: costChange, update: setCostChange },
            { label: "Quantity change %", value: quantityChange, update: setQuantityChange },
          ] as const).map(({ label, value, update }) => (
            <label key={label} style={{ ...af(11, 600), color: A.textMuted, display: "grid", gap: 5 }}>
              {label}
              <input type="number" min="-100" max="1000" value={value} onChange={(event) => update(event.target.value)} style={inputStyle} />
            </label>
          ))}
        </div>
        <p style={{ ...af(12, 600) }}>
          Scenario sales: ₱{projectedRevenue.toLocaleString("en-PH", { maximumFractionDigits: 2 })} ·
          {" "}known profit: ₱{projectedKnownProfit.toLocaleString("en-PH", { maximumFractionDigits: 2 })}
        </p>
      </section>

      <section style={cardStyle}>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div>
            <h2 style={{ ...af(14, 700), marginBottom: 3 }}>SAS results</h2>
            <p style={{ ...af(12, 400), color: A.textMuted }}>Import a CSV with period, metric, actual, forecast, lower_bound, upper_bound columns.</p>
          </div>
          <div className="no-print" style={{ display: "flex", gap: 8 }}>
            <button style={outlineButton} onClick={() => downloadTemplate(SAS_RESULT_HEADERS, "sas-results-template.csv")}>Results template</button>
            <button style={outlineButton} onClick={exportSasResults} disabled={!sasResults.length}>Export results</button>
            <label style={{ ...buttonStyle, display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
              Import SAS CSV
              <input type="file" accept=".csv,text/csv" onChange={importSasResults} style={{ display: "none" }} />
            </label>
          </div>
        </div>
        {sasChart.points.length > 0 && (
          <div style={{ borderTop: `1px solid ${A.border}`, paddingTop: 14, marginBottom: 14 }}>
            <p style={{ ...af(12, 700), marginBottom: 10 }}>{sasChart.metric} · actual vs forecast</p>
            {sasChart.points.map((point, index) => (
              <div key={`${point.period}-${index}`} style={{ display: "grid", gridTemplateColumns: "80px 1fr 180px", alignItems: "center", gap: 10, margin: "8px 0" }}>
                <span style={{ ...af(11, 500), color: A.textMuted }}>{point.period}</span>
                <div style={{ display: "grid", gap: 3 }}>
                  <div style={{ width: `${Math.max(point.actual == null ? 0 : 1, Math.abs(point.actual ?? 0) / sasChart.maxValue * 100)}%`, height: 7, background: A.blue, borderRadius: 4 }} />
                  <div style={{ width: `${Math.max(point.forecast == null ? 0 : 1, Math.abs(point.forecast ?? 0) / sasChart.maxValue * 100)}%`, height: 7, background: A.gold, borderRadius: 4 }} />
                </div>
                <span style={{ ...af(10, 500), color: A.textMuted, textAlign: "right" }}>
                  A: {point.actual ?? "—"} · F: {point.forecast ?? "—"}
                </span>
              </div>
            ))}
            <p style={{ ...af(10, 400), color: A.textMuted }}>Blue = actual · gold = SAS forecast. Bars show absolute magnitude.</p>
          </div>
        )}
        {sasResults.length ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 620 }}>
              <thead><tr style={{ textAlign: "left", color: A.textMuted }}>
                {["Period", "Metric", "Actual", "Forecast", "Lower bound", "Upper bound"].map((heading) => <th key={heading} style={{ ...af(11, 700), padding: 8, borderBottom: `1px solid ${A.border}` }}>{heading}</th>)}
              </tr></thead>
              <tbody>{sasResults.slice(0, 100).map((result, index) => (
                <tr key={`${result.period}-${result.metric}-${index}`}>
                  {[result.period, result.metric, result.actual, result.forecast, result.lower_bound, result.upper_bound].map((value, cell) => (
                    <td key={cell} style={{ ...af(12, 400), padding: 8, borderBottom: `1px solid ${A.border}` }}>{value ?? "—"}</td>
                  ))}
                </tr>
              ))}</tbody>
            </table>
            {sasResults.length > 100 && <p style={{ ...af(11, 400), color: A.textMuted, marginTop: 8 }}>Showing 100 of {sasResults.length} imported rows.</p>}
          </div>
        ) : <p style={{ ...af(12, 400), color: A.textMuted }}>No SAS results imported in this session.</p>}
      </section>
    </div>
  );
}
