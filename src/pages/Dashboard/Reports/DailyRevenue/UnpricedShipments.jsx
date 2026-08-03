// Unpriced shipments — shipments awaiting pricing (potential/claimed revenue not yet billed).
import { Card, CardBody } from "@/components/ui"
import { MdWarningAmber } from "react-icons/md"
import { formatINR, formatInt } from "./revenueFormat"

const UnpricedShipments = ({ unpriced }) => {
    if (!unpriced) return null
    const customers = [...(unpriced.customers || [])].sort((a, b) => (b?.claimed_amount || 0) - (a?.claimed_amount || 0))

    return (
        <Card className="shadow-sm border-0 h-full mb-6">
            <CardBody className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <MdWarningAmber size={20} className="text-warning-500" />
                    <h6 className="font-bold mb-0">Unpriced Shipments</h6>
                </div>
                <p className="text-ink-muted text-xs mb-4">Shipments awaiting pricing — potential revenue not yet captured</p>

                <div className="flex flex-wrap gap-2 mb-4">
                    <div className="px-4 py-2 rounded" style={{ background: "rgba(241,180,76,0.14)", color: "#d68a00" }}>
                        <div className="font-bold" style={{ fontSize: 18, lineHeight: 1 }}>{formatInt(unpriced.shipments)}</div>
                        <div style={{ fontSize: 11 }}>Unpriced shipments</div>
                    </div>
                    <div className="px-4 py-2 rounded" style={{ background: "rgba(244,106,106,0.12)", color: "#f46a6a" }}>
                        <div className="font-bold" style={{ fontSize: 18, lineHeight: 1 }}>{formatINR(unpriced.claimed_amount)}</div>
                        <div style={{ fontSize: 11 }}>Claimed amount</div>
                    </div>
                </div>

                <div style={{ overflowY: "auto", maxHeight: 280 }} className="mt-auto">
                    <table className="table table-sm table-hover align-middle mb-0">
                        <thead className="table-light" style={{ position: "sticky", top: 0 }}>
                            <tr>
                                <th>Customer</th>
                                <th className="text-right">Shipments</th>
                                <th className="text-right">Claimed</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 ? (
                                <tr><td colSpan={3} className="text-ink-muted text-center py-4">No unpriced shipments.</td></tr>
                            ) : customers.map((c) => (
                                <tr key={c.name}>
                                    <td className="font-semibold" style={{ fontSize: 13 }}>{c.name}</td>
                                    <td className="text-right" style={{ fontSize: 13 }}>{formatInt(c.shipments)}</td>
                                    <td className="text-right" style={{ fontSize: 13 }}>{formatINR(c.claimed_amount)}</td>
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
