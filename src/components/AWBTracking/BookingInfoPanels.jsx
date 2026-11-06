import { useState } from "react"
import { Link } from "react-router-dom"
import { ChevronRight, Search } from "lucide-react"
import { Modal, ModalHeader, ModalBody } from "@/components/ui"

/*
 * Booking / Shipper / Consignee panels shared by the Tracking screen (TrackAWB) and
 * the Shipment Trace detail screen, so the two always show the same data:
 *
 *   Booking Info      - booking facts + whole-booking totals
 *   Shipper Details   - shipper, then Weight & Pieces, then Payment & Collection
 *                       ("More" opens the deposit slips)
 *   Consignee Details - consignee
 *
 * `buildBookingInfo` maps one `booking_data` object from the tracking /
 * detailed-tracking API into the shape the panels render.
 */

const formatDate = (iso) => {
    if (!iso) return "-"
    const date = new Date(iso)
    if (Number.isNaN(date.getTime())) return "-"
    const dd = String(date.getDate()).padStart(2, "0")
    const mm = String(date.getMonth() + 1).padStart(2, "0")
    return `${dd}-${mm}-${date.getFullYear()}`
}

const hasValue = (v) => v !== null && v !== undefined && v !== "" && v !== "null"
const kg = (v) => (hasValue(v) ? `${v} Kg` : null)
const rupee = (v) => (hasValue(v) ? `₹ ${Number(v).toFixed(2)}` : null)
const yesNo = (v) => (v === undefined || v === null ? null : v ? "Yes" : "No")
// keeps only entries that have something to show (values become strings so a real 0 still renders)
const compact = (obj) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => hasValue(v)).map(([k, v]) => [k, String(v)]))

export const buildBookingInfo = (b, eddEvent = null) => ({
    booking: compact({
        "AWB No": b.awbno || "-",
        "Order ID": b.orderid,
        "RTO AWB No": b.RTO_awbno,
        Customer: b.customer_name || "-",
        "Ref No": b.refno,
        // booking_data.awb_date is when the AWB itself was generated, not when the order was booked
        "Airway Bill Date": formatDate(b.awb_date),
        EDD: eddEvent?.EDD ? formatDate(eddEvent.EDD) : null,
        Product: b.product || "-",
        "Attempt Count": b.attempt_count != null ? b.attempt_count : "-",
        "No Of Boxes": b.total_quantity,
        "Total Weight": kg(b.total_weight),
        "Total Volumetric Weight": kg(b.total_volumetric_weight),
        "Total Chargeable Weight": kg(b.chargeable_weight),
        // real booleans: false is an answer, not an absence
        Delivered: yesNo(b.delivered),
        "OTP Verified": yesNo(b.otp_verified),
        "Booking Date": formatDate(b.booking_date || b.booked_date),
        // the backend sometimes sends the literal string "null"
        "Shipment Flag": b.shipment_flag,
        "Customer Ref No": b.customer_ref_no,
    }),
    shipper: {
        Name: b.shipper_name || "-",
        Mobile: b.shipper_mobile || "-",
        Location:
            b.shipper_city && b.shipper_state ? `${b.shipper_city}, ${b.shipper_state} (${b.shipper_pincode || ""})` : "-",
        Address: b.shipper_address || "-",
    },
    consignee: {
        Name: b.consignee_name || "-",
        Mobile: b.consignee_mobile || "-",
        Location:
            b.consignee_city && b.consignee_state
                ? `${b.consignee_city}, ${b.consignee_state} (${b.consignee_pincode || ""})`
                : "-",
        "Destination SC": b.destination_sc || "-",
        Address: b.consignee_address || "-",
    },
    weight: compact({
        "Actual Weight": kg(b.awb_weight ?? b.weight),
        "Volumetric Weight": kg(b.awb_volumetric_weight ?? b.volumetric_weight),
        "Chargeable Weight": kg(b.awb_chargeable_weight ?? b.chargeable_weight),
        Pieces: b.no_of_pieces ?? b.total_pieces,
    }),
    payment: compact({
        "Payment Mode": b.payment_mode || b.payment_collection_mode,
        "COD Amount": Number(b.cod_amount) > 0 ? rupee(b.cod_amount) : null,
        // the collection status rides on the collected amount, e.g. "₹ 2451.93 (PARTIAL)"
        "Amount Collected": hasValue(b.amount_collected)
            ? `${rupee(b.amount_collected)}${hasValue(b.collection_status) ? ` (${b.collection_status})` : ""}`
            : null,
        // no collected amount yet: still show the status on its own
        "Collection Status": hasValue(b.amount_collected) ? null : b.collection_status,
    }),
    depositSlips: Array.isArray(b.deposit_slips) ? b.deposit_slips : [],
    iciciPayments: Array.isArray(b.icici_payments) ? b.icici_payments : [],
})

const ACCENTS = {
    blue: { header: "bg-[#3B82F6]/12", text: "text-ink" },
    green: { header: "bg-success-500/12", text: "text-success-500" },
    red: { header: "bg-danger-500/12", text: "text-danger-500" },
}

const valueTone = (label, value) => {
    const v = String(value || "")
    if (label === "Shipment Flag") return "text-danger-500"
    if (label === "Delivered" || label === "OTP Verified") return v === "Yes" ? "text-success-500" : "text-danger-500"
    if (label === "Amount Collected" || label === "Collection Status") {
        const status = (label === "Amount Collected" ? (v.match(/\(([^)]*)\)/) || [])[1] : v) || ""
        if (/full|collected|complete|paid|done/i.test(status)) return "text-success-500"
        if (/partial/i.test(status)) return "text-warning-500"
        if (/pending|none|not|unpaid/i.test(status)) return "text-danger-500"
    }
    return "text-ink"
}

const LINE = "border-[rgb(var(--overlay-rgb)/0.08)]"
const LABEL_CELL = `w-[13%] whitespace-nowrap bg-[rgb(var(--overlay-rgb)/0.04)] px-3 py-1 text-left text-[12px] font-medium capitalize text-ink-muted border-b ${LINE}`
const VALUE_CELL = `break-words px-3 py-1 text-[13px] font-semibold border-b ${LINE}`

const Panel = ({ title, accent = "blue", action = null, children }) => (
    <div className="flex h-full flex-col overflow-hidden rounded border border-[rgb(var(--overlay-rgb)/0.08)] bg-[var(--glass-surface)] backdrop-blur-xl">
        <div className={`flex items-center justify-between border-b px-3 py-1 ${LINE} ${ACCENTS[accent].header}`}>
            <h6 className={`m-0 text-[11px] font-semibold uppercase tracking-wider ${ACCENTS[accent].text}`}>{title}</h6>
            {action}
        </div>
        {/* fixed 180px body: the rest of the rows scroll inside the card */}
        <div className="scroll-slim h-[180px] overflow-y-auto">{children}</div>
    </div>
)

// values that can be looked up on the tracking screen; the icon opens /tracking?awb=<value>
const TRACKABLE = new Set(["AWB No", "Order ID", "RTO AWB No"])

const TrackLink = ({ value, label }) => (
    <Link
        to={`/tracking?awb=${encodeURIComponent(value)}`}
        target="_blank"
        rel="noopener noreferrer"
        title={`Track ${label} ${value}`}
        aria-label={`Track ${label} ${value}`}
        className="inline-flex shrink-0 items-center text-[#60A5FA] hover:text-[#93C5FD]"
    >
        <Search aria-hidden="true" size={14} />
    </Link>
)

const KvRows = ({ obj = {} }) =>
    Object.entries(obj).map(([label, value]) => (
        <tr key={label}>
            <th scope="row" className={`${LABEL_CELL} !w-[38%]`}>{label}</th>
            <td className={`${VALUE_CELL} ${valueTone(label, value)}`}>
                {TRACKABLE.has(label) && value && value !== "-" ? (
                    <span className="flex items-center justify-between gap-2">
                        {value}
                        <TrackLink value={value} label={label} />
                    </span>
                ) : (
                    value || "-"
                )}
            </td>
        </tr>
    ))

const SubHeadRow = ({ children, onMore }) => (
    <tr>
        <td colSpan={2} className={`border-b ${LINE} bg-success-500/10 px-3 py-1`}>
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-success-500">{children}</span>
                {onMore && (
                    <button
                        type="button"
                        onClick={onMore}
                        className="inline-flex items-center gap-0.5 border-0 bg-transparent p-0 text-[11px] font-semibold text-success-500 hover:underline"
                    >
                        More <ChevronRight size={14} />
                    </button>
                )}
            </div>
        </td>
    </tr>
)

const Table = ({ columns, rows }) => (
    <div className="overflow-x-auto rounded-lg border border-[rgb(var(--overlay-rgb)/0.08)]">
        <table className="w-full text-[12px]">
            <thead className="bg-[rgb(var(--overlay-rgb)/0.05)] text-ink-muted">
                <tr>
                    {columns.map((c) => (
                        <th key={c.label} className="whitespace-nowrap px-3 py-2 text-left font-semibold">
                            {c.label}
                        </th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {rows.map((r, i) => (
                    <tr key={i} className="border-t border-[rgb(var(--overlay-rgb)/0.08)]">
                        {columns.map((c) => (
                            <td key={c.label} className="whitespace-nowrap px-3 py-2 text-ink">
                                {hasValue(c.get(r)) ? c.get(r) : "-"}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
)

const SLIP_COLUMNS = [
    { label: "Slip No", get: (r) => r.slip_no },
    { label: "Amount", get: (r) => rupee(r.amount) },
    { label: "UTR", get: (r) => r.utr_number },
    { label: "Deposited", get: (r) => (r.deposited_at ? formatDate(r.deposited_at) : null) },
    { label: "Status", get: (r) => (r.is_approved === undefined ? null : r.is_approved ? "Approved" : "Pending") },
]

const EMPTY = { booking: {}, shipper: {}, consignee: {}, weight: {}, payment: {}, depositSlips: [], iciciPayments: [] }

// Title-bar tags: solid tinted pill, a status dot and a coloured border so they read at a glance
// Solid fills with fixed text colours, not tinted pills: a pale tint plus the theme's own amber/green text
// washed out on the light theme (the COD tag was unreadable). These read the same on both themes.
const TAG_TONES = {
    success: "border-[#15803d] bg-[#16a34a] text-white",
    warning: "border-[#d97706] bg-[#fbbf24] text-[#1a1a1a]",
    danger: "border-[#b91c1c] bg-[#e51b2b] text-white",
    info: "border-[#1d4ed8] bg-[#2563eb] text-white",
    neutral: "border-[rgb(var(--overlay-rgb)/0.3)] bg-[rgb(var(--overlay-rgb)/0.1)] text-ink",
}

const Tag = ({ tone = "neutral", children }) => (
    <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase leading-none tracking-wide ${TAG_TONES[tone]}`}>
        <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
        {children}
    </span>
)

// COD is money still to collect, prepaid/paid modes are settled, RTO is a return
const payModeTone = (mode) => {
    const m = String(mode).toLowerCase()
    if (/rto|return/.test(m)) return "danger"
    if (/cod|cash/.test(m)) return "warning"
    if (/pop|paid|prepaid|online|credit|tbb/.test(m)) return "success"
    return "info"
}

const BookingInfoPanels = ({ info = EMPTY, awb = "", showWeight = true, rtoApproved = null }) => {
    // "More" on Payment & Collection opens the deposit slips
    const [depositOpen, setDepositOpen] = useState(false)
    const hasWeight = showWeight && Object.keys(info.weight || {}).length > 0
    const hasPayment = Object.keys(info.payment || {}).length > 0
    // payment mode as a tag beside the RTO tag: COD, POP, PAID, RTO ...
    const payMode = info.payment?.["Payment Mode"] || ""
    const hasDeposits =info.depositSlips?.length > 0 || info.iciciPayments?.length > 0
    const iciciColumns = Object.keys(info.iciciPayments?.[0] || {})
        .slice(0, 5)
        .map((k) => ({ label: k.replace(/_/g, " "), get: (r) => (typeof r[k] === "object" ? JSON.stringify(r[k]) : r[k]) }))

    return (
        <>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
                <Panel
                    title="Booking Info"
                    accent="blue"
                    action={
                        // the RTO tag only shows when the RTO is approved; no "Not RTO Approved" tag
                        rtoApproved !== true && !payMode ? null : (
                            <span className="flex items-center gap-1.5">
                                {payMode && <Tag tone={payModeTone(payMode)}>{payMode}</Tag>}
                                {rtoApproved === true && <Tag tone="success">RTO Approved</Tag>}
                            </span>
                        )
                    }
                >
                    <table className="w-full">
                        <tbody>
                            <KvRows obj={info.booking} />
                            {hasPayment && (
                                <>
                                    <SubHeadRow onMore={hasDeposits ? () => setDepositOpen(true) : null}>Payment &amp; Collection</SubHeadRow>
                                    <KvRows obj={info.payment} />
                                </>
                            )}
                        </tbody>
                    </table>
                </Panel>

                <Panel title="Shipper Details" accent="green">
                    <table className="w-full">
                        <tbody>
                            <KvRows obj={info.shipper} />
                            {hasWeight && (
                                <>
                                    <SubHeadRow>Weight &amp; Pieces</SubHeadRow>
                                    <KvRows obj={info.weight} />
                                </>
                            )}
                        </tbody>
                    </table>
                </Panel>

                <Panel title="Consignee Details" accent="red">
                    <table className="w-full">
                        <tbody>
                            <KvRows obj={info.consignee} />
                        </tbody>
                    </table>
                </Panel>
            </div>

            <Modal isOpen={depositOpen} toggle={() => setDepositOpen(false)} centered size="lg">
                <ModalHeader toggle={() => setDepositOpen(false)}>
                    {awb ? `Deposit Slips - ${awb}` : "Deposit Slips"}
                </ModalHeader>
                <ModalBody>
                    <div className="flex flex-col gap-3">
                        {info.depositSlips?.length > 0 && <Table columns={SLIP_COLUMNS} rows={info.depositSlips} />}
                        {info.iciciPayments?.length > 0 && (
                            <>
                                <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">ICICI Payments</div>
                                <Table columns={iciciColumns} rows={info.iciciPayments} />
                            </>
                        )}
                    </div>
                </ModalBody>
            </Modal>
        </>
    )
}

export default BookingInfoPanels
