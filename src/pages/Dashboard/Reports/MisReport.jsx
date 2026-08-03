import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
    Upload, FileText, Download, CheckCircle, AlertTriangle,
    X, FileDown, PackageSearch,
} from "lucide-react";
import { Badge, Button, Card, CardBody } from "@/components/ui";
import { toast } from "react-toastify";
import MainHeaderComp from "../../../components/MainHeaderCom";
import { MIS_RUN } from "../../../api";

import { authFetch } from "@/lib/http";
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
                body: JSON.stringify({ awbnos: awbNumbers }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);

            const shipments = Array.isArray(json.shipments) ? json.shipments : [];
            setSummary({
                total_requested: json.total_requested ?? awbNumbers.length,
                total_shipments: json.total_shipments ?? shipments.length,
                not_found_count: json.not_found_count ?? 0,
            });
            setNotFound(Array.isArray(json.not_found) ? json.not_found : []);

            if (shipments.length > 0) {
                setReportColumns(Object.keys(shipments[0]));
                setReportData(shipments);
                toast.success(`${shipments.length} shipments loaded.`, { position: "bottom-right", autoClose: 4000 });
            } else {
                toast("No shipment data returned.", { position: "bottom-right", autoClose: 4000 });
            }
        } catch (err) {
            setError(err.message);
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 });
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

    return (
        <div className="page-content py-0 px-0">
            <div className="sticky bg-white" style={{ top: 0, zIndex: 100 }}>
                <MainHeaderComp title="MIS Run" />
            </div>

            <div className="container-fluid px-4 pt-4">

                {/* ── Upload Card ─────────────────────────────────────────── */}
                <Card className="shadow-sm mb-4">
                    <CardBody className="p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <FileText size={18} className="text-brand-500" />
                            <h6 className="mb-0 font-semibold">Upload AWB Excel File</h6>
                        </div>

                        {/* Drop zone + generate row */}
                        <div className="flex items-stretch gap-4 mb-2">
                            <div
                                className="grow flex items-center gap-2 rounded px-4 py-2"
                                style={{
                                    border: "2px dashed #ced4da",
                                    cursor: awbNumbers.length ? "default" : "pointer",
                                    minHeight: 52,
                                }}
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
                                        <CheckCircle size={16} className="text-success-500 shrink-0" />
                                        <span className="text-xs font-semibold text-success-500 truncate">{file?.name}</span>
                                        <Badge color="success" className="ml-1 shrink-0">{awbNumbers.length} AWBs</Badge>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-link text-danger-500 ml-auto p-0"
                                            onClick={(e) => { e.stopPropagation(); handleReset(); }}
                                            title="Clear"
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={16} className="text-ink-muted shrink-0" />
                                        <span className="text-xs text-ink-muted">
                                            Click to select or drag &amp; drop &nbsp;<em>(.xlsx, .xls, .csv)</em>
                                        </span>
                                    </>
                                )}
                            </div>

                            <Button
                                color="primary"
                                onClick={handleGenerate}
                                disabled={!awbNumbers.length || isGenerating}
                                style={{ whiteSpace: "nowrap" }}
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="spinner-border spinner-border-sm mr-1" role="status" />
                                        Generating…
                                    </>
                                ) : (
                                    <><Download size={14} className="mr-1" />Generate MIS Report</>
                                )}
                            </Button>
                        </div>

                        {/* Template link */}
                        <button
                            type="button"
                            className="btn btn-link btn-sm p-0 text-brand-500"
                            onClick={downloadTemplate}
                        >
                            <Download size={12} className="mr-1" />Download Template
                        </button>

                        {/* Error banner */}
                        {error && (
                            <div className="alert alert-danger py-2 px-4 mt-2 mb-0 flex items-center gap-2 text-xs">
                                <AlertTriangle size={14} className="shrink-0" />
                                {error}
                            </div>
                        )}
                    </CardBody>
                </Card>

                {/* ── Summary stats ───────────────────────────────────────── */}
                {summary && (
                    <div className="flex gap-4 mb-4">
                        {[
                            { label: "Total Requested",  value: summary.total_requested,  color: "primary"                                    },
                            { label: "Shipments Found",  value: summary.total_shipments,  color: "success"                                    },
                            { label: "Not Found",        value: summary.not_found_count,  color: summary.not_found_count > 0 ? "danger" : "secondary" },
                        ].map(({ label, value, color }) => (
                            <Card key={label} className={`flex-grow-1 border-${color} shadow-sm text-center`}>
                                <CardBody className="py-2 px-4">
                                    <div className={`h4 mb-0 text-${color}`}>{value}</div>
                                    <div className="text-xs text-ink-muted">{label}</div>
                                </CardBody>
                            </Card>
                        ))}
                    </div>
                )}

                {/* ── Not-found AWBs ──────────────────────────────────────── */}
                {notFound.length > 0 && (
                    <Card className="border-danger shadow-sm mb-4">
                        <CardBody className="p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <PackageSearch size={16} className="text-danger-500 shrink-0" />
                                <span className="font-semibold text-danger-500 text-xs">
                                    AWBs Not Found ({notFound.length})
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {notFound.map((awb) => (
                                    <code
                                        key={awb}
                                        className="badge text-xs font-normal"
                                        style={{ background: "#fde8e8", color: "#c0392b", fontFamily: "monospace" }}
                                    >
                                        {awb}
                                    </code>
                                ))}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* ── Results Table ───────────────────────────────────────── */}
                {reportData.length > 0 && (
                    <Card className="shadow-sm mb-4">
                        <CardBody className="p-0">
                            <div className="flex items-center justify-between px-4 py-2 border-bottom">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold">Shipment Report</span>
                                    <Badge color="primary" pill>{reportData.length} records</Badge>
                                </div>
                                <Button color="success" size="sm" onClick={handleExport}>
                                    <FileDown size={14} className="mr-1" />Download Report
                                </Button>
                            </div>

                            <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
                                <table className="table table-sm table-bordered table-hover mb-0">
                                    <thead
                                        className="table-light"
                                        style={{ position: "sticky", top: 0, zIndex: 1 }}
                                    >
                                        <tr>
                                            <th className="text-xs">#</th>
                                            {reportColumns.map((col) => (
                                                <th key={col} className="text-xs" style={{ whiteSpace: "nowrap" }}>
                                                    {fmtCol(col)}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {reportData.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="text-xs">{idx + 1}</td>
                                                {reportColumns.map((col) => (
                                                    <td key={col} className="text-xs" style={{ whiteSpace: "nowrap" }}>
                                                        {row[col] ?? "—"}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardBody>
                    </Card>
                )}

            </div>
        </div>
    );
};

export default MisReport;
