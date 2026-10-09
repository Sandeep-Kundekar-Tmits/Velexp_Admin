import { useState } from "react"
import { Spinner } from "@/components/ui"
import { ChevronDown } from "lucide-react"
import usePostApiCall from "../../hooks/usePostApiCall"
import { GET_BAG_TRACKING } from "../../api"

const formatDateTime = (iso) => {
    if (!iso) return "-"
    try {
        return new Date(iso).toLocaleString("en-IN", {
            day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
        })
    } catch {
        return iso
    }
}

const BAG_STATUS_MAP = { BO: "CREATED", BS: "SEALED", BT: "IN TRANSIT", BD: "DELIVERED" }

// The accent blue the modernised tracking screens use throughout (see TrackAWB, ShipmentTraceDetail)
const ACCENT = "#3B82F6"

const Stat = ({ value, label }) => (
    <div>
        <div className="font-semibold text-ink">{value ?? "-"}</div>
        <div className="text-xs text-ink-muted">{label}</div>
    </div>
)

// A single bag's stat card — click to load & expand its own shipment/child-bag breakdown
const BagCard = ({ bag, expanded, onClick, children }) => (
    <div className="mb-2">
        <div
            role="button"
            onClick={onClick}
            className="rounded-xl border backdrop-blur-xl"
            style={{
                cursor: "pointer",
                backgroundColor: expanded ? "rgba(59,130,246,0.10)" : "color-mix(in srgb, var(--color-surface) 70%, transparent)",
                borderColor: expanded ? "rgba(59,130,246,0.4)" : "rgb(var(--overlay-rgb) / 0.08)",
            }}
        >
            <div className="flex items-center justify-between border-b border-[rgb(var(--overlay-rgb)/0.08)] px-4 py-2 font-bold text-ink">
                {bag.bagNo || "-"}
                <ChevronDown size={16} style={{ transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "none" }} />
            </div>
            <div className="flex flex-wrap gap-6 px-4 py-2">
                <Stat value={bag.source || "-"} label="Source" />
                <Stat value={bag.destination || "-"} label="Destination" />
                <Stat value={bag.shipments ?? 0} label="Shipments" />
                <Stat value={`${bag.totalWeightKg ?? 0} KG`} label="Total Weight" />
                {typeof bag.hubBags === "number" && <Stat value={bag.hubBags} label="Hub Bags" />}
            </div>
        </div>
        {expanded && children}
    </div>
)

const mapBagToCard = (b = {}) => ({
    bagNo: b.bag_no,
    totalWeightKg: b.total_weight ?? 0,
    shipments: b.shipment_count ?? b.total_shipments ?? 0,
    hubBags: b.child_bag_count ?? null,
    source: b.source_sc,
    destination: b.destination_sc,
    bag_shipments: b.bag_shipments || [],
})

const ShipmentIdTable = ({ ids = [] }) => (
    <div className="mb-2 overflow-hidden rounded-xl border border-[rgb(var(--overlay-rgb)/0.08)]" style={{ maxHeight: 220, overflowY: "auto" }}>
        <table className="table table-sm mb-0">
            <thead className="sticky top-0 bg-canvas">
                <tr><th className="text-center">Shipment ID / AWB</th></tr>
            </thead>
            <tbody>
                {ids.length > 0 ? ids.map((awb, i) => (
                    <tr key={i}><td className="text-center">{awb}</td></tr>
                )) : (
                    <tr><td className="text-center text-ink-muted">No shipments</td></tr>
                )}
            </tbody>
        </table>
    </div>
)

// One hop in a bag's movement timeline (mirrors the AWB status timeline, just for the bag)
const BagTimeline = ({ steps = [] }) => {
    if (steps.length === 0) return <div className="mb-2 text-xs text-ink-muted">No bag movement recorded</div>
    return (
        <div className="mb-2 flex flex-wrap gap-2">
            {steps.map((s, i) => (
                <div
                    key={i}
                    className="rounded-xl border px-3 py-2 text-center"
                    style={{
                        minWidth: 150,
                        borderColor: s.active ? ACCENT : "rgb(var(--overlay-rgb) / 0.08)",
                        borderWidth: s.active ? 2 : 1,
                        backgroundColor: "color-mix(in srgb, var(--color-surface) 70%, transparent)",
                    }}
                >
                    <span
                        className="badge mb-1"
                        style={{ backgroundColor: s.active ? "rgba(59,130,246,0.15)" : "rgb(var(--overlay-rgb) / 0.06)", color: s.active ? "var(--color-ink)" : "var(--color-ink-muted)" }}
                    >
                        {BAG_STATUS_MAP[s.status] || s.status || "-"}
                    </span>
                    <div className="text-xs font-semibold text-ink">{s.bag_manifest_no || "-"}</div>
                    <div className="text-xs text-ink-muted">{formatDateTime(s.created_at)}</div>
                    <div className="text-xs font-semibold text-ink">{s.current_service_center || "-"}</div>
                </div>
            ))}
        </div>
    )
}

// Recursively expandable child-bag card — clicking fetches that bag's own tracking via GET_BAG_TRACKING
const ChildBagCard = ({ bag }) => {
    const [expanded, setExpanded] = useState(false)
    const [childInfo, setChildInfo] = useState(null)
    const { apifunc: fetchBag, loading } = usePostApiCall()

    const onToggle = async () => {
        const next = !expanded
        setExpanded(next)
        if (next && !childInfo) {
            const res = await fetchBag(GET_BAG_TRACKING, { bag_no: bag.bagNo })
            setChildInfo(res)
        }
    }

    return (
        <BagCard bag={bag} expanded={expanded} onClick={onToggle}>
            <div className="pl-3 pt-2">
                {loading ? (
                    <div className="py-2 text-center"><Spinner size="sm" /></div>
                ) : (
                    <>
                        <ShipmentIdTable ids={bag.bag_shipments} />
                        <BagTimeline steps={(childInfo?.parent_bag_data?.bag_tracking || childInfo?.bag_data?.parent_bag_data?.bag_tracking || [])
                            .slice()
                            .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                            .map((s, i, arr) => ({ ...s, active: i === arr.length - 1 }))}
                        />
                        {(childInfo?.child_bag_data || []).map((cb, i) => (
                            <ChildBagCard key={cb.bag_no || i} bag={mapBagToCard(cb)} />
                        ))}
                    </>
                )}
            </div>
        </BagCard>
    )
}

const BagTrackingResult = ({ bagInfo, bagNo }) => {
    const parent = bagInfo?.parent_bag_data || {}
    const bagData = parent.bag_data || parent
    const bagShipments = parent.bag_shipments || []
    const bagTracking = (parent.bag_tracking || [])
        .slice()
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map((s, i, arr) => ({ ...s, active: i === arr.length - 1 }))
    const childBags = (bagInfo?.child_bag_data || []).map(mapBagToCard)

    return (
        <div>
            <div className="mt-3 border-b border-[rgb(var(--overlay-rgb)/0.08)] pb-2 font-semibold text-ink" style={{ fontSize: 18 }}>
                Bag Details - Bag ID : {bagNo}
            </div>

            <div className="flex flex-wrap gap-6 border-b border-[rgb(var(--overlay-rgb)/0.08)] py-3">
                <Stat value={bagData.source_sc} label="Source" />
                <Stat value={bagData.destination_sc} label="Destination" />
                <Stat value={bagData.total_weight} label="Total Weight" />
                <Stat value={bagData.total_shipments ?? bagShipments.length} label="Total Shipments" />
                <Stat value={bagData.child_bag_count} label="Hub Bags" />
            </div>

            <div className="border-b border-[rgb(var(--overlay-rgb)/0.08)] py-3">
                <BagTimeline steps={bagTracking} />
            </div>

            <div className="row mt-1 gap-y-3">
                <div className="col-12 col-md-4">
                    <div className="mb-1 text-xs font-semibold text-ink-muted">Shipments</div>
                    <ShipmentIdTable ids={bagShipments} />
                </div>
                <div className="col-12 col-md-8">
                    <div className="mb-1 text-xs font-semibold text-ink-muted">Bags</div>
                    <div className="scroll-slim" style={{ maxHeight: "50vh", overflowY: "auto" }}>
                        {childBags.length > 0 ? (
                            childBags.map((b, i) => <ChildBagCard key={b.bagNo || i} bag={b} />)
                        ) : (
                            <div className="text-xs text-ink-muted">No child bags</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BagTrackingResult
