export interface AnalyticsRow {
  order_ref: string;
  order_date: string;
  status: string;
  product_name: string;
  category: string;
  unit_price: number | null;
  unit_cost: number | null;
  quantity: number | null;
  payment_method: string;
  region: string;
}

export interface SasResult {
  period: string;
  metric: string;
  actual: number | null;
  forecast: number | null;
  lower_bound: number | null;
  upper_bound: number | null;
}

export const DATASET_HEADERS = [
  "order_ref",
  "order_date",
  "status",
  "product_name",
  "category",
  "unit_price",
  "unit_cost",
  "quantity",
  "payment_method",
  "region",
];

export const SAS_RESULT_HEADERS = [
  "period",
  "metric",
  "actual",
  "forecast",
  "lower_bound",
  "upper_bound",
];

export function parseCsv(text: string): string[][] {
  text = text.replace(/^\uFEFF/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let closedQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
          closedQuote = true;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      if (field.length || closedQuote) throw new Error("CSV contains a misplaced quote.");
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
      closedQuote = false;
    } else if (char === "\n" || char === "\r") {
      row.push(field);
      if (row.some((cell) => cell.trim())) rows.push(row);
      row = [];
      field = "";
      closedQuote = false;
      if (char === "\r" && text[i + 1] === "\n") i++;
    } else {
      if (closedQuote && !/\s/.test(char)) throw new Error("CSV contains text after a closing quote.");
      if (!closedQuote) field += char;
    }
  }

  if (quoted) throw new Error("CSV contains an unclosed quoted field.");
  if (field.length || row.length) {
    row.push(field);
    if (row.some((cell) => cell.trim())) rows.push(row);
  }
  return rows;
}

const normalizeHeader = (value: string) => value.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s-]+/g, "_");
const numberOrNull = (value: string | undefined): number | null => {
  if (value == null || value.trim() === "") return null;
  const parsed = Number(value.trim());
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export function isValidDate(value: string) {
  const isoDate = value.match(/^(\d{4}-\d{2}-\d{2})(?:$|T|\s)/)?.[1];
  if (isoDate) {
    const parsed = new Date(`${isoDate}T00:00:00Z`);
    return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === isoDate;
  }
  return Number.isFinite(Date.parse(value));
}

function headerIndexes(header: string[], required: string[]) {
  const indexes = new Map(header.map((value, index) => [normalizeHeader(value), index]));
  const missing = required.filter((key) => !indexes.has(key));
  if (missing.length) throw new Error(`CSV is missing required columns: ${missing.join(", ")}.`);
  return indexes;
}

export function parseDatasetCsv(text: string): AnalyticsRow[] {
  const [header, ...data] = parseCsv(text);
  if (!header) throw new Error("CSV is empty.");
  const indexes = headerIndexes(header, [
    "order_ref", "order_date", "status", "product_name", "category", "unit_price", "quantity",
  ]);
  const cell = (cells: string[], key: string) => {
    const index = indexes.get(key);
    return index == null ? "" : cells[index] ?? "";
  };
  const rows = data.map((cells) => ({
    order_ref: cell(cells, "order_ref").trim(),
    order_date: cell(cells, "order_date").trim(),
    status: cell(cells, "status").trim().toLowerCase(),
    product_name: cell(cells, "product_name").trim(),
    category: cell(cells, "category").trim(),
    unit_price: numberOrNull(cell(cells, "unit_price")),
    unit_cost: numberOrNull(cell(cells, "unit_cost")),
    quantity: numberOrNull(cell(cells, "quantity")),
    payment_method: cell(cells, "payment_method").trim(),
    region: cell(cells, "region").trim(),
  }));
  if (!rows.length) throw new Error("CSV contains no dataset records.");
  return rows;
}

export function parseSasResultsCsv(text: string): SasResult[] {
  const [header, ...data] = parseCsv(text);
  if (!header) throw new Error("CSV is empty.");
  const indexes = headerIndexes(header, ["period", "metric", "actual", "forecast"]);
  const cell = (cells: string[], key: string) => {
    const index = indexes.get(key);
    return index == null ? "" : cells[index] ?? "";
  };
  const results = data.map((cells) => ({
    period: cell(cells, "period").trim(),
    metric: cell(cells, "metric").trim(),
    actual: numberOrNull(cell(cells, "actual")),
    forecast: numberOrNull(cell(cells, "forecast")),
    lower_bound: numberOrNull(cell(cells, "lower_bound")),
    upper_bound: numberOrNull(cell(cells, "upper_bound")),
  }));
  const invalid = results.find((result) =>
    !result.period
    || !result.metric
    || (result.actual == null && result.forecast == null)
    || [result.actual, result.forecast, result.lower_bound, result.upper_bound].some(
      (value) => value != null && !Number.isFinite(value),
    )
    || (result.lower_bound != null && result.upper_bound != null && result.lower_bound > result.upper_bound),
  );
  if (!results.length || invalid) {
    throw new Error("SAS results need period, metric, and at least one valid actual or forecast value per row.");
  }
  return results;
}

export function serializeCsv(headers: string[], rows: Array<Array<string | number | null>>) {
  const quote = (value: string | number | null) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return `\uFEFF${[headers, ...rows].map((row) => row.map(quote).join(",")).join("\r\n")}`;
}

export function qualityForRow(row: AnalyticsRow): string[] {
  const missing: string[] = [];
  if (!row.order_ref) missing.push("order_ref");
  if (!row.order_date) missing.push("order_date");
  if (!row.status) missing.push("status");
  if (!row.product_name) missing.push("product_name");
  if (!row.category) missing.push("category");
  if (row.unit_price == null) missing.push("unit_price");
  if (row.unit_cost == null) missing.push("unit_cost");
  if (row.quantity == null) missing.push("quantity");
  if (!row.payment_method) missing.push("payment_method");
  if (!row.region) missing.push("region");

  const invalid: string[] = [];
  if (row.order_date && !isValidDate(row.order_date)) invalid.push("order_date");
  if (row.status && !["pending", "paid", "deposit_paid", "failed", "cancelled", "refunded"].includes(row.status)) invalid.push("status");
  if (row.unit_price != null && (!Number.isFinite(row.unit_price) || row.unit_price < 0)) invalid.push("unit_price");
  if (row.unit_cost != null && (!Number.isFinite(row.unit_cost) || row.unit_cost < 0)) invalid.push("unit_cost");
  if (row.quantity != null && (!Number.isInteger(row.quantity) || row.quantity <= 0)) invalid.push("quantity");
  return [...missing.map((field) => `missing:${field}`), ...invalid.map((field) => `invalid:${field}`)];
}

export function duplicateRowIndices(rows: AnalyticsRow[]) {
  const signature = (candidate: AnalyticsRow) => [
    candidate.order_ref,
    candidate.order_date,
    candidate.product_name,
    candidate.unit_price,
    candidate.quantity,
  ].join("\u0000");
  const seen = new Set<string>();
  const duplicates = new Set<number>();
  rows.forEach((row, index) => {
    const key = signature(row);
    if (seen.has(key)) duplicates.add(index);
    else seen.add(key);
  });
  return duplicates;
}
