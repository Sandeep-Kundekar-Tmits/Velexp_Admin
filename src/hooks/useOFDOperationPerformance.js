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

/* ================= TIMESTAMP HELPER (NEW) ================= */

const getTimestamp = () =>
    new Date().toISOString().replace(/[:.-]/g, "_");
/* ================= BUILD ROWS ================= */

const buildRows = (list) =>
    list.map(i => {
        const ofdDone = (i.total_shipments || 0) - (i.pending_ofd || 0);
        const ofdDonePercent = 100 - (i.pending_ofd_percent || 0);

        return [
            i.date,

            i.same_day, pct(i.same_day_percent),
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

            i.pending_ofd, pct(i.pending_ofd_percent),

            ofdDone, pct(ofdDonePercent),

            i.total_shipments
        ];
    });

/* ================= TOTAL ROW ================= */

const buildTotalRow = (list) => {
    const grandTotal = sum(list, "total_shipments");
    const totalPending = sum(list, "pending_ofd");
    const totalOFDone = grandTotal - totalPending;

    return [
        "TOTAL",

        sum(list, "same_day"), calcPercent(sum(list, "same_day"), grandTotal),
        sum(list, "1_day"), calcPercent(sum(list, "1_day"), grandTotal),
        sum(list, "2_day"), calcPercent(sum(list, "2_day"), grandTotal),
        sum(list, "3_day"), calcPercent(sum(list, "3_day"), grandTotal),
        sum(list, "4_day"), calcPercent(sum(list, "4_day"), grandTotal),
        sum(list, "5_day"), calcPercent(sum(list, "5_day"), grandTotal),
        sum(list, "6_day"), calcPercent(sum(list, "6_day"), grandTotal),
        sum(list, "7_day"), calcPercent(sum(list, "7_day"), grandTotal),
        sum(list, "8_day"), calcPercent(sum(list, "8_day"), grandTotal),
        sum(list, "9_day"), calcPercent(sum(list, "9_day"), grandTotal),
        sum(list, "10_day"), calcPercent(sum(list, "10_day"), grandTotal),
        sum(list, "10_plus_day"), calcPercent(sum(list, "10_plus_day"), grandTotal),

        totalPending, calcPercent(totalPending, grandTotal),

        totalOFDone, calcPercent(totalOFDone, grandTotal),

        grandTotal
    ];
};

/* =====================================================
   🪝 CUSTOM HOOK
   ===================================================== */

export const useOFDOperationPerformance = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const downloadExcel = useCallback((data, title = "", extraSheet, meta = {}) => {
        setLoading(true);
        setError(null);

        setTimeout(() => {
            try {
                if (!Array.isArray(data) || !data.length) {
                    throw new Error("No data available to export");
                }

                /* ================= HEADER ================= */

                /* ---------- META ROWS (NEW) ---------- */
                const metaRows = Object.entries(meta).map(([key, value]) => ([
                    formatKey(key),
                    formatValue(value)
                ]));
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

                    "Pending OFD", "%",
                    "Total OFD Done", "%",

                    "Total Shipments",
                ];

                const rows = buildRows(data);
                const totalRow = buildTotalRow(data);
                const timestamp = getTimestamp();
                const fileName = `${title}`;
                const sheetData = [
                    [fileName],
                    ...metaRows,
                    [],
                    header,
                    ...rows,
                    [],
                    [],
                    totalRow
                ];

                const ws = XLSX.utils.aoa_to_sheet(sheetData);

                /* ================= TITLE ================= */

                // ws["!merges"] = [
                //     { s: { r: 0, c: 1 }, e: { r: 0, c: header.length - 1 } }
                // ];

                // ws["B1"] = {
                //     v: title || "First Mile Summary",
                //     t: "s"
                // };

                /* ================= COLUMN WIDTH ================= */

                ws["!cols"] = [
                    { wch: 12 },
                    ...Array(header.length - 1).fill({ wch: 12 })
                ];

                /* ================= ALIGNMENT & TOTAL STYLE ================= */

                const range = XLSX.utils.decode_range(ws["!ref"]);

                for (let r = range.s.r; r <= range.e.r; r++) {
                    for (let c = range.s.c; c <= range.e.c; c++) {
                        const ref = XLSX.utils.encode_cell({ r, c });
                        if (!ws[ref]) continue;

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

                /* ================= WORKBOOK ================= */

                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, title);

                /* ================= EXTRA SHEET (AS-IS) ================= */

                if (extraSheet?.rows?.length) {
                    let extraWs;

                    if (Array.isArray(extraSheet.rows[0])) {
                        extraWs = XLSX.utils.aoa_to_sheet(extraSheet.rows);
                    } else {
                        extraWs = XLSX.utils.json_to_sheet(extraSheet.rows);
                    }

                    XLSX.utils.book_append_sheet(
                        wb,
                        extraWs,
                        extraSheet.sheetName || "Extra Sheet"
                    );
                }
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
        error
    };
};
