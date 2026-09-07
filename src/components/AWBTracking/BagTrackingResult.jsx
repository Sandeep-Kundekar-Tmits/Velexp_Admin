import { useState } from "react"
import { Badge, Spinner } from "reactstrap"
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

const Stat = ({ value, label }) => (
    <div>
        <div className="fw-semibold text-dark">{value ?? "-"}</div>
        <div className="text-muted small">{label}</div>
    </div>
)

// A single bag's stat card — click to load & expand its own shipment/child-bag breakdown
const BagCard = ({ bag, expanded, onClick, children }) => (
    <div className="mb-2">
        <div
            role="button"
            onClick={onClick}
            className={`border rounded ${expanded ? "bg-primary bg-opacity-10 border-primary" : "bg-white"}`}
            style={{ cursor: "pointer" }}
        >
            <div className="px-3 py-2 border-bottom fw-bold d-flex justify-content-between align-items-center">
                {bag.bagNo || "-"}
                <ChevronDown size={16} style={{ transition: "transform .15s", transform: expanded ? "rotate(180deg)" : "none" }} />
            </div>
            <div className="px-3 py-2 d-flex flex-wrap gap-4">
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
    <div className="border rounded overflow-hidden mb-2" style={{ maxHeight: 220, overflowY: "auto" }}>
        <table className="table table-sm table-bordered mb-0">
            <thead className="table-light sticky-top">
                <tr><th className="text-center">Shipment ID / AWB</th></tr>
            </thead>
            <tbody>
                {ids.length > 0 ? ids.map((awb, i) => (
                    <tr key={i}><td className="text-center">{awb}</td></tr>
                )) : (
                    <tr><td className="text-center text-muted">No shipments</td></tr>
                )}
            </tbody>
        </table>
    </div>
)

// One hop in a bag's movement timeline (mirrors the AWB status timeline, just for the bag)
const BagTimeline = ({ steps = [] }) => {
    if (steps.length === 0) return <div className="text-muted small mb-2">No bag movement recorded</div>
    return (
        <div className="d-flex flex-wrap gap-2 mb-2">
            {steps.map((s, i) => (
                <div key={i} className={`border rounded px-3 py-2 text-center ${s.active ? "border-primary border-2" : ""}`} style={{ minWidth: 150 }}>
                    <Badge color={s.active ? "primary" : "secondary"} className="mb-1">
                        {BAG_STATUS_MAP[s.status] || s.status || "-"}
                    </Badge>
                    <div className="small fw-semibold">{s.bag_manifest_no || "-"}</div>
                    <div className="small text-muted">{formatDateTime(s.created_at)}</div>
                    <div className="small fw-semibold">{s.current_service_center || "-"}</div>
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
            <div className="ps-3 pt-2">
                {loading ? (
                    <div className="text-center py-2"><Spinner size="sm" /></div>
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
            <div className="mt-3 border-bottom pb-2 fw-semibold" style={{ fontSize: 18 }}>
                Bag Details - Bag ID : {bagNo}
            </div>

            <div className="d-flex flex-wrap gap-4 border-bottom py-3">
                <Stat value={bagData.source_sc} label="Source" />
                <Stat value={bagData.destination_sc} label="Destination" />
                <Stat value={bagData.total_weight} label="Total Weight" />
                <Stat value={bagData.total_shipments ?? bagShipments.length} label="Total Shipments" />
                <Stat value={bagData.child_bag_count} label="Hub Bags" />
            </div>

            <div className="py-3 border-bottom">
                <BagTimeline steps={bagTracking} />
            </div>

            <div className="row g-3 mt-1">
                <div className="col-12 col-md-4">
                    <div className="fw-semibold small text-muted mb-1">Shipments</div>
                    <ShipmentIdTable ids={bagShipments} />
                </div>
                <div className="col-12 col-md-8">
                    <div className="fw-semibold small text-muted mb-1">Bags</div>
                    <div style={{ maxHeight: "50vh", overflowY: "auto" }}>
                        {childBags.length > 0 ? (
                            childBags.map((b, i) => <ChildBagCard key={b.bagNo || i} bag={b} />)
                        ) : (
                            <div className="text-muted small">No child bags</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default BagTrackingResult
