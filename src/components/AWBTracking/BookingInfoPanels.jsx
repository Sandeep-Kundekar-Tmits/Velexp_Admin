import { useState } from "react"
import { ChevronRight } from "lucide-react"
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
        Customer: b.customer_name || "-",
        "Ref No": b.refno,
        "Customer Ref No": b.customer_ref_no,
        "Booking Date": formatDate(b.booking_date || b.booked_date),
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
        "RTO AWB No": b.RTO_awbno,
        // the backend sometimes sends the literal string "null"
        "Shipment Flag": b.shipment_flag,
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

/*
 * Same glass panel as the rest of the app, with a colour-coded header so
 * Booking / Shipper / Consignee read apart at a glance.
 */
const Section = ({ title, accent = "blue", children }) => (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[rgb(var(--overlay-rgb)/0.08)] bg-[var(--glass-surface)] backdrop-blur-xl">
        <div className={`border-b border-[rgb(var(--overlay-rgb)/0.08)] px-4 py-2.5 ${ACCENTS[accent].header}`}>
            <h6 className={`m-0 text-[11px] font-semibold uppercase tracking-wider ${ACCENTS[accent].text}`}>{title}</h6>
        </div>
        <div className="grid grid-cols-2 gap-3 p-4">{children}</div>
    </div>
)

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

const Pair = ({ label, value, full }) => (
    <div className={full ? "col-span-2 min-w-0" : "min-w-0"}>
        <div className={`break-words text-[13px] font-semibold ${valueTone(label, value)}`}>{value || "-"}</div>
        <div className="text-[11px] capitalize text-ink-muted">{label}</div>
    </div>
)

// Renders every entry as a Pair in the 2-column grid. `full` labels span both columns, and a
// Pair left alone in its row (before a full-width one, or last) is stretched across both columns.
const Pairs = ({ obj = {}, full = [] }) => {
    const items = Object.entries(obj).map(([label, value]) => ({ label, value, wide: full.includes(label) }))
    let pending = null
    items.forEach((it) => {
        if (!it.wide) {
            pending = pending ? null : it
        } else if (pending) {
            pending.wide = true
            pending = null
        }
    })
    if (pending) pending.wide = true
    return items.map((it) => <Pair key={it.label} label={it.label} value={it.value} full={it.wide} />)
}

const SubHead = ({ children, onMore }) => (
    <div className="col-span-2 mt-1 flex items-center justify-between border-t border-[rgb(var(--overlay-rgb)/0.08)] pt-3">
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

const BookingInfoPanels = ({ info = EMPTY, awb = "" }) => {
    // "More" on Payment & Collection opens the deposit slips
    const [depositOpen, setDepositOpen] = useState(false)
    const hasWeight = Object.keys(info.weight || {}).length > 0
    const hasPayment = Object.keys(info.payment || {}).length > 0
    const hasDeposits = info.depositSlips?.length > 0 || info.iciciPayments?.length > 0
    const iciciColumns = Object.keys(info.iciciPayments?.[0] || {})
        .slice(0, 5)
        .map((k) => ({ label: k.replace(/_/g, " "), get: (r) => (typeof r[k] === "object" ? JSON.stringify(r[k]) : r[k]) }))

    return (
        <>
            <div className="row gap-y-3">
                <div className="col-12 col-lg-4">
                    <Section title="Booking Info" accent="blue">
                        <Pairs obj={info.booking} />
                    </Section>
                </div>
                <div className="col-12 col-lg-4">
                    <Section title="Shipper Details" accent="green">
                        <Pairs obj={info.shipper} full={["Location", "Address"]} />
                        {hasWeight && (
                            <>
                                <SubHead>Weight &amp; Pieces</SubHead>
                                <Pairs obj={info.weight} />
                            </>
                        )}
                        {hasPayment && (
                            <>
                                <SubHead onMore={hasDeposits ? () => setDepositOpen(true) : null}>Payment &amp; Collection</SubHead>
                                <Pairs obj={info.payment} />
                            </>
                        )}
                    </Section>
                </div>
                <div className="col-12 col-lg-4">
                    <Section title="Consignee Details" accent="red">
                        <Pairs obj={info.consignee} full={["Address"]} />
                    </Section>
                </div>
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
