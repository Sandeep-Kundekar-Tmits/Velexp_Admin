import React, { useState } from "react"
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Row, Col, Input, Label } from "reactstrap"
import ToasterProvider from "../../helpers/ToasterProvider"
import axios from "axios"
import { COD_RECONCILIATION, COD_RECONCILIATION_APPROVE } from "../../api"

const CODRejectModal = ({ isOpen, toggle, data, refreshData }) => {
    const [remark, setRemark] = useState("")
    const [loading, setLoading] = useState(false)
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    // Map manifest_amount – in mockup sum up allocated amounts or similar
    const totalActual = data?.manifest_breakdown?.reduce((acc, manifest) => {
        return acc + (manifest.awbs?.reduce((awbAcc, awb) => awbAcc + (awb.actual_amount || 0), 0) || 0)
    }, 0) || 0

    const handleAdjustment = async () => {
        if (!remark.trim()) {
            ErrorToaster("Please enter a remark before submitting.")
            return
        }

        setLoading(true)
        try {
            // Using the specific dispute endpoint: POST accountant-approval/{id}/dispute/
            const url = `${COD_RECONCILIATION_APPROVE}/${data.id}/dispute/`
            const payload = {
                remark: remark
            }
            const response = await axios.post(url, payload)
            if (response.status === 200 || response.status === 201) {
                SucceesToaster("Dispute request submitted successfully")
                refreshData()
                toggle()
                setRemark("")
            } else {
                ErrorToaster("Failed to submit dispute request")
            }
        } catch (error) {
            console.error("Error submitting dispute action:", error)
            ErrorToaster("An error occurred while submitting the dispute")
        } finally {
            setLoading(false)
        }
    }

    if (!data) return null

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered className="rounded-4 overflow-hidden">
            <div className="p-4 bg-white position-relative">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h3 className="fw-bold mb-0">COD Details</h3>
                    <button 
                        onClick={toggle} 
                        className="btn btn-danger d-flex align-items-center justify-content-center p-2 rounded-3 shadow-sm"
                        style={{ width: "38px", height: "38px" }}
                    >
                        <i className="bx bx-x fs-4"></i>
                    </button>
                </div>

                <Row className="mb-2 g-3 text-dark">
                    <Col md={6}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">region</span>
                            <span className="text-muted small">{data.region || "Region"}</span>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">service_centre</span>
                            <span className="text-muted small">{data.service_centre || "Service Centre"}</span>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">manifest_no</span>
                            <span className="text-muted small">{data.manifest_no || data.manifests_covered || "Manifest no"}</span>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">utr_no</span>
                            <span className="text-muted small">{data.utr_no || data.utr_number || "UTR No."}</span>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">date</span>
                            <span className="text-muted small">{data.date || (data.created_at ? new Date(data.created_at).toLocaleDateString() : "Date")}</span>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">manifest_amount</span>
                            <span className="text-muted small">{data.manifest_amount || totalActual.toLocaleString() || "Manifest Amount"}</span>
                        </div>
                    </Col>
                    <Col md={6}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">amount_received</span>
                            <span className="text-muted small">{data.amount_received || "Amount Received"}</span>
                        </div>
                    </Col>
                    <Col md={12}>
                        <div className="d-flex flex-column">
                            <span className="fw-bold">remark</span>
                            <span className="text-muted small">{data.remark || "Remark"}</span>
                        </div>
                    </Col>
                </Row>

                <hr className="my-3" />

                <div className="mb-3">
                    <Label className="text-muted mb-1 small">Remark</Label>
                    <Input
                        type="textarea"
                        placeholder="Write Remark...."
                        rows="3"
                        className="bg-white border-secondary-subtle p-2 rounded-3 small"
                        style={{ resize: "none", borderColor: "#ced4da" }}
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                    />
                </div>

                <div className="d-flex justify-content-end mt-3">
                    <Button 
                        color="danger" 
                        className="px-5 py-2 fw-bold rounded-3 shadow-sm" 
                        style={{ backgroundColor: "#ff3d3d", border: "none" }}
                        onClick={handleAdjustment}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "Request Adjustment"}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}

export default CODRejectModal
