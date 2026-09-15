import { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import * as XLSX from "xlsx";
import {
    Upload, FileText, Download, CheckCircle, AlertTriangle,
    X, PackageSearch } from "lucide-react";
import { Badge, Button, Spinner } from "@/components/ui";
import { toast } from "react-toastify";
import MainHeaderComp from "../../../components/MainHeaderCom";
import TableContainer from "../../../components/Table/TableContainer";
import { cn } from "@/lib/cn";
import { MIS_RUN } from "../../../api";

import { authFetch } from "@/lib/http";

/* One glass panel per block, matching the grid-shell/modal/sidebar look
   everywhere else in the app -- this screen predated that pattern and was
   still on plain Card, and several of its Bootstrap-flavoured classes
   (border-primary, text-danger, alert-danger, spinner-border, table-bordered)
   have no CSS behind them at all any more, so the borders, colours and
   loading spinner they were meant to draw simply never appeared. */
const Panel = ({ className, children }) => (
    <div className={cn("rounded-2xl border border-white/8 bg-[rgba(17,24,39,0.70)] p-4 backdrop-blur-xl", className)}>
        {children}
    </div>
);

Panel.propTypes = {
    className: PropTypes.string,
    children: PropTypes.node };

const MisReport = () => {
    useEffect(() => { document.title = "MIS Report"; }, []);

    const fileRef = useRef();
    const [file,          setFile]          = useState(null);
    const [awbNumbers,    setAwbNumbers]    = useState([]);
    const [isGenerating,  setIsGenerating]  = useState(false);
    const [error,         setError]         = useState("");
    const [reportData,    setReportData]    = useState([]);
    const [reportColumns, setReportColumns] = useState([]);
    const [summary,       setSummary]       = useState(null);
    const [notFound,      setNotFound]      = useState([]);
    // Hidden once a report is generated -- table height matters more than the
    // upload box once there's a result to look at. "Upload New File" in the
    // header (below) is the only way back to it.
    const [uploadCollapsed, setUploadCollapsed] = useState(false);

    // ── Excel parsing ──────────────────────────────────────────────────────
    const parseFile = (f) => {
        setError(""); setReportData([]); setReportColumns([]);
        setSummary(null); setNotFound([]); setAwbNumbers([]);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: "array" });
                const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });
                if (rows.length < 2) { setError("File has no data rows."); return; }

                const headers = rows[0].map((h) => String(h ?? "").trim());
                let colIdx = headers.findIndex((h) => h.toLowerCase().includes("awb"));
                if (colIdx === -1) colIdx = 0;

                const awbs = rows.slice(1)
                    .map((row) => String(row[colIdx] ?? "").trim())
                    .filter(Boolean);

                if (!awbs.length) { setError("No AWB numbers found in the file."); return; }
                setAwbNumbers(awbs);
            } catch (err) {
                setError("Failed to parse file: " + err.message);
            }
        };
        reader.readAsArrayBuffer(f);
    };

    const handleFileChange = (f) => {
        if (!f) return;
        setFile(f);
        parseFile(f);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files?.[0];
        if (f) { setFile(f); parseFile(f); }
    };

    const handleReset = () => {
        setFile(null); setAwbNumbers([]); setError("");
        setReportData([]); setReportColumns([]);
        setSummary(null); setNotFound([]);
        setUploadCollapsed(false);
        if (fileRef.current) fileRef.current.value = "";
    };

    // ── Generate ───────────────────────────────────────────────────────────
    const handleGenerate = async () => {
        if (!awbNumbers.length) { setError("No AWB numbers to process."); return; }
        setIsGenerating(true); setError("");
        try {
            const res = await authFetch(MIS_RUN, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ awbnos: awbNumbers }) });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);

            const shipments = Array.isArray(json.shipments) ? json.shipments : [];
            setSummary({
                total_requested: json.total_requested ?? awbNumbers.length,
                total_shipments: json.total_shipments ?? shipments.length,
                not_found_count: json.not_found_count ?? 0 });
            setNotFound(Array.isArray(json.not_found) ? json.not_found : []);

            if (shipments.length > 0) {
                setReportColumns(Object.keys(shipments[0]));
                setReportData(shipments);
                // Only on real success: an error or an empty result needs the
                // panel to stay put, since the message explaining why lives
                // inside it and this is exactly where a retry happens from.
                setUploadCollapsed(true);
                toast.success(`${shipments.length} shipments loaded.`, { autoClose: 4000 });
            } else {
                toast("No shipment data returned.", { autoClose: 4000 });
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message, { autoClose: 5000 });
        } finally {
            setIsGenerating(false);
        }
    };

    // ── Template download ──────────────────────────────────────────────────
    const downloadTemplate = () => {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet([["awbno"], ["VE2136764"], ["VE2136722"]]);
        XLSX.utils.book_append_sheet(wb, ws, "Template");
        XLSX.writeFile(wb, "MIS_Report_Template.xlsx");
    };

    // ── Export result ──────────────────────────────────────────────────────
    const handleExport = () => {
        if (!reportData.length) return;
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(reportData);
        XLSX.utils.book_append_sheet(wb, ws, "MIS Report");
        const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
        XLSX.writeFile(wb, `MIS_Report_${ts}.xlsx`);
    };

    const fmtCol = (key) =>
        key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    /* The response shape is not known ahead of time -- shipments.length can
       be zero columns or forty, whichever fields the backend chose to
       include for this batch -- so the column list is built from whatever
       keys actually came back, the same as the hand-rolled <table> this
       replaces did with reportColumns.map(...). */
    const columns = useMemo(
        () => [
            {
                header: "#",
                id: "row_index",
                enableColumnFilter: false,
                enableSorting: false,
                cell: ({ row }) => row.index + 1 },
            ...reportColumns.map((col) => ({
                header: fmtCol(col),
                accessorKey: col,
                enableColumnFilter: false,
                enableSorting: true,
                cell: ({ getValue }) => getValue() ?? "--" })),
        ],
        [reportColumns]
    );

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="MIS Run"
                subTitle="Upload an AWB list and pull the matching shipment records."
                extraFields={
                    uploadCollapsed && (
                        <Button
                            className="table-action-btn table-action-btn-solid"
                            onClick={() => setUploadCollapsed(false)}
                        >
                            <Upload aria-hidden="true" size={14} />
                            Upload New File
                        </Button>
                    )
                }
            />

            <div className="page-fit-body relative z-10 flex flex-col gap-3 pb-3">
                {/* ── Upload panel ─────────────────────────────────────────── */}
                {!uploadCollapsed && (
                <Panel>
                    <div className="mb-2.5 flex items-center gap-2">
                        <FileText aria-hidden="true" size={18} className="text-[#3B82F6]" />
                        <h6 className="m-0 text-[15px] font-semibold text-white">Upload AWB Excel File</h6>
                    </div>

                    {/* Drop zone + generate row */}
                    <div className="mb-2 flex flex-wrap items-stretch gap-3">
                        {/* border-white/15, not the old #ced4da: a light-grey
                            dashed line was nearly invisible against this
                            panel's own dark background. min-h-11, not the
                            original 52px -- the content is one line of icon
                            and text, so the extra height was just padding. */}
                        <div
                            className={cn(
                                "flex min-h-11 grow items-center gap-2 rounded-lg border-2 border-dashed px-4 py-1.5",
                                awbNumbers.length ? "cursor-default border-white/15" : "cursor-pointer border-white/20 hover:border-[#3B82F6]/50"
                            )}
                            onClick={() => !awbNumbers.length && fileRef.current?.click()}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                        >
                            <input
                                ref={fileRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                className="hidden"
                                onChange={(e) => handleFileChange(e.target.files?.[0])}
                            />
                            {awbNumbers.length ? (
                                <>
                                    <CheckCircle aria-hidden="true" size={16} className="shrink-0 text-success-500" />
                                    <span className="truncate text-[13px] font-semibold text-success-500">{file?.name}</span>
                                    <Badge color="success" className="ml-1 shrink-0">{awbNumbers.length} AWBs</Badge>
                                    <button
                                        type="button"
                                        className="ml-auto shrink-0 rounded-full p-1 text-danger-500 transition-colors hover:bg-danger-500/10"
                                        onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                        title="Clear"
                                    >
                                        <X size={14} />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Upload aria-hidden="true" size={16} className="shrink-0 text-ink-muted" />
                                    <span className="text-[13px] text-ink-muted">
                                        Click to select or drag &amp; drop &nbsp;<em>(.xlsx, .xls, .csv)</em>
                                    </span>
                                </>
                            )}
                        </div>

                        <Button
                            color="primary"
                            className="shrink-0 whitespace-nowrap"
                            onClick={handleGenerate}
                            disabled={!awbNumbers.length || isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Spinner size="sm" />
                                    Generating...
                                </>
                            ) : (
                                <><Download aria-hidden="true" size={14} />Generate MIS Report</>
                            )}
                        </Button>
                    </div>

                    {/* Template link */}
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[13px] font-medium text-[#3B82F6] hover:text-[#60A5FA]"
                        onClick={downloadTemplate}
                    >
                        <Download aria-hidden="true" size={12} />Download Template
                    </button>

                    {/* Error banner */}
                    {error && (
                        <div className="mt-2 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-2 text-[13px] text-[#f5a88a]">
                            <AlertTriangle aria-hidden="true" size={14} className="shrink-0" />
                            {error}
                        </div>
                    )}
                </Panel>
                )}

                {/* ── Summary stats ───────────────────────────────────────── */}
                {summary && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {[
                            { label: "Total Requested", value: summary.total_requested, accent: "text-[#3B82F6]" },
                            { label: "Shipments Found", value: summary.total_shipments, accent: "text-success-500" },
                            {
                                label: "Not Found",
                                value: summary.not_found_count,
                                accent: summary.not_found_count > 0 ? "text-danger-500" : "text-ink-muted" },
                        ].map(({ label, value, accent }) => (
                            <Panel key={label} className="p-3 text-center">
                                <div className={cn("text-2xl font-semibold tracking-tight", accent)}>{value}</div>
                                <div className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-ink-muted">{label}</div>
                            </Panel>
                        ))}
                    </div>
                )}

                {/* ── Not-found AWBs ──────────────────────────────────────── */}
                {notFound.length > 0 && (
                    <Panel className="border-danger-500/25">
                        <div className="mb-2 flex items-center gap-2">
                            <PackageSearch aria-hidden="true" size={16} className="shrink-0 text-danger-500" />
                            <span className="text-[13px] font-semibold text-danger-500">
                                AWBs Not Found ({notFound.length})
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {notFound.map((awb) => (
                                <code
                                    key={awb}
                                    className="rounded-full border border-danger-500/25 bg-danger-500/10 px-2.5 py-1 font-mono text-[12px] text-[#f5a88a]"
                                >
                                    {awb}
                                </code>
                            ))}
                        </div>
                    </Panel>
                )}

                {/* ── Results table ────────────────────────────────────────── */}
                {reportData.length > 0 && (
                    <div className="page-fit-body">
                        <TableContainer
                            columns={columns}
                            data={reportData}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            isDownloadExcle={true}
                            onDownloadExcle={handleExport}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper='dataTables_paginate paging_simple_numbers'
                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="60vh"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MisReport;
