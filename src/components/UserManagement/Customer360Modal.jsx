import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
    Badge, Modal, ModalBody, ModalHeader,
    Nav, NavItem, NavLink, Table,
} from "@/components/ui";
import Loader from "@/Loaders/Loader";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { CUSTOMER_360 } from "../../api";

/**
 * Everything the back end knows about one customer name, in one dialog.
 *
 * GET /api/accounts/customer-360/?customer_name=<name>&user_id=<logged-in id>
 *
 * The name, not an account id, is the key: a customer can hold several
 * accounts (the response's `totals.accounts` is 8 for the sample) and the
 * point of this view is to see them together.
 */

const fmtINR = (v) =>
    v === null || v === undefined || v === "" || Number.isNaN(Number(v))
        ? "—"
        : `₹${Number(v).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const fmtInt = (v) =>
    v === null || v === undefined ? "—" : Number(v).toLocaleString("en-IN");

/* The payload mixes ISO timestamps ("2026-08-05T18:45:16") with space-separated
   ones ("2024-09-12 16:07:46.806226"), and `createddate` is sometimes null. */
const fmtDate = (v) => {
    if (!v) return "—";
    const d = new Date(typeof v === "string" ? v.replace(" ", "T") : v);
    return Number.isNaN(d.getTime())
        ? String(v)
        : d.toLocaleString("en-IN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
};

const yesNo = (v, { trueTone = "success", falseTone = "secondary" } = {}) => (
    <Badge color={v ? trueTone : falseTone}>{v ? "Yes" : "No"}</Badge>
);

/* One figure in the summary strip. */
const Metric = ({ label, value, tone }) => (
    <div className="min-w-0 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
        <div className="text-[10.5px] uppercase tracking-wider text-ink-muted">{label}</div>
        <div className={`mt-0.5 truncate text-[16px] font-semibold ${tone || "text-white"}`}>
            {value}
        </div>
    </div>
);

/* A section table. Renders its own empty state so each tab does not repeat it. */
const Grid = ({ columns, rows, empty }) => {
    if (!rows?.length) {
        return (
            <p className="m-0 rounded-xl border border-white/8 bg-white/2 px-4 py-10 text-center text-[13px] text-ink-muted">
                {empty}
            </p>
        );
    }
    return (
        /* Its own scroll box: these lists run to thousands of bookings, and the
           dialog body must not grow with them. */
        <div className="scroll-slim max-h-full min-h-0 flex-1 overflow-auto rounded-xl border border-white/8">
            <Table size="sm" hover className="mb-0">
                <thead>
                    <tr>
                        {columns.map((c) => (
                            <th key={c.key} className={`whitespace-nowrap ${c.align === "right" ? "text-right" : ""}`}>
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={row.id ?? i}>
                            {columns.map((c) => (
                                <td key={c.key} className={`whitespace-nowrap ${c.align === "right" ? "text-right" : ""}`}>
                                    {c.cell ? c.cell(row) : (row[c.key] ?? "—")}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

const Customer360Modal = ({ customerName, onClose }) => {
    const { apifunc: fetch360, data, loading } = useGetApiCall();
    const [activeTab, setActiveTab] = useState("accounts");

    const userId = useMemo(
        () => JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id,
        []
    );

    useEffect(() => {
        if (!customerName) return;
        // encodeURIComponent: customer names carry spaces, ampersands and
        // slashes, any of which would otherwise truncate the query string.
        fetch360(
            `${CUSTOMER_360}?customer_name=${encodeURIComponent(customerName)}&user_id=${userId}`
        );
    }, [customerName, userId, fetch360]);

    const totals = data?.totals;

    const TABS = [
        { id: "accounts", label: "Accounts", count: data?.accounts?.length },
        { id: "bookings", label: "Bookings", count: data?.bookings?.length },
        { id: "international", label: "International", count: data?.international_bookings?.length },
        { id: "wallet", label: "Wallet", count: data?.wallet_transactions?.length },
        { id: "disputes", label: "Disputes", count: data?.disputes?.length },
    ];

    return (
        <Modal isOpen={!!customerName} toggle={onClose} centered size="xl" fullscreen>
            <ModalHeader toggle={onClose}>
                {data?.customer_name || customerName}
                <span className="ml-2 text-[13px] font-normal text-ink-muted">
                    Customer 360
                </span>
            </ModalHeader>

            <ModalBody className="flex min-h-0 flex-1 flex-col gap-4">
                {loading ? (
                    <Loader message="Loading customer details…" fullscreen={false} compact />
                ) : !data ? (
                    <p className="m-0 rounded-xl border border-white/8 bg-white/2 px-4 py-12 text-center text-[13px] text-ink-muted">
                        No details found for {customerName}.
                    </p>
                ) : (
                    <>
                        {/* Summary. Read first, so it sits above the tabs rather
                            than inside one of them. */}
                        <div className="grid shrink-0 grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                            <Metric label="Accounts" value={fmtInt(totals?.accounts)} />
                            <Metric label="Wallet Balance" value={fmtINR(totals?.wallet_balance)} tone="text-success-500" />
                            <Metric label="Credit Limit" value={fmtINR(totals?.credit_limit)} />
                            <Metric
                                label="Outstanding"
                                value={fmtINR(totals?.current_outstanding)}
                                tone={totals?.current_outstanding > 0 ? "text-danger-500" : undefined}
                            />
                            <Metric label="Bookings" value={fmtInt(totals?.booking_count)} />
                            <Metric
                                label="Open Disputes"
                                value={fmtInt(totals?.open_dispute_count)}
                                tone={totals?.open_dispute_count > 0 ? "text-danger-500" : undefined}
                            />
                        </div>

                        {totals?.credit_blocked && (
                            <div className="shrink-0 rounded-xl border border-danger-500/30 bg-danger-500/12 px-4 py-2.5 text-[13px] font-semibold text-danger-500">
                                Credit is blocked for this customer.
                            </div>
                        )}

                        <Nav tabs className="shrink-0">
                            {TABS.map((t) => (
                                <NavItem key={t.id}>
                                    <NavLink
                                        className={activeTab === t.id ? "active" : ""}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setActiveTab(t.id)}
                                    >
                                        {t.label}
                                        {t.count > 0 && (
                                            <span className="ml-1.5 text-[11px] text-ink-muted">({t.count})</span>
                                        )}
                                    </NavLink>
                                </NavItem>
                            ))}
                        </Nav>

                        <div className="flex min-h-0 flex-1 flex-col">
                            {activeTab === "accounts" && (
                                <Grid
                                    empty="No accounts."
                                    rows={data.accounts}
                                    columns={[
                                        { key: "username", header: "Username" },
                                        { key: "cust_type", header: "Type" },
                                        { key: "email", header: "Email" },
                                        { key: "phone", header: "Phone" },
                                        { key: "accno", header: "Acc No" },
                                        { key: "gst_no", header: "GST" },
                                        { key: "billing_type", header: "Billing" },
                                        { key: "wallet_amount", header: "Wallet", align: "right", cell: (r) => fmtINR(r.wallet_amount) },
                                        { key: "current_outstanding", header: "Outstanding", align: "right", cell: (r) => fmtINR(r.current_outstanding) },
                                        { key: "is_active", header: "Active", cell: (r) => yesNo(r.is_active) },
                                        { key: "kyc_approved", header: "KYC", cell: (r) => yesNo(r.kyc_approved, { falseTone: "warning" }) },
                                        { key: "is_credit_blocked", header: "Credit Blocked", cell: (r) => yesNo(r.is_credit_blocked, { trueTone: "danger", falseTone: "success" }) },
                                        { key: "created", header: "Created", cell: (r) => fmtDate(r.created) },
                                    ]}
                                />
                            )}

                            {activeTab === "bookings" && (
                                <Grid
                                    empty="No domestic bookings."
                                    rows={data.bookings}
                                    columns={[
                                        { key: "awbno", header: "AWB No" },
                                        { key: "status", header: "Status" },
                                        { key: "payment_mode", header: "Payment Mode" },
                                        { key: "total_amount", header: "Amount", align: "right", cell: (r) => fmtINR(r.total_amount) },
                                        { key: "createddate", header: "Created", cell: (r) => fmtDate(r.createddate) },
                                    ]}
                                />
                            )}

                            {activeTab === "international" && (
                                <Grid
                                    empty="No international bookings."
                                    rows={data.international_bookings}
                                    columns={[
                                        { key: "awbno", header: "AWB No" },
                                        { key: "status", header: "Status" },
                                        { key: "payment_status", header: "Payment" },
                                        {
                                            key: "destination", header: "Destination",
                                            cell: (r) => r.destination_name || r.destination_code || "—",
                                        },
                                        { key: "total_amount", header: "Amount", align: "right", cell: (r) => fmtINR(r.total_amount) },
                                        { key: "createddate", header: "Created", cell: (r) => fmtDate(r.createddate) },
                                    ]}
                                />
                            )}

                            {activeTab === "wallet" && (
                                <Grid
                                    empty="No wallet transactions."
                                    rows={data.wallet_transactions}
                                    columns={[
                                        { key: "transaction_type", header: "Type" },
                                        { key: "status", header: "Status" },
                                        { key: "amount", header: "Amount", align: "right", cell: (r) => fmtINR(r.amount) },
                                        { key: "createddate", header: "Created", cell: (r) => fmtDate(r.createddate) },
                                    ]}
                                />
                            )}

                            {activeTab === "disputes" && (
                                <Grid
                                    empty="No disputes."
                                    rows={data.disputes}
                                    columns={[
                                        { key: "awbno", header: "AWB No" },
                                        { key: "dispute", header: "Dispute" },
                                        {
                                            key: "status", header: "Status",
                                            cell: (r) => (
                                                <Badge color={r.status === "Open" ? "warning" : "success"}>
                                                    {r.status || "—"}
                                                </Badge>
                                            ),
                                        },
                                        { key: "booking_id", header: "Booking ID" },
                                        { key: "createddate", header: "Created", cell: (r) => fmtDate(r.createddate) },
                                    ]}
                                />
                            )}
                        </div>
                    </>
                )}
            </ModalBody>
        </Modal>
    );
};

Customer360Modal.propTypes = {
    /** Drives both the request and whether the dialog is open. */
    customerName: PropTypes.string,
    onClose: PropTypes.func.isRequired,
};

export default Customer360Modal;
