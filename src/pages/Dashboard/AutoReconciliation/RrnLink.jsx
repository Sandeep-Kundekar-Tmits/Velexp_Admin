import { useState } from "react";
import { Badge, Button, Card, CardBody, Spinner } from "@/components/ui";
import { toast } from "react-toastify";
import { rawRequest } from "@/lib/http";
import { ICICI_RRN_LINK } from "../../../api";

const fmtCurrency = (v) =>
    v == null || v === "" ? "—" : `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(v);
    return isNaN(d) ? v : d.toLocaleString("en-IN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: true });
};

const errText = (data, status) =>
    data?.detail || data?.error || data?.message || data?.msg || data?.status || `Request failed (${status})`;

// Reconciles an ICICI QR payment (by RRN) against a COD AWB. HO / superuser only.
const RrnLink = () => {
    const [awb, setAwb] = useState("");
    const [windowHours, setWindowHours] = useState("");
    const [rrn, setRrn] = useState("");
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);
    const [booking, setBooking] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [preview, setPreview] = useState(null); // { body, result } awaiting confirmation
    const [done, setDone] = useState(null);

    const awbno = awb.trim().toUpperCase();

    const search = async () => {
        if (!awbno) return toast.error("Enter an AWB number");
        setLoading(true);
        setPreview(null);
        setDone(null);
        try {
            const qs = new URLSearchParams({ awbno });
            if (windowHours) qs.set("window_hours", windowHours);
            const { ok, status, data } = await rawRequest(`${ICICI_RRN_LINK}?${qs}`);
            if (!ok) {
                setBooking(null);
                setCandidates([]);
                return toast.error(errText(data, status));
            }
            setBooking(data);
            setCandidates(data.candidates || []);
            if (!data.candidates?.length) toast.info("No candidate payments found");
        } catch (e) {
            console.error("RRN search failed:", e);
            toast.error("Search failed");
        } finally {
            setLoading(false);
        }
    };

    // Always dry-runs first; the user confirms before anything is saved.
    const dryRun = async (extra = {}) => {
        if (!awbno) return toast.error("Enter an AWB number");
        const body = { awbno, ...extra };
        setLoading(true);
        setDone(null);
        try {
            const { ok, status, data } = await rawRequest(ICICI_RRN_LINK, {
                method: "POST", body: { ...body, dry_run: true } });
            if (!ok) {
                setPreview(null);
                if (status === 409 && data?.candidates) setCandidates(data.candidates);
                return toast.error(errText(data, status));
            }
            setPreview({ body, result: data });
        } catch (e) {
            console.error("RRN dry run failed:", e);
            toast.error("Dry run failed");
        } finally {
            setLoading(false);
        }
    };

    const confirm = async () => {
        setLoading(true);
        try {
            const { ok, status, data } = await rawRequest(ICICI_RRN_LINK, {
                method: "POST", body: preview.body });
            if (!ok) return toast.error(errText(data, status));
            setDone(data);
            setPreview(null);
            setCandidates([]);
            toast.success("Payment reconciled");
        } catch (e) {
            console.error("RRN link failed:", e);
            toast.error("Reconcile failed");
        } finally {
            setLoading(false);
        }
    };

    const manualExtra = () => {
        const extra = {};
        if (rrn.trim()) extra.rrn = rrn.trim();
        if (amount !== "") extra.amount = Number(amount);
        return extra;
    };

    return (
        <div className="flex flex-col gap-3">
            <Card>
                <CardBody>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <div>
                            <label className="form-label text-xs font-bold text-ink-muted">AWB No.</label>
                            <input className="form-control" value={awb}
                                onChange={(e) => setAwb(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && search()} />
                        </div>
                        <div>
                            <label className="form-label text-xs font-bold text-ink-muted">Window hours (default 3)</label>
                            <input className="form-control" type="number" min="1" value={windowHours}
                                onChange={(e) => setWindowHours(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label text-xs font-bold text-ink-muted">RRN (optional)</label>
                            <input className="form-control" value={rrn} onChange={(e) => setRrn(e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label text-xs font-bold text-ink-muted">Amount (statement only)</label>
                            <input className="form-control" type="number" min="0" value={amount}
                                onChange={(e) => setAmount(e.target.value)} />
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <Button color="primary" size="sm" onClick={search} disabled={loading}>Search AWB</Button>
                        <Button color="secondary" size="sm" onClick={() => dryRun(manualExtra())} disabled={loading}>
                            {rrn.trim() ? "Check RRN + AWB" : "Auto-pick for AWB"}
                        </Button>
                        {loading && <Spinner size="sm" />}
                    </div>
                    <p className="mt-2 text-xs text-ink-muted">
                        Amount is only needed when the callback was never received and the RRN comes from the ICICI statement.
                    </p>
                </CardBody>
            </Card>

            {booking && (
                <Card>
                    <CardBody className="flex flex-wrap items-center gap-4 text-sm">
                        <span><span className="text-ink-muted">AWB </span><b>{booking.awbno}</b></span>
                        <span><span className="text-ink-muted">Consignee </span><b>{booking.consignee || "—"}</b></span>
                        <span><span className="text-ink-muted">Pending COD </span><b>{fmtCurrency(booking.pending_cod)}</b></span>
                    </CardBody>
                </Card>
            )}

            {candidates.length > 0 && (
                <Card>
                    <CardBody className="p-0">
                        <div className="scroll-slim overflow-auto">
                            <table className="table table-sm table-hover mb-0">
                                <thead className="table-light">
                                    <tr>
                                        {["RRN", "Match", "Amount", "Paid At", "Payer", "Payer VA", "Name Match", "Min from OFD/SPD", ""].map((h) => (
                                            <th key={h} className="text-xs" style={{ whiteSpace: "nowrap" }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {candidates.map((c) => (
                                        <tr key={c.rrn}>
                                            <td className="text-xs">{c.rrn}</td>
                                            <td className="text-xs"><Badge color={c.match === "orphan_qr" ? "warning" : "info"}>{c.match}</Badge></td>
                                            <td className="text-xs">{fmtCurrency(c.amount)}</td>
                                            <td className="text-xs">{fmtDate(c.paid_at)}</td>
                                            <td className="text-xs">{c.payer_name || "—"}</td>
                                            <td className="text-xs">{c.payer_va || "—"}</td>
                                            <td className="text-xs">
                                                {c.payer_name_match == null ? "—" : <Badge color={c.payer_name_match ? "success" : "danger"}>{c.payer_name_match ? "Yes" : "No"}</Badge>}
                                            </td>
                                            <td className="text-xs">{c.minutes_from_ofd_spd ?? "—"}</td>
                                            <td className="text-xs">
                                                <Button size="sm" color="primary" disabled={loading}
                                                    onClick={() => dryRun({ rrn: c.rrn })}>Link</Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardBody>
                </Card>
            )}

            {preview && (
                <Card>
                    <CardBody>
                        <div className="mb-2 text-sm font-bold">Dry run OK — confirm to reconcile</div>
                        <div className="mb-3 flex flex-wrap gap-4 text-sm">
                            <span><span className="text-ink-muted">AWB </span><b>{preview.body.awbno}</b></span>
                            <span><span className="text-ink-muted">RRN </span><b>{preview.result.rrn || preview.body.rrn || "—"}</b></span>
                            <span><span className="text-ink-muted">Amount </span><b>{fmtCurrency(preview.result.amount)}</b></span>
                            {preview.result.manifest_no && (
                                <span><span className="text-ink-muted">Manifest </span><b>{preview.result.manifest_no}</b></span>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button color="success" size="sm" onClick={confirm} disabled={loading}>Confirm &amp; Reconcile</Button>
                            <Button color="secondary" size="sm" onClick={() => setPreview(null)} disabled={loading}>Cancel</Button>
                        </div>
                    </CardBody>
                </Card>
            )}

            {done && (
                <Card>
                    <CardBody className="flex flex-wrap gap-4 text-sm">
                        <Badge color="success">Reconciled</Badge>
                        <span><span className="text-ink-muted">Slip </span><b>{done.slip_no || "—"}</b></span>
                        <span><span className="text-ink-muted">Payment ID </span><b>{done.payment_id ?? "—"}</b></span>
                        <span><span className="text-ink-muted">Amount </span><b>{fmtCurrency(done.amount)}</b></span>
                    </CardBody>
                </Card>
            )}
        </div>
    );
};

export default RrnLink;
