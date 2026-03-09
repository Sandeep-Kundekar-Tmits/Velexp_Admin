import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

/* ================= HELPERS ================= */


const pct = (v) => Number(v || 0).toFixed(2);

const sum = (list, key) =>
  list.reduce((a, b) => a + (Number(b[key]) || 0), 0);

const calcPercent = (value, total) =>
  total ? Number(((value / total) * 100).toFixed(2)) : 0;

/* ================= BUILD ROWS ================= */

const buildRows = (list) =>
  list.map(i => ([
    i.date,

    i.same_day_spd, pct(i.same_day_percent),

    i["1_day"], pct(i["1_day_percent"]),
    i["2_day"], pct(i["2_day_percent"]),
    i["3_day"], pct(i["3_day_percent"]),
    i["4_day"], pct(i["4_day_percent"]),
    i["5_day"], pct(i["5_day_percent"]),
    i["6_day"], pct(i["6_day_percent"]),
    i["7_day"], pct(i["7_day_percent"]),
    i["8_day"], pct(i["8_day_percent"]),
    i["9_day"], pct(i["9_day_percent"]),
    i["10_day"], pct(i["10_day_percent"]),
    i["10_plus_day"], pct(i["10_plus_day_percent"]),

    i.total_shipments
  ]));

/* ================= TOTAL ROW ================= */

const buildTotalRow = (list) => {
  const grandTotal = sum(list, "total_shipments");

  return [
    "TOTAL",

    sum(list, "same_day_spd"),
    calcPercent(sum(list, "same_day_spd"), grandTotal),

    sum(list, "1_day"),
    calcPercent(sum(list, "1_day"), grandTotal),

    sum(list, "2_day"),
    calcPercent(sum(list, "2_day"), grandTotal),

    sum(list, "3_day"),
    calcPercent(sum(list, "3_day"), grandTotal),

    sum(list, "4_day"),
    calcPercent(sum(list, "4_day"), grandTotal),

    sum(list, "5_day"),
    calcPercent(sum(list, "5_day"), grandTotal),

    sum(list, "6_day"),
    calcPercent(sum(list, "6_day"), grandTotal),

    sum(list, "7_day"),
    calcPercent(sum(list, "7_day"), grandTotal),

    sum(list, "8_day"),
    calcPercent(sum(list, "8_day"), grandTotal),

    sum(list, "9_day"),
    calcPercent(sum(list, "9_day"), grandTotal),

    sum(list, "10_day"),
    calcPercent(sum(list, "10_day"), grandTotal),

    sum(list, "10_plus_day"),
    calcPercent(sum(list, "10_plus_day"), grandTotal),

    grandTotal
  ];
};

/* =====================================================
   🪝 CUSTOM HOOK
   ===================================================== */

export const useSecondMileExcel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const downloadExcel = useCallback((data, title = "", extraSheet) => {
    setLoading(true);
    setError(null);

    setTimeout(() => {
      try {
        if (!Array.isArray(data) || !data.length) {
          throw new Error("No data available to export");
        }

        const header = [
          "Date",
          "Same Day", "%",

          "1 Day", "%",
          "2 Day", "%",
          "3 Day", "%",
          "4 Day", "%",
          "5 Day", "%",
          "6 Day", "%",
          "7 Day", "%",
          "8 Day", "%",
          "9 Day", "%",
          "10 Day", "%",
          "10+ Day", "%",

          "Total Shipments"
        ];

        const rows = buildRows(data);
        const totalRow = buildTotalRow(data);

        const sheetData = [
          [],
          header,
          ...rows,
          [],
          totalRow
        ];

        const ws = XLSX.utils.aoa_to_sheet(sheetData);

        /* ---------- TITLE ---------- */
        ws["!merges"] = [
          { s: { r: 0, c: 1 }, e: { r: 0, c: header.length - 1 } }
        ];
        ws["B1"] = { v: title || "First Mile Summary", t: "s" };

        /* ---------- COLUMN WIDTH ---------- */
        ws["!cols"] = [
          { wch: 14 },
          ...Array(header.length - 1).fill({ wch: 8 })
        ];

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
        XLSX.utils.book_append_sheet(wb, ws, "Delivery Strike Rate");

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

        XLSX.writeFile(wb, `${title || "Last_Mile_Summary"}.xlsx`);
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
