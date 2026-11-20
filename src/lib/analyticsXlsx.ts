import * as XLSX from "@e965/xlsx";
import type { AnalyticsRow } from "@/lib/analyticsCsv";

export const SAS_DATA_HEADERS = [
  "ID",
  "Date",
  "Product",
  "Qty",
  "Selling Price",
  "Acquisition Cost",
  "Operations Cost",
  "Gross Profit",
  "Net Profit",
  "Location",
  "Payment Status",
  "Inventory Status",
];

function excelDate(value: string) {
  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T|\s)/);
  const date = isoDate
    ? new Date(Date.UTC(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3])))
    : new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  const year = isoDate ? Number(isoDate[1]) : date.getFullYear();
  const month = isoDate ? Number(isoDate[2]) : date.getMonth() + 1;
  const day = isoDate ? Number(isoDate[3]) : date.getDate();
  const timestamp = Date.UTC(year, month - 1, day);
  if (new Date(timestamp).toISOString().slice(0, 10) !== `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`) return null;
  return Number.isFinite(timestamp) ? (timestamp - Date.UTC(1899, 11, 30)) / 86_400_000 : null;
}

function label(value: string) {
  return value.trim()
    .replace(/[_-]+/g, " ")
    .replace(/\b[a-z]/g, (letter) => letter.toUpperCase())
    .replace(/\bGcash\b/g, "GCash");
}

export function serializeSasXlsx(rows: AnalyticsRow[]) {
  const data = rows.map((row, index) => {
    const grossProfit = row.unit_price != null && Number.isFinite(row.unit_price)
      && row.unit_cost != null && Number.isFinite(row.unit_cost)
      && row.quantity != null && Number.isFinite(row.quantity)
      ? (row.unit_price - row.unit_cost) * row.quantity
      : null;
    const paymentStatus = [label(row.status), label(row.payment_method)].filter(Boolean).join(" - ");

    return [
      `TR-${String(index + 1).padStart(3, "0")}`,
      excelDate(row.order_date),
      row.product_name,
      row.quantity,
      row.unit_price,
      row.unit_cost,
      null,
      grossProfit,
      null,
      row.region,
      paymentStatus,
      null,
    ];
  });
  const worksheet = XLSX.utils.aoa_to_sheet([SAS_DATA_HEADERS, ...data]);
  for (let row = 1; row <= rows.length; row++) {
    const dateCell = worksheet[XLSX.utils.encode_cell({ r: row, c: 1 })];
    if (dateCell) dateCell.z = "yyyy-mm-dd";
  }
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "remove the names");
  return XLSX.write(workbook, { bookType: "xlsx", type: "array" });
}
