import React from "react"
import { Modal, Button, Table, Badge } from "reactstrap"

const CODViewModal = ({ isOpen, toggle, data }) => {
    if (!data) return null

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="xl" centered>
            <div className="p-4 bg-white">
                {/* Header */}
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h4 className="fw-bold mb-1">Manifest Details</h4>
                        <span className="text-muted small">UTR: {data.utr_number || "N/A"} &nbsp;|&nbsp; Amount Received: ₹{data.amount_received?.toLocaleString() || 0}</span>
                    </div>
                    <button
                        onClick={toggle}
                        className="btn btn-danger d-flex align-items-center justify-content-center p-2 rounded-3"
                        style={{ width: "36px", height: "36px" }}
                    >
                        <i className="bx bx-x fs-4"></i>
                    </button>
                </div>

                {/* Manifest Breakdown */}
                {data.manifest_breakdown?.length > 0 ? (
                    data.manifest_breakdown.map((manifest, mIdx) => (
                        <div key={mIdx} className="mb-4">
                            {/* Manifest Header */}
                            <div className="d-flex align-items-center gap-3 mb-2 p-2 rounded-2" style={{ backgroundColor: "#f0f4ff", borderLeft: "4px solid #5b73e8" }}>
                                <div>
                                    <span className="fw-bold text-primary">{manifest.manifest_no}</span>
                                </div>
                                <div className="ms-auto">
                                    <span className="text-muted small me-3">Amount Allocated:</span>
                                    <span className="fw-semibold">₹{manifest.amount_allocated?.toLocaleString() || 0}</span>
                                </div>
                            </div>

                            {/* AWB Table */}
                            {manifest.awbs?.length > 0 ? (
                                <Table bordered hover size="sm" className="mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="text-center">#</th>
                                            <th>AWB No.</th>
                                            <th className="text-end">Actual Amount (₹)</th>
                                            <th className="text-end">Amount Paid (₹)</th>
                                            <th className="text-center">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manifest.awbs.map((awb, aIdx) => (
                                            <tr key={aIdx}>
                                                <td className="text-center text-muted">{aIdx + 1}</td>
                                                <td className="fw-semibold">{awb.awbno || "N/A"}</td>
                                                <td className="text-end">₹{awb.actual_amount?.toLocaleString() || 0}</td>
                                                <td className="text-end">₹{awb.amount_paid?.toLocaleString() || 0}</td>
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
                                            <td colSpan={2} className="fw-bold text-end">Total</td>
                                            <td className="text-end fw-bold">
                                                ₹{manifest.awbs.reduce((sum, a) => sum + (a.actual_amount || 0), 0).toLocaleString()}
                                            </td>
                                            <td className="text-end fw-bold">
                                                ₹{manifest.awbs.reduce((sum, a) => sum + (a.amount_paid || 0), 0).toLocaleString()}
                                            </td>
                                            <td></td>
                                        </tr>
                                    </tfoot>
                                </Table>
                            ) : (
                                <p className="text-muted text-center py-2">No AWBs found for this manifest.</p>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center text-muted py-4">
                        <i className="bx bx-info-circle fs-2 mb-2 d-block"></i>
                        No manifest breakdown data available.
                    </div>
                )}

                <div className="d-flex justify-content-end mt-3">
                    <Button color="secondary" onClick={toggle}>Close</Button>
                </div>
            </div>
        </Modal>
    )
}

export default CODViewModal
