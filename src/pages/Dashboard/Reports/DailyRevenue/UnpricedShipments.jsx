// Unpriced shipments — shipments awaiting pricing (potential/claimed revenue not yet billed).
import { Card, CardBody } from "reactstrap"
import { MdWarningAmber } from "react-icons/md"
import { formatINR, formatInt } from "./revenueFormat"

const UnpricedShipments = ({ unpriced }) => {
    if (!unpriced) return null
    const customers = [...(unpriced.customers || [])].sort((a, b) => (b?.claimed_amount || 0) - (a?.claimed_amount || 0))

    return (
        <Card className="shadow-sm border-0 h-100 mb-4">
            <CardBody className="d-flex flex-column">
                <div className="d-flex align-items-center gap-2 mb-1">
                    <MdWarningAmber size={20} className="text-warning" />
                    <h6 className="fw-bold mb-0">Unpriced Shipments</h6>
                </div>
                <p className="text-muted small mb-3">Shipments awaiting pricing — potential revenue not yet captured</p>

                <div className="d-flex flex-wrap gap-2 mb-3">
                    <div className="px-3 py-2 rounded" style={{ background: "rgba(241,180,76,0.14)", color: "#d68a00" }}>
                        <div className="fw-bold" style={{ fontSize: 18, lineHeight: 1 }}>{formatInt(unpriced.shipments)}</div>
                        <div style={{ fontSize: 11 }}>Unpriced shipments</div>
                    </div>
                    <div className="px-3 py-2 rounded" style={{ background: "rgba(244,106,106,0.12)", color: "#f46a6a" }}>
                        <div className="fw-bold" style={{ fontSize: 18, lineHeight: 1 }}>{formatINR(unpriced.claimed_amount)}</div>
                        <div style={{ fontSize: 11 }}>Claimed amount</div>
                    </div>
                </div>

                <div style={{ overflowY: "auto", maxHeight: 280 }} className="mt-auto">
                    <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                            <tr>
                                <th>Customer</th>
                                <th className="text-end">Shipments</th>
                                <th className="text-end">Claimed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr><td colSpan={3} className="text-muted text-center py-3">No unpriced shipments.</td></tr>
                            ) : customers.map((c) => (
                                <tr key={c.name}>
                                    <td className="fw-semibold" style={{ fontSize: 13 }}>{c.name}</td>
                                    <td className="text-end" style={{ fontSize: 13 }}>{formatInt(c.shipments)}</td>
                                    <td className="text-end" style={{ fontSize: 13 }}>{formatINR(c.claimed_amount)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </CardBody>
        </Card>
    )
}

export default UnpricedShipments
