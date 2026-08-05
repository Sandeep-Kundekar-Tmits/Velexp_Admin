import { useCallback, useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
    Badge, Button, Card, CardBody, Col, Row,
    Nav, NavItem, NavLink, Spinner,
} from "@/components/ui";
import { toast } from "react-toastify";
import { Upload, FileText, CheckCircle, RefreshCw } from "lucide-react";
import MainHeaderComp from "../../../components/MainHeaderCom";
import {
    BANK_STATEMENT_UPLOAD, BANK_STATEMENT_BASE, PENDING_MANIFESTS,
} from "../../../api";
import { authFetch } from "@/lib/http";

const TAB_UPLOAD = "upload";
const TAB_MANIFESTS = "manifests";

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
    <div className="inline-flex items-center gap-1 border rounded px-2 py-1">
        <span className="text-xs text-ink-muted">{label}</span>
        <Badge color={color} className="ml-1">{value ?? "—"}</Badge>
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
        return <p className="text-ink-muted text-xs py-4 text-center">{emptyMsg}</p>;

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
        <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="flex shrink-0 items-center gap-2 mb-2">
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
                    className="btn btn-success btn-sm flex items-center gap-1 shrink-0"
                    onClick={handleExport}
                >
                    <i className="bx bx-download" />
                    Export {q ? `(${filtered.length})` : `(${rows.length})`}
                </button>
            </div>
            {/* scroll-slim + flex-1 rather than a flat 55vh: on the pinned
                screen the panel hands down whatever height is left, and a fixed
                viewport fraction would either overflow it or leave a gap. */}
            <div className="scroll-slim min-h-0 flex-1" style={{ overflow: "auto", maxHeight: "55vh" }}>
                <table className="table table-sm table-hover mb-0">
                    <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                        <tr>
                            <th className="text-xs">#</th>
                            {cols.map((c) => (
                                <th key={c} className="text-xs" style={{ whiteSpace: "nowrap" }}>{fmtCol(c)}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length ? filtered.map((row, i) => (
                            <tr key={i}>
                                <td className="text-xs">{i + 1}</td>
                                {cols.map((c) => (
                                    <td key={c} className="text-xs" style={{ whiteSpace: "nowrap" }}>
                                        {renderCell(row[c])}
                                    </td>
                                ))}
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={cols.length + 1} className="text-center text-ink-muted text-xs py-4">
                                    No results for &ldquo;{search}&rdquo;
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {q && <div className="mt-1 text-xs text-ink-muted">{filtered.length} of {rows.length} rows</div>}
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
    if (DATE_KEY_RE.test(k)) return <span className="text-ink-muted">{fmtDDMMYYYY(v)}</span>;
    if (v != null && typeof v === "object") {
        const display = k === "service_center" ? (v.code ?? v.name ?? "—") : coerce(v);
        return <span className="text-ink-muted">{display || "—"}</span>;
    }
    const str = renderCell(v);
    return <span className="text-ink-muted">{str === "—" ? <span className="text-ink-muted">—</span> : str}</span>;
};

const ManifestTable = ({ rows, emptyMsg = "No data", exportName = "export" }) => {
    const [search, setSearch] = useState("");

    if (!rows?.length)
        return <p className="text-ink-muted text-xs py-4 text-center">{emptyMsg}</p>;

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
        <div className="flex min-h-0 flex-1 flex-col p-3">
            <div className="flex shrink-0 items-center gap-2 mb-2">
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
                    className="btn btn-success btn-sm flex items-center gap-1 shrink-0"
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
                            <th className="text-xs px-4" style={{ whiteSpace: "nowrap" }}>SL</th>
                            {dispKeys.map((k) => (
                                <th key={k} className="text-xs px-4" style={{ whiteSpace: "nowrap" }}>{fmtCol(k)}</th>
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
                                            <td key={k} className="text-center align-middle text-xs font-semibold px-4">
                                                {empVal}
                                                <div className="text-ink-muted font-normal" style={{ fontSize: 11 }}>
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
            {q && <div className="mt-1 text-xs text-ink-muted">{filtered.length} of {rows.length} rows</div>}
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
            const res = await authFetch(BANK_STATEMENT_BASE, { credentials: "include" });
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
            const res = await authFetch(`${BANK_STATEMENT_BASE}${id}/`, { credentials: "include" });
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
            const res = await authFetch(url, { credentials: "include" });
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
            const res = await authFetch(BANK_STATEMENT_UPLOAD, {
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
            const res = await authFetch(PENDING_MANIFESTS, { credentials: "include" });
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
        /* page-fit: the screen is pinned to the content box and the panels
           inside it scroll, rather than the page scrolling as a whole. */
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            {/* No sticky wrapper: MainHeaderComp draws nothing inline now, it
                hands the title to the layout's PageHeader, which is already
                fixed above the scroll box. */}
            <MainHeaderComp
                title="Auto Reconciliation"
                subTitle="Match bank statement entries against pending manifests."
            />

            <div className="container-fluid page-fit-body relative z-10 px-4 pb-4">
                <Nav tabs className="mb-4 shrink-0">
                    {[
                        { id: TAB_UPLOAD, label: "Upload Statement" },
                        { id: TAB_MANIFESTS, label: "Pending Manifests" },
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
                    /* flex-1/min-h-0 instead of minHeight:70vh -- the row takes
                       whatever the pinned page has left, so the panels inside
                       scroll rather than the screen. */
                    <Row className="gx-3 min-h-0 flex-1">

                        {/* ── LEFT: upload form + statement list ── */}
                        <Col md={4} className="flex min-h-0 flex-col gap-4">

                            {/* Upload form */}
                            <Card className="">
                                <CardBody className="p-4">
                                    <div className="flex items-center gap-2 mb-4">
                                        <FileText size={16} className="text-brand-500" />
                                        <h6 className="mb-0 font-semibold text-xs">Upload Bank Statement</h6>
                                    </div>

                                    <div
                                        className="flex items-center gap-2 rounded px-4 py-2 mb-2"
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
                                            className="hidden"
                                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                                        />
                                        {uploadFile ? (
                                            <>
                                                <CheckCircle size={14} className="text-success-500 shrink-0" />
                                                <span className="text-xs font-semibold text-success-500 truncate">{uploadFile.name}</span>
                                                <button
                                                    type="button"
                                                    className="btn btn-sm btn-link text-danger-500 ml-auto p-0"
                                                    onClick={(e) => { e.stopPropagation(); resetUpload(); }}
                                                >✕</button>
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={14} className="text-ink-muted shrink-0" />
                                                <span className="text-xs text-ink-muted">Click to select file</span>
                                            </>
                                        )}
                                    </div>

                                    <Button
                                        color="primary"
                                        size="sm"
                                        className="w-full"
                                        disabled={!uploadFile || uploading}
                                        onClick={handleUpload}
                                    >
                                        {uploading ? <><Spinner size="sm" className="mr-1" />Uploading…</> : "Upload"}
                                    </Button>

                                    {uploadResult && (
                                        <div className="mt-2 flex flex-wrap gap-1">
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
                            <Card className="grow">
                                <CardBody className="p-0 flex flex-col">
                                    <div className="px-4 py-2 border-bottom flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold text-xs">Uploads</span>
                                            {totalCount > 0 && <Badge color="secondary" pill>{totalCount}</Badge>}
                                        </div>
                                        <button
                                            type="button"
                                            className="btn btn-sm btn-outline-secondary flex items-center gap-1 py-0"
                                            onClick={fetchStmtList}
                                            disabled={listLoading}
                                        >
                                            <RefreshCw size={12} className={listLoading ? "spin" : ""} />
                                        </button>
                                    </div>

                                    <div style={{ overflowY: "auto", maxHeight: "50vh" }}>
                                        {listLoading ? (
                                            <div className="text-center py-6"><Spinner color="primary" /></div>
                                        ) : !stmtList.length ? (
                                            <p className="text-ink-muted text-xs py-4 text-center">No uploads yet</p>
                                        ) : stmtList.map((s, i) => (
                                            <div
                                                key={s.id}
                                                onClick={() => selectStatement(s.id)}
                                                style={{ cursor: "pointer" }}
                                                className={`px-3 py-2 border-bottom ${selectedId === s.id ? "bg-primary bg-opacity-10" : ""}`}
                                            >
                                                <div className="flex items-center justify-between mb-1">
                                                    <span className="font-semibold text-xs">#{s.id}</span>
                                                    <span className="text-ink-muted" style={{ fontSize: 11 }}>{fmtDate(s.uploaded_at)}</span>
                                                </div>
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-ink-muted" style={{ fontSize: 11 }}>{s.uploaded_by ?? "—"}</span>
                                                    <Badge color="primary" className="font-normal" style={{ fontSize: 10 }}>CR {s.summary?.total_cr_rows ?? s.total_cr_rows ?? 0}</Badge>
                                                    <Badge color="success" className="font-normal" style={{ fontSize: 10 }}>Stored {s.summary?.stored_count ?? s.stored_count ?? 0}</Badge>
                                                    <Badge color="warning" className="font-normal" style={{ fontSize: 10 }}>Skip {s.summary?.skipped_count ?? s.skipped_count ?? 0}</Badge>
                                                    {s.file_url && (
                                                        <a
                                                            href={s.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="ml-auto"
                                                            title="Download file"
                                                        >
                                                            <i className="bx bx-download text-brand-500" style={{ fontSize: 14 }} />
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
                        <Col md={8} className="flex min-h-0 flex-col">
                            {!selectedId ? (
                                <div
                                    className="h-full flex flex-col items-center justify-center text-ink-muted"
                                    style={{ minHeight: 300 }}
                                >
                                    <i className="bx bx-spreadsheet" style={{ fontSize: 48, opacity: 0.3 }} />
                                    <p className="mt-2 text-xs">Select a statement from the left to view entries</p>
                                </div>
                            ) : (
                                <Card className="h-full">
                                    <CardBody className="p-0 flex flex-col">
                                        {/* header */}
                                        <div className="px-4 py-2 border-bottom flex items-center justify-between flex-wrap gap-2">
                                            <span className="font-semibold text-xs">Statement #{selectedId}</span>
                                            {detailLoading ? <Spinner size="sm" /> : stmtDetail?.summary && (
                                                <div className="flex flex-wrap gap-2">
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
                                        <div className="px-4 py-2 border-bottom flex items-center gap-2">
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
                                        <div className="p-4 grow" style={{ overflowY: "auto" }}>
                                            {entriesLoading ? (
                                                <div className="text-center py-6"><Spinner color="primary" /></div>
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
                    <Card className="flex min-h-0 flex-1 flex-col">
                        <CardBody className="flex min-h-0 flex-1 flex-col p-0">
                            <div className="px-4 py-2 border-bottom flex items-center gap-4 flex-wrap">
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
                                    className="btn btn-sm btn-outline-secondary flex items-center gap-1 py-0 ml-auto"
                                    onClick={fetchManifests}
                                    disabled={mfLoading}
                                >
                                    <RefreshCw size={12} className={mfLoading ? "spin" : ""} /> Refresh
                                </button>
                            </div>

                            <div className="p-4">
                                {mfLoading ? (
                                    <div className="text-center py-6"><Spinner color="primary" /></div>
                                ) : (
                                    <ManifestTable rows={mfData?.rows} emptyMsg="No pending manifests" exportName="Pending_Manifests" />
                                )}
                            </div>
                        </CardBody>
                    </Card>
                )}
            </div>

            <style>{`.spin{animation:spin 1s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
    );
};

export default AutoReconciliation;
