// Revenue by source — how today's gross is composed across data sources
// (computed / billing / stored / unpriced).
import { Card, CardBody } from "reactstrap"
import { barWidth, formatINR, formatInt } from "./revenueFormat"

const SRC_COLORS = {
    computed: "#556ee6",
    billing: "#34c38f",
    stored: "#f1b44c",
    unpriced: "#74788d",
}
const labelOf = (s) => (s || "").charAt(0).toUpperCase() + (s || "").slice(1)

const RevenueBySource = ({ rows = [] }) => {
    if (!rows.length) return null
    const maxGross = rows.reduce((m, r) => Math.max(m, Number(r.gross) || 0), 0)

    return (
        <Card className="shadow-sm border-0 h-100 mb-4">
            <CardBody>
                <h6 className="fw-bold mb-1">Revenue by Source</h6>
                <p className="text-muted small mb-3">Where today&apos;s gross revenue is computed from</p>

                {rows.map((r) => {
                    const color = SRC_COLORS[r.source] || "#556ee6"
                    return (
                        <div key={r.source} className="mb-3">
                            <div className="d-flex justify-content-between small mb-1">
                                <span className="fw-semibold" style={{ color }}>{labelOf(r.source)}</span>
                                <span className="text-muted">{formatINR(r.gross)} · {formatInt(r.shipments)} shp</span>
                            </div>
                            <div style={{ background: "#f1f1f5", borderRadius: 4, height: 8 }}>
                                <div style={{ width: `${barWidth(r.gross, maxGross)}%`, background: color, height: 8, borderRadius: 4, transition: "width .4s ease" }} />
                            </div>
                        </div>
                    )
                })}
            </CardBody>
        </Card>
    )
}

export default RevenueBySource
