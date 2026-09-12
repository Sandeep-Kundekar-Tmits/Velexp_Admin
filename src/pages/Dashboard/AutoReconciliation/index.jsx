import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
    Badge, Button, Card, CardBody, Col, Row,
    Nav, NavItem, NavLink, Spinner,
} from "reactstrap";
import { toast } from "react-toastify";
import { Upload, FileText, CheckCircle, RefreshCw } from "lucide-react";
import MainHeaderComp from "../../../components/MainHeaderCom";
import UnmatchedTransactions from "./UnmatchedTransactions";
import {
    BANK_STATEMENT_UPLOAD, BANK_STATEMENT_BASE, PENDING_MANIFESTS,
} from "../../../api";

const TAB_UPLOAD = "upload";
const TAB_MANIFESTS = "manifests";
const TAB_UNMATCHED = "unmatched";

const fmtCurrency = (v) =>
    v == null ? "—" : `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const fmtCol = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return v;
    return d.toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true,
    });
};

const StatBadge = ({ label, value, color = "primary" }) => (
    <div className="d-inline-flex align-items-center gap-1 border rounded px-2 py-1">
        <span className="small text-muted">{label}</span>
        <Badge color={color} className="ms-1">{value ?? "—"}</Badge>
    </div>
);

const renderCell = (v) => {
    if (v === null || v === undefined) return "—";
    if (typeof v !== "object") return String(v);
    const parts = Object.values(v).filter(
        (x) => x !== null && x !== undefined && typeof x !== "object"
    );
    return parts.length ? parts.join(" · ") : "—";
};

const DataTable = ({ rows, emptyMsg = "No data", exportName = "export" }) => {
    const [search, setSearch] = useState("");

    if (!rows?.length)
        return <p className="text-muted small py-3 text-center">{emptyMsg}</p>;

    const cols = Object.keys(rows[0]);
    const q = search.trim().toLowerCase();
    const filtered = q
        ? rows.filter((row) => cols.some((c) => renderCell(row[c]).toLowerCase().includes(q)))
        : rows;

    const handleExport = () => {
        const data = filtered.map((row) => {
            const flat = {};
            cols.forEach((c) => { flat[fmtCol(c)] = renderCell(row[c]); });
            return flat;
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Data");
        const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
        XLSX.writeFile(wb, `${exportName}_${ts}.xlsx`);
    };

    return (
        <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search across all columns…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: 320 }}
                />
                <button
                    type="button"
                    className="btn btn-success btn-sm d-flex align-items-center gap-1 flex-shrink-0"
                    onClick={handleExport}
                >
                    <i className="bx bx-download" />
                    Export {q ? `(${filtered.length})` : `(${rows.length})`}
                </button>
            </div>
            <div style={{ overflowX: "auto", maxHeight: "55vh", overflowY: "auto" }}>
                <table className="table table-sm table-hover mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                        <tr>
                            <th className="small">#</th>
                            {cols.map((c) => (
                                <th key={c} className="small" style={{ whiteSpace: "nowrap" }}>{fmtCol(c)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length ? filtered.map((row, i) => (
                            <tr key={i}>
                                <td className="small">{i + 1}</td>
                                {cols.map((c) => (
                                    <td key={c} className="small" style={{ whiteSpace: "nowrap" }}>
                                        {renderCell(row[c])}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={cols.length + 1} className="text-center text-muted small py-3">
                                    No results for &ldquo;{search}&rdquo;
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {q && <div className="mt-1 small text-muted">{filtered.length} of {rows.length} rows</div>}
        </div>
    );
};

// ── Manifest grouped table ────────────────────────────────────────────────────
const EMP_KEYS      = ["employee_id","emp_id","allocated_to","employee_code","employee","employee_name"];
const MF_KEYS       = ["manifest_no","manifest_number","manifestno","manifest"];
const HIDDEN_KEY_RE = /^sc$|^manifest_id$/i;
const DATE_KEY_RE   = /date|_at$|created|updated|time/i;

const coerce = (v) => {
    if (v == null) return "";
    if (typeof v !== "object") return String(v);
    return v.name ?? v.code ?? v.label ?? JSON.stringify(v);
};

// Note: `cod(?![a-z])` matches the COD amount fields (cod_pending, cod_collected)
// but NOT "code"-style identifiers like sccode / custcode / pincode, which are text.
const isAmt = (k) =>
    /amount|cod(?![a-z])|pop|pending|collected|received|total|balance|value/i.test(k) &&
    !/count|id|no\b/i.test(k);

const amtClass = (k) => {
    if (/pending|unmatched|due|outstanding|short|skipped/i.test(k)) return "text-danger fw-bold";
    if (/received|collected|reconciled|paid|payment|credit|matched|deposit|validated/i.test(k)) return "text-success";
    return "text-secondary";
};

const fmtAmt = (v) =>
    v == null ? "—" : `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const SubCell = ({ children, isLast, alignEnd = false }) => (
    <div
        className={`d-flex align-items-center px-3${alignEnd ? " justify-content-end" : ""}${!isLast ? " border-bottom" : ""}`}
        style={{ height: 32, fontSize: 12, fontFamily: "monospace" }}
    >
        {children}
    </div>
);

const fmtDDMMYYYY = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    if (isNaN(d)) return String(v);
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
};

const renderMfVal = (k, v) => {
    if (isAmt(k)) return <span className={amtClass(k)}>{fmtAmt(v)}</span>;
    if (DATE_KEY_RE.test(k)) return <span className="text-secondary">{fmtDDMMYYYY(v)}</span>;
    if (v != null && typeof v === "object") {
        const display = k === "service_center" ? (v.code ?? v.name ?? "—") : coerce(v);
        return <span className="text-secondary">{display || "—"}</span>;
    }
    const str = renderCell(v);
    return <span className="text-secondary">{str === "—" ? <span className="text-muted">—</span> : str}</span>;
};

const ManifestTable = ({ rows, emptyMsg = "No data", exportName = "export" }) => {
    const [search, setSearch] = useState("");

    if (!rows?.length)
        return <p className="text-muted small py-3 text-center">{emptyMsg}</p>;

    const allKeys  = Object.keys(rows[0]).filter((k) => !HIDDEN_KEY_RE.test(k));
    const empKey   = EMP_KEYS.find((k) => allKeys.includes(k)) ?? null;
    const mfKey    = MF_KEYS.find((k) => allKeys.includes(k)) ?? null;
    const otherKeys = allKeys.filter((k) => k !== empKey && k !== mfKey);
    const dispKeys  = [mfKey, empKey, ...otherKeys].filter(Boolean);

    const q = search.trim().toLowerCase();
    const filtered = q
        ? rows.filter((row) => allKeys.some((k) => renderCell(row[k]).toLowerCase().includes(q)))
        : rows;

    // Group by employee (or single group if no empKey)
    const groupMap = new Map();
    filtered.forEach((row) => {
        const key = empKey ? (coerce(row[empKey]) || "(Unknown)") : "__all__";
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key).push(row);
    });
    const groups = [...groupMap.entries()].map(([empVal, groupRows]) => ({ empVal, groupRows }));

    // Running SL
    let runSl = 0;
    const groupsWithSl = groups.map((g) => {
        const slStart = runSl;
        runSl += g.groupRows.length;
        return { ...g, slStart };
    });

    const handleExport = () => {
        const data = filtered.map((row) => {
            const flat = {};
            allKeys.forEach((k) => { flat[fmtCol(k)] = renderCell(row[k]); });
            return flat;
        });
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), "Data");
        const ts = new Date().toISOString().slice(0, 16).replace(/[T:]/g, "-");
        XLSX.writeFile(wb, `${exportName}_${ts}.xlsx`);
    };

    return (
        <div>
            <div className="d-flex align-items-center gap-2 mb-2">
                <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search across all columns…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ maxWidth: 320 }}
                />
                <button
                    type="button"
                    className="btn btn-success btn-sm d-flex align-items-center gap-1 flex-shrink-0"
                    onClick={handleExport}
                >
                    <i className="bx bx-download" />
                    Export {q ? `(${filtered.length})` : `(${rows.length})`}
                </button>
            </div>

            <div style={{ overflowX: "auto", maxHeight: "60vh", overflowY: "auto" }}>
                <table className="table table-sm table-hover mb-0" style={{ borderCollapse: "collapse" }}>
                    <thead className="table-light" style={{ position: "sticky", top: 0, zIndex: 1 }}>
                        <tr>
                            <th className="small px-3" style={{ whiteSpace: "nowrap" }}>SL</th>
                            {dispKeys.map((k) => (
                                <th key={k} className="small px-3" style={{ whiteSpace: "nowrap" }}>{fmtCol(k)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {groupsWithSl.map(({ empVal, groupRows, slStart }, gi) => (
                            <tr key={gi} style={{ verticalAlign: "middle" }}>
                                {/* SL */}
                                <td className="p-0" style={{ minWidth: 40 }}>
                                    {groupRows.map((_, ri) => (
                                        <SubCell key={ri} isLast={ri === groupRows.length - 1}>
                                            {slStart + ri + 1}
                                        </SubCell>
                                    ))}
                                </td>

                                {dispKeys.map((k) => {
                                    if (k === empKey) {
                                        return (
                                            <td key={k} className="text-center align-middle small fw-semibold px-3">
                                                {empVal}
                                                <div className="text-muted fw-normal" style={{ fontSize: 11 }}>
                                                    ({groupRows.length})
                                                </div>
                                            </td>
                                        );
                                    }
                                    return (
                                        <td key={k} className="p-0" style={{ minWidth: 100 }}>
                                            {groupRows.map((row, ri) => (
                                                <SubCell
                                                    key={ri}
                                                    isLast={ri === groupRows.length - 1}
                                                    alignEnd={isAmt(k)}
                                                >
                                                    {renderMfVal(k, row[k])}
                                                </SubCell>
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {q && <div className="mt-1 small text-muted">{filtered.length} of {rows.length} rows</div>}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
const AutoReconciliation = () => {
    useEffect(() => { document.title = "Auto Reconciliation"; }, []);

    const [activeTab, setActiveTab] = useState(TAB_UPLOAD);

    // ══════════════════════════════════════════════════════════════
    // TAB 1 – Upload Statement
    // ══════════════════════════════════════════════════════════════

    // ── upload form ──────────────────────────────────────────────
    const fileRef = useRef();
    const [uploadFile, setUploadFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);

    // ── statement list ───────────────────────────────────────────
    const [stmtList, setStmtList] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [listLoading, setListLoading] = useState(false);

    const fetchStmtList = useCallback(async () => {
        setListLoading(true);
        try {
            const res = await fetch(BANK_STATEMENT_BASE, { credentials: "include" });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || `Error ${res.status}`);
            const results = Array.isArray(json) ? json : (json.results ?? []);
            setStmtList(results);
            setTotalCount(json.count ?? results.length);
        } catch (err) {
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 });
        } finally {
            setListLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === TAB_UPLOAD) fetchStmtList();
    }, [activeTab, fetchStmtList]);

    // ── selected statement entries ────────────────────────────────
    const [selectedId, setSelectedId] = useState(null);
    const [stmtDetail, setStmtDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [entries, setEntries] = useState(null);
    const [entriesLoading, setEntriesLoading] = useState(false);
    const [entriesStatus, setEntriesStatus] = useState("all");

    const fetchDetail = useCallback(async (id) => {
        setDetailLoading(true);
        try {
            const res = await fetch(`${BANK_STATEMENT_BASE}${id}/`, { credentials: "include" });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || `Error ${res.status}`);
            setStmtDetail(json);
        } catch (err) {
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 });
        } finally {
            setDetailLoading(false);
        }
    }, []);

    const fetchEntries = useCallback(async (id, status) => {
        setEntriesLoading(true);
        try {
            const url = status === "unmatched"
                ? `${BANK_STATEMENT_BASE}${id}/entries/?status=unmatched`
                : `${BANK_STATEMENT_BASE}${id}/entries/`;
            const res = await fetch(url, { credentials: "include" });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || `Error ${res.status}`);
            setEntries(Array.isArray(json) ? json : (json.entries ?? json.results ?? []));
        } catch (err) {
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 });
        } finally {
            setEntriesLoading(false);
        }
    }, []);

    const selectStatement = (id) => {
        setSelectedId(id);
        setStmtDetail(null);
        setEntries(null);
        setEntriesStatus("all");
        fetchDetail(id);
        fetchEntries(id, "all");
    };

    const handleEntriesStatusChange = (status) => {
        setEntriesStatus(status);
        fetchEntries(selectedId, status);
    };

    const handleUpload = async () => {
        if (!uploadFile) return;
        const form = new FormData();
        form.append("file", uploadFile);
        setUploading(true);
        try {
            const res = await fetch(BANK_STATEMENT_UPLOAD, {
                method: "POST",
                credentials: "include",
                body: form,
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || json?.message || `Error ${res.status}`);
            setUploadResult(json);
            toast.success("Statement uploaded successfully", { position: "bottom-right", autoClose: 4000 });
            await fetchStmtList();
            if (json.id) selectStatement(json.id);
        } catch (err) {
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 });
        } finally {
            setUploading(false);
        }
    };

    const resetUpload = () => {
        setUploadFile(null);
        setUploadResult(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    // ══════════════════════════════════════════════════════════════
    // TAB 2 – Pending Manifests
    // ══════════════════════════════════════════════════════════════
    const [mfLoading, setMfLoading] = useState(false);
    const [mfData, setMfData] = useState(null);

    const fetchManifests = useCallback(async () => {
        setMfLoading(true);
        try {
            const res = await fetch(PENDING_MANIFESTS, { credentials: "include" });
            const json = await res.json();
            if (!res.ok) throw new Error(json?.detail || `Error ${res.status}`);
            setMfData(json);
        } catch (err) {
            toast.error(err.message, { position: "bottom-right", autoClose: 5000 });
        } finally {
            setMfLoading(false);
        }
    }, []);

    useEffect(() => {
        if (activeTab === TAB_MANIFESTS) fetchManifests();
    }, [activeTab, fetchManifests]);

    // ─────────────────────────────────────────────────────────────
    return (
        <div className="page-content py-0 px-0">
            <div className="position-sticky bg-white" style={{ top: 0, zIndex: 100 }}>
                <MainHeaderComp title="Auto Reconciliation" />
            </div>

            <div className="container-fluid px-3 pt-3">
                <Nav tabs className="mb-3">
                    {[
                        { id: TAB_UPLOAD, label: "Upload Statement" },
                        { id: TAB_MANIFESTS, label: "Pending Manifests" },
                        { id: TAB_UNMATCHED, label: "Unmatched Transactions" },
                    ].map(({ id, label }) => (
                        <NavItem key={id}>
                            <NavLink
                                className={activeTab === id ? "active" : ""}
                                style={{ cursor: "pointer" }}
                                onClick={() => setActiveTab(id)}
                            >
                                {label}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                {/* ══ TAB 1: Upload Statement ══════════════════════════════ */}
                {activeTab === TAB_UPLOAD && (
                    <Row className="gx-3" style={{ minHeight: "70vh" }}>

                        {/* ── LEFT: upload form + statement list ── */}
                        <Col md={4} className="d-flex flex-column gap-3">

                            {/* Upload form */}
                            <Card className="shadow-sm">
                                <CardBody className="p-3">
                                    <div className="d-flex align-items-center gap-2 mb-3">
                                        <FileText size={16} className="text-primary" />
                                        <h6 className="mb-0 fw-semibold small">Upload Bank Statement</h6>
                                    </div>

                                    <div
                                        className="d-flex align-items-center gap-2 rounded px-3 py-2 mb-2"
                                        style={{
                                            border: "2px dashed #ced4da",
                                            cursor: uploadFile ? "default" : "pointer",
                                            minHeight: 44,
                                        }}
                                        onClick={() => !uploadFile && fileRef.current?.click()}
                                    >
                                        <input
                                            ref={fileRef}
                                            type="file"
                                            className="d-none"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        />
                                        {uploadFile ? (
                                            <>
                                                <CheckCircle size={14} className="text-success flex-shrink-0" />
                                                <span className="small fw-semibold text-success text-truncate">{uploadFile.name}</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-link text-danger ms-auto p-0"
                                                    onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                                                >✕</button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={14} className="text-muted flex-shrink-0" />
                                                <span className="small text-muted">Click to select file</span>
                                            </>
                                        )}
                                    </div>

                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="w-100"
                                        disabled={!uploadFile || uploading}
                                        onClick={handleUpload}
                                    >
                                        {uploading ? <><Spinner size="sm" className="me-1" />Uploading…</> : "Upload"}
                                    </Button>

                                    {uploadResult && (
                                        <div className="mt-2 d-flex flex-wrap gap-1">
                                            {(() => {
                                                const s = uploadResult.summary ?? uploadResult;
                                                return [
                                                    { label: "CR Rows", value: s.total_cr_rows, color: "primary" },
                                                    { label: "Stored", value: s.stored_count, color: "success" },
                                                    { label: "Skipped", value: s.skipped_count, color: "warning" },
                                                    { label: "Unmatched", value: s.unmatched, color: "danger" },
                                                    { label: "Reconciled", value: s.reconciled, color: "info" },
                                                    { label: "Duplicate", value: s.skipped_duplicate, color: "secondary" },
                                                ].filter(({ value }) => value != null).map(({ label, value, color }) => (
                                                    <StatBadge key={label} label={label} value={value} color={color} />
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </CardBody>
                            </Card>

                            {/* Statement list */}
                            <Card className="shadow-sm flex-grow-1">
                                <CardBody className="p-0 d-flex flex-column">
                                    <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between">
                                        <div className="d-flex align-items-center gap-2">
                                            <span className="fw-semibold small">Uploads</span>
                                            {totalCount > 0 && <Badge color="secondary" pill>{totalCount}</Badge>}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-0"
                                            onClick={fetchStmtList}
                                            disabled={listLoading}
                                        >
                                            <RefreshCw size={12} className={listLoading ? "spin" : ""} />
                                        </button>
                                    </div>

                                    <div style={{ overflowY: "auto", maxHeight: "50vh" }}>
                                        {listLoading ? (
                                            <div className="text-center py-4"><Spinner color="primary" /></div>
                                        ) : !stmtList.length ? (
                                            <p className="text-muted small py-3 text-center">No uploads yet</p>
                                        ) : stmtList.map((s, i) => (
                                            <div
                                                key={s.id}
                                                onClick={() => selectStatement(s.id)}
                                                style={{ cursor: "pointer" }}
                                                className={`px-3 py-2 border-bottom ${selectedId === s.id ? "bg-primary bg-opacity-10" : ""}`}
                                            >
                                                <div className="d-flex align-items-center justify-content-between mb-1">
                                                    <span className="fw-semibold small">#{s.id}</span>
                                                    <span className="text-muted" style={{ fontSize: 11 }}>{fmtDate(s.uploaded_at)}</span>
                                                </div>
                                                <div className="d-flex align-items-center gap-2 flex-wrap">
                                                    <span className="text-muted" style={{ fontSize: 11 }}>{s.uploaded_by ?? "—"}</span>
                                                    <Badge color="primary" className="fw-normal" style={{ fontSize: 10 }}>CR {s.summary?.total_cr_rows ?? s.total_cr_rows ?? 0}</Badge>
                                                    <Badge color="success" className="fw-normal" style={{ fontSize: 10 }}>Stored {s.summary?.stored_count ?? s.stored_count ?? 0}</Badge>
                                                    <Badge color="warning" className="fw-normal" style={{ fontSize: 10 }}>Skip {s.summary?.skipped_count ?? s.skipped_count ?? 0}</Badge>
                                                    {s.file_url && (
                                                        <a
                                                            href={s.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="ms-auto"
                                                            title="Download file"
                                                        >
                                                            <i className="bx bx-download text-primary" style={{ fontSize: 14 }} />
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>

                        {/* ── RIGHT: detail + entries ── */}
                        <Col md={8}>
                            {!selectedId ? (
                                <div
                                    className="h-100 d-flex flex-column align-items-center justify-content-center text-muted"
                                    style={{ minHeight: 300 }}
                                >
                                    <i className="bx bx-spreadsheet" style={{ fontSize: 48, opacity: 0.3 }} />
                                    <p className="mt-2 small">Select a statement from the left to view entries</p>
                                </div>
                            ) : (
                                <Card className="shadow-sm h-100">
                                    <CardBody className="p-0 d-flex flex-column">
                                        {/* header */}
                                        <div className="px-3 py-2 border-bottom d-flex align-items-center justify-content-between flex-wrap gap-2">
                                            <span className="fw-semibold small">Statement #{selectedId}</span>
                                            {detailLoading ? <Spinner size="sm" /> : stmtDetail?.summary && (
                                                <div className="d-flex flex-wrap gap-2">
                                                    {[
                                                        { label: "CR Rows", value: stmtDetail.summary.total_cr_rows, color: "primary" },
                                                        { label: "Stored", value: stmtDetail.summary.stored_count, color: "success" },
                                                        { label: "Skipped", value: stmtDetail.summary.skipped_count, color: "warning" },
                                                        { label: "Unmatched", value: stmtDetail.summary.unmatched, color: "danger" },
                                                        { label: "Reconciled", value: stmtDetail.summary.reconciled, color: "info" },
                                                        { label: "Duplicate", value: stmtDetail.summary.skipped_duplicate, color: "secondary" },
                                                    ].map(({ label, value, color }) => (
                                                        <StatBadge key={label} label={label} value={value} color={color} />
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* entries filter */}
                                        <div className="px-3 py-2 border-bottom d-flex align-items-center gap-2">
                                            <div className="btn-group btn-group-sm">
                                                {[
                                                    { value: "all", label: "All" },
                                                    { value: "unmatched", label: "Unmatched Only" },
                                                ].map(({ value, label }) => (
                                                    <button
                                                        key={value}
                                                        type="button"
                                                        className={`btn btn-${entriesStatus === value ? "primary" : "outline-primary"}`}
                                                        onClick={() => handleEntriesStatusChange(value)}
                                                        disabled={entriesLoading}
                                                    >{label}</button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* entries table */}
                                        <div className="p-3 flex-grow-1" style={{ overflowY: "auto" }}>
                                            {entriesLoading ? (
                                                <div className="text-center py-4"><Spinner color="primary" /></div>
                                            ) : (
                                                <DataTable
                                                    rows={entries}
                                                    emptyMsg="No entries found"
                                                    exportName={`Statement_${selectedId}_${entriesStatus}`}
                                                />
                                            )}
                                        </div>
                                    </CardBody>
                                </Card>
                            )}
                        </Col>
                    </Row>
                )}

                {/* ══ TAB 2: Pending Manifests ═════════════════════════════ */}
                {activeTab === TAB_MANIFESTS && (
                    <Card className="shadow-sm">
                        <CardBody className="p-0">
                            <div className="px-3 py-2 border-bottom d-flex align-items-center gap-3 flex-wrap">
                                {mfData && (
                                    <>
                                        <StatBadge label="Total" value={mfData.total} color="primary" />
                                        <StatBadge label="Total Pending" value={fmtCurrency(mfData.total_pending)} color="warning" />
                                        {mfData.service_center && (
                                            <StatBadge label="Service Center" value={mfData.service_center} color="info" />
                                        )}
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 py-0 ms-auto"
                                    onClick={fetchManifests}
                                    disabled={mfLoading}
                                >
                                    <RefreshCw size={12} className={mfLoading ? "spin" : ""} /> Refresh
                                </button>
                            </div>

                            <div className="p-3">
                                {mfLoading ? (
                                    <div className="text-center py-4"><Spinner color="primary" /></div>
                                ) : (
                                    <ManifestTable rows={mfData?.rows} emptyMsg="No pending manifests" exportName="Pending_Manifests" />
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}

                {/* ══ TAB 3: Unmatched Transactions ════════════════════════ */}
                {activeTab === TAB_UNMATCHED && <UnmatchedTransactions />}
            </div>

            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

export default AutoReconciliation;
