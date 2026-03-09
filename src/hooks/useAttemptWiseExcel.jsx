import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

/* ================= HELPERS ================= */

const pct = (v) => Number(v || 0).toFixed(2);

const sum = (list, key) =>
  list.reduce((a, b) => a + (Number(b[key]) || 0), 0);

const calcPercent = (value, total) =>
  total ? Number(((value / total) * 100).toFixed(2)) : 0;
/* ================= META HELPERS (NEW) ================= */

const formatKey = (key) =>
  key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

const formatValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(", ") : "All";
  if (value === "" || value == null) return "All";
  return value;
};

const buildSummaryBlock = (summary = {}) => {
  if (!summary || typeof summary !== "object") return [];

  const keys = Object.keys(summary);
  if (!keys.length) return [];

  const valuesRow = keys.map(key => summary[key] ?? 0);

  const labelsRow = keys.map(key =>
    key
      .replace(/_/g, " ")
      .replace(/\b\w/g, l => l.toUpperCase())
  );

  return [valuesRow, labelsRow];
};


/* ================= TIMESTAMP HELPER (NEW) ================= */

const getTimestamp = () =>
  new Date().toISOString().replace(/[:.-]/g, "_");
/* ================= BUILD ROWS ================= */

const buildRows = (list) =>
  list.map(i => ([
    i.date,

    i["1_attempt"], pct(i["1_attempt_percent"]),
    i["2_attempt"], pct(i["2_attempt_percent"]),
    i["3_attempt"], pct(i["3_attempt_percent"]),
    i["4_attempt"], pct(i["4_attempt_percent"]),
    i["5_plus_attempt"], pct(i["5_plus_attempt_percent"]),
    i["total_attempted_delivery"],
    i["pending_for_delivery"],
    i["overall_total_shipments"],

    // i.total_shipments
  ]));

/* ================= TOTAL ROW ================= */

const buildTotalRow = (list) => {
  const grandTotal = sum(list, "total_shipments");

  const a1 = sum(list, "1_attempt");
  const a2 = sum(list, "2_attempt");
  const a3 = sum(list, "3_attempt");
  const a4 = sum(list, "4_attempt");
  const a5 = sum(list, "5_plus_attempt");
  const overall_total_shipments = sum(list, "overall_total_shipments")
  const pending_for_delivery = sum(list, "pending_for_delivery")
  const total_attempted_delivery = sum(list, "total_attempted_delivery")
  return [
    "TOTAL",

    a1, calcPercent(a1, grandTotal),
    a2, calcPercent(a2, grandTotal),
    a3, calcPercent(a3, grandTotal),
    a4, calcPercent(a4, grandTotal),
    a5, calcPercent(a5, grandTotal),
    total_attempted_delivery,
    pending_for_delivery,
    overall_total_shipments,
    // grandTotal
  ];
};

/* =====================================================
   🪝 CUSTOM HOOK
   ===================================================== */

export const useAttemptWiseExcel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadExcel = useCallback((data, title = "", extraSheet, meta = {}, carts = {}) => {
    setLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        if (!Array.isArray(data) || !data.length) {
          throw new Error("No data available to export");
        }

        /* ---------- META ROWS (NEW) ---------- */
        const metaRows = Object.entries(meta).map(([key, value]) => ([
          formatKey(key),
          formatValue(value)
        ]));

        const header = [
          "Date",

          "1st Attempt", "%",
          "2nd Attempt", "%",
          "3rd Attempt", "%",
          "4th Attempt", "%",
          "5+ Attempts", "%",
          "Total Attempted Delivery",
          "Pending For Delivery",
          "Overall Total Shipments",

          // "Total Shipments"
        ];

        const summaryBlock = buildSummaryBlock(carts)
        const rows = buildRows(data);
        const totalRow = buildTotalRow(data);
        const timestamp = getTimestamp();
        const fileName = `${title}`;
        const sheetData = [
          [fileName],
          ...metaRows,
          [],
          ...(summaryBlock.length ? summaryBlock : []),
          ...(summaryBlock.length ? [[]] : []),
          header,
          ...rows,
          [],
          totalRow
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);



        /* ---------- COLUMN WIDTH ---------- */
        const wideCols = [
          "Date",
          "Overall Total Shipments",
          "Pending For Delivery",
          "Total Attempted Delivery",
        ];

        ws["!cols"] = header.map((key) => ({
          wch: wideCols.includes(key) ? 20 : 10
        }));
        /* ---------- CELL STYLES ---------- */
        const range = XLSX.utils.decode_range(ws["!ref"]);

        for (let r = range.s.r; r <= range.e.r; r++) {
          for (let c = range.s.c; c <= range.e.c; c++) {
            const ref = XLSX.utils.encode_cell({ r, c });
            if (ws[ref]) {
              ws[ref].s = {
                ...(ws[ref].s || {}),
                alignment: {
                  horizontal: "left",
                  vertical: "center",
                },
                font:
                  r === sheetData.length - 1
                    ? { bold: true }
                    : undefined,
              };
            }
          }
        }

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, title);

        /* ---------- EXTRA SHEET ---------- */
        if (extraSheet?.rows?.length) {
          const normalizeKey = (key) =>
            key.toLowerCase().replace(/[^a-z0-9]/g, "");

          const extraSheetData = [
            extraSheet.headers,
            ...extraSheet.rows.map(row =>
              extraSheet.headers.map(h => {
                const normalizedHeader = normalizeKey(h);
                return (
                  Object.entries(row).find(
                    ([k]) => normalizeKey(k) === normalizedHeader
                  )?.[1] ?? ""
                );
              })
            )
          ];

          const extraWs = XLSX.utils.aoa_to_sheet(extraSheetData);
          XLSX.utils.book_append_sheet(
            wb,
            extraWs,
            extraSheet.sheetName || "Extra Sheet"
          );
        }

        // XLSX.writeFile(
        //   wb,
        //   `${title || "Attempt_Delivery_Summary"}.xlsx`
        // );
        XLSX.writeFile(
          wb,
          `${title}_${timestamp}.xlsx`
        );
      } catch (err) {
        console.error(err);
        setError(err.message || "Excel export failed");
      } finally {
        setLoading(false);
      }
    }, 0);
  }, []);

  return {
    downloadExcel,
    loading,
    error,
  };
};
