import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

/* ================= HELPERS ================= */

const pct = (v) => Number(v || 0).toFixed(2);

const sum = (list, key) =>
    list.reduce((a, b) => a + (Number(b[key]) || 0), 0);

const calcPercent = (value, total) =>
    total ? Number(((value / total) * 100).toFixed(2)) : 0;

/* ================= META HELPERS ================= */

const formatKey = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

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


const formatValue = (value) => {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "All";
    if (value === "" || value == null) return "All";
    return value;
};

/* ================= TIMESTAMP ================= */

const getTimestamp = () =>
    new Date().toISOString().replace(/[:.-]/g, "_");

/* ================= BUILD ROWS ================= */

const buildRows = (list) =>
    list.map(i => ([
        i.date,

        i.same_day, pct(i.same_day_percent),
        i.day1, pct(i.day1_percent),
        i.day2, pct(i.day2_percent),
        i.day3, pct(i.day3_percent),
        i.day4, pct(i.day4_percent),
        i.day5, pct(i.day5_percent),
        i.day5_plus, pct(i.day5_plus_percent),
        //wab
        i.wab, pct(i.wab_percent),
        i.total_attempted_delivery,
        i.pending_for_delivery,
        i.total_shipments,

        i.delivered, pct(i.delivered_percent),
        i.undelivered, pct(i.undelivered_percent),
    ]));

/* ================= TOTAL ROW ================= */

const buildTotalRow = (list) => {
    const totalShipments = sum(list, "total_shipments");

    const sameDay = sum(list, "same_day");
    const d1 = sum(list, "day1");
    const d2 = sum(list, "day2");
    const d3 = sum(list, "day3");
    const d4 = sum(list, "day4");
    const d5 = sum(list, "day5");
    const d5p = sum(list, "day5_plus");

    const delivered = sum(list, "delivered");
    const undelivered = sum(list, "undelivered");

    const attempted = sum(list, "total_attempted_delivery");
    const pending = sum(list, "pending_for_delivery");
    //wab
    const wab = sum(list, "wab")

    return [
        "TOTAL",

        sameDay, calcPercent(sameDay, totalShipments),
        d1, calcPercent(d1, totalShipments),
        d2, calcPercent(d2, totalShipments),
        d3, calcPercent(d3, totalShipments),
        d4, calcPercent(d4, totalShipments),
        d5, calcPercent(d5, totalShipments),
        d5p, calcPercent(d5p, totalShipments),
        wab, calcPercent(wab, totalShipments),
        attempted,
        pending,
        totalShipments,

        delivered, calcPercent(delivered, totalShipments),
        undelivered, calcPercent(undelivered, totalShipments),

    ];
};

/* =====================================================
   🪝 CUSTOM HOOK
   ===================================================== */

export const useAttemptWiseExcelClone = () => {
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

                /* ---------- META ROWS ---------- */
                const metaRows = Object.entries(meta).map(([key, value]) => ([
                    formatKey(key),
                    formatValue(value),
                ]));

                const header = [
                    "Date",

                    "Same Day", "%",
                    "Day 1", "%",
                    "Day 2", "%",
                    "Day 3", "%",
                    "Day 4", "%",
                    "Day 5", "%",
                    "Day 5+", "%",
                    "wab", "%",
                    "Total Attempted Delivery",
                    "Not Attempted",
                    "Total Shipments",

                    "Delivered", "%",
                    "Undelivered", "%",
                ];

                const summaryBlock = buildSummaryBlock(carts)
                const rows = buildRows(data);
                const totalRow = buildTotalRow(data);
                const timestamp = getTimestamp();

                const sheetData = [
                    [title],
                    ...metaRows,
                    [],
                    ...(summaryBlock.length ? summaryBlock : []),
                    ...(summaryBlock.length ? [[]] : []),
                    header,
                    ...rows,
                    [],
                    totalRow,
                ];

                const ws = XLSX.utils.aoa_to_sheet(sheetData);

                /* ---------- COLUMN WIDTH ---------- */
                const wideCols = [
                    "Date",
                    "Total Shipments",
                    "Pending For Delivery",
                    "Total Attempted Delivery",
                ];

                ws["!cols"] = header.map((key) => ({
                    wch: wideCols.includes(key) ? 20 : 10,
                }));

                /* ---------- CELL STYLES ---------- */
                const range = XLSX.utils.decode_range(ws["!ref"]);

                for (let r = range.s.r; r <= range.e.r; r++) {
                    for (let c = range.s.c; c <= range.e.c; c++) {
                        const ref = XLSX.utils.encode_cell({ r, c });
                        if (ws[ref]) {
                            ws[ref].s = {
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
                XLSX.utils.book_append_sheet(wb, ws, title || "Delivery Summary");

                /* ---------- EXTRA SHEET (UNCHANGED) ---------- */
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
                        ),
                    ];

                    const extraWs = XLSX.utils.aoa_to_sheet(extraSheetData);
                    XLSX.utils.book_append_sheet(
                        wb,
                        extraWs,
                        extraSheet.sheetName || "Extra Sheet"
                    );
                }

                XLSX.writeFile(wb, `${title}_${timestamp}.xlsx`);
            } catch (err) {
                console.error(err);
                setError(err.message || "Excel export failed");
            } finally {
                setLoading(false);
            }
        }, 0);
    }, []);

    return { downloadExcel, loading, error };
};
