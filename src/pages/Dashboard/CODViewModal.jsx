import React from "react"
import { Modal, Button, Table, Badge } from "@/components/ui"

const CODViewModal = ({ isOpen, toggle, data }) => {
    if (!data) return null

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <div className="p-6 bg-white">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h4 className="font-bold mb-1">Manifest Details</h4>
                        <span className="text-ink-muted text-xs">UTR: {data.utr_number || "N/A"} &nbsp;|&nbsp; Amount Received: ₹{data.amount_received?.toLocaleString() || 0}</span>
                    </div>
                    <button
                        onClick={toggle}
                        className="btn btn-danger flex items-center justify-center p-2 rounded-3"
                        style={{ width: "36px", height: "36px" }}
                    >
                        <i className="bx bx-x fs-4"></i>
                    </button>
                </div>

                {/* Manifest Breakdown */}
                {data.manifest_breakdown?.length > 0 ? (
                    data.manifest_breakdown.map((manifest, mIdx) => (
                        <div key={mIdx} className="mb-6">
                            {/* Manifest Header */}
                            <div className="flex items-center gap-4 mb-2 p-2 rounded-2" style={{ backgroundColor: "#f0f4ff", borderLeft: "4px solid #5b73e8" }}>
                                <div>
                                    <span className="font-bold text-brand-500">{manifest.manifest_no}</span>
                                </div>
                                <div className="ml-auto">
                                    <span className="text-ink-muted text-xs mr-4">Amount Allocated:</span>
                                    <span className="font-semibold">₹{manifest.amount_allocated?.toLocaleString() || 0}</span>
                                </div>
                            </div>

                            {/* AWB Table */}
                            {manifest.awbs?.length > 0 ? (
                                <Table bordered hover size="sm" className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center">#</th>
                                            <th>AWB No.</th>
                                            <th className="text-right">Actual Amount (₹)</th>
                                            <th className="text-right">Amount Paid (₹)</th>
                                            <th className="text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manifest.awbs.map((awb, aIdx) => (
                                            <tr key={aIdx}>
                                                <td className="text-center text-ink-muted">{aIdx + 1}</td>
                                                <td className="font-semibold">{awb.awbno || "N/A"}</td>
                                                <td className="text-right">₹{awb.actual_amount?.toLocaleString() || 0}</td>
                                                <td className="text-right">₹{awb.amount_paid?.toLocaleString() || 0}</td>
                                                <td className="text-center">
                                                    <Badge
                                                        color={awb.is_completed ? "success" : "warning"}
                                                        className="px-2 py-1"
                                                        style={{ fontSize: "11px" }}
                                                    >
                                                        {awb.is_completed ? "Completed" : "Pending"}
                                                    </Badge>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="table-light">
                                        <tr>
                                            <td colSpan={2} className="font-bold text-right">Total</td>
                                            <td className="text-right font-bold">
                                                ₹{manifest.awbs.reduce((sum, a) => sum + (a.actual_amount || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="text-right font-bold">
                                                ₹{manifest.awbs.reduce((sum, a) => sum + (a.amount_paid || 0), 0).toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            ) : (
                                <p className="text-ink-muted text-center py-2">No AWBs found for this manifest.</p>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-ink-muted py-6">
                        <i className="bx bx-info-circle fs-2 mb-2 block"></i>
                        No manifest breakdown data available.
                    </div>
                )}

                <div className="flex justify-end mt-4">
                    <Button color="secondary" onClick={toggle}>Close</Button>
                </div>
            </div>
        </Modal>
    )
}

export default CODViewModal
