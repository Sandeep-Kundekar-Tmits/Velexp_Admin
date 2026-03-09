import {
    Modal,
    ModalBody,
    Button,
    Row,
    Col,
    Input,
    Label,
    FormGroup,
    Table,
    FormFeedback
} from "reactstrap";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import usePostApiCall from "../../hooks/usePostApiCall";
import { GET_DELIVERY_ATTEMPTS_REMARKS } from "../../api";
import moment from "moment";

const RtoBulkApprovalModal = ({
    isOpen,
    toggle,
    selectedShipments = [],
    onApprove,
    onCancel
}) => {
    const [remark, setRemark] = useState("");
    const [isRts, setIsRts] = useState(false);
    const [activeAwbIndex, setActiveAwbIndex] = useState(0);
    const [error, setError] = useState(false);

    const activeShipment = useMemo(() => {
        return selectedShipments[activeAwbIndex] || null;
    }, [selectedShipments, activeAwbIndex]);

    const { apifunc: getHistory, data: historyResponse, loading } = usePostApiCall();

    useEffect(() => {
        if (isOpen && activeShipment) {
            const authUser = JSON.parse(localStorage.getItem("authUser"));
            const payload = {
                awbno: activeShipment.awbno,
            };
            getHistory(GET_DELIVERY_ATTEMPTS_REMARKS, payload);
        }
    }, [isOpen, activeShipment]);

    const historyItems = historyResponse || [];

    const handleApprove = () => {
        if (!remark.trim()) {
            setError(true);
            return;
        }
        setError(false);
        onApprove?.({ remark, isRts, shipments: selectedShipments });
        toggle();
    };

    const handleCancel = () => {
        onCancel?.();
        toggle();
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered className="rto-bulk-approval-modal">
            <ModalBody className="p-0">
                <Row className="g-0">
                    {/* Left Column: Shipment List & Feedback */}
                    <Col md={6} className="border-end d-flex flex-column" style={{ height: "480px" }}>
                        <div className="border-bottom p-3">
                            <h3 className="fw-bold mb-0">RTO Bulk Approval</h3>
                        </div>

                        <div className="flex-grow-1 overflow-auto p-3">
                            <div className="border rounded-3 bg-white mb-3" style={{ maxHeight: "180px", overflowY: "auto" }}>
                                <Table hover className="mb-0 align-middle">
                                    <thead className="bg-light sticky-top">
                                        <tr>
                                            <th className="py-2 ps-3 text-center border-bottom">Shipment ID/AWB</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedShipments.map((shipment, index) => (
                                            <tr
                                                key={index}
                                                onClick={() => setActiveAwbIndex(index)}
                                                style={{ cursor: "pointer", backgroundColor: activeAwbIndex === index ? "#e7f1ff" : "transparent" }}
                                            >
                                                <td className="text-center py-2 text-muted fw-bold" style={{ fontSize: "14px" }}>
                                                    {shipment.awbno || shipment.id}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            </div>

                            <FormGroup className="mb-3">
                                <Label for="remark" className="text-muted fw-normal mb-1" style={{ fontSize: "14px" }}>
                                    Remark
                                </Label>
                                <Input
                                    type="textarea"
                                    id="remark"
                                    placeholder="Enter Remark.."
                                    rows="3"
                                    style={{ borderRadius: "8px", resize: "none" }}
                                    value={remark}
                                    onChange={(e) => {
                                        setRemark(e.target.value);
                                        if (e.target.value.trim()) setError(false);
                                    }}
                                    invalid={error}
                                />
                                <FormFeedback>Remark is compulsory</FormFeedback>
                            </FormGroup>

                            <FormGroup check className="mb-2 d-flex align-items-center">
                                <Input
                                    type="checkbox"
                                    id="markRts"
                                    className="me-2"
                                    style={{ width: "20px", height: "20px", marginTop: "0", cursor: "pointer" }}
                                    checked={isRts}
                                    onChange={(e) => setIsRts(e.target.checked)}
                                />
                                <Label for="markRts" check className="fw-bold mb-0" style={{ fontSize: "16px", cursor: "pointer" }}>
                                    Mark RTS
                                </Label>
                            </FormGroup>
                        </div>

                        <div className="d-flex gap-3 px-3 py-3 border-top bg-light bg-opacity-10">
                            <Button
                                color="danger"
                                className="flex-grow-1 py-2 fw-bold"
                                style={{ borderRadius: "8px" }}
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                className="flex-grow-1 py-2 fw-bold"
                                style={{ backgroundColor: "#0066b2", borderColor: "#0066b2", borderRadius: "8px" }}
                                onClick={handleApprove}
                            >
                                {isRts ? "Approve" : "Remark"}
                            </Button>
                        </div>
                    </Col>

                    {/* Right Column: Active Shipment History */}
                    <Col md={6} className="p-4 bg-light bg-opacity-10">
                        <div className="mb-3 text-center">
                            <h5 className="fw-bold mb-0 text-uppercase letter-spacing-1">
                                {activeShipment ? (activeShipment.awbno || `ID: ${activeShipment.id}`) : "Select a Shipment"}
                            </h5>
                        </div>

                        <div className="table-responsive border rounded-3 bg-white" style={{ height: "410px", overflowY: "auto" }}>
                            <Table className="mb-0 align-middle">
                                <thead className="bg-light">
                                    <tr>
                                        <th className="border-bottom-0 py-2 ps-3" style={{ width: "40%" }}>Date</th>
                                        <th className="border-bottom-0 py-2">Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="2" className="text-center py-4 text-muted">Loading history...</td>
                                        </tr>
                                    ) : historyItems.length > 0 ? (
                                        historyItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="ps-3 py-2 text-muted" style={{ fontSize: "13px" }}>
                                                    {item.attempt_date ? moment(item.attempt_date).format("DD-MM-YYYY HH:mm") : "--"}
                                                </td>
                                                <td className="py-2 text-muted" style={{ fontSize: "13px" }}>{item.customer_service_remark || "--"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        Array(7).fill(0).map((_, i) => (
                                            <tr key={i}>
                                                <td className="py-3 ps-3 border-0">&nbsp;</td>
                                                <td className="py-3 border-0">&nbsp;</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </Table>
                        </div>
                    </Col>
                </Row>
            </ModalBody>
        </Modal>
    );
};

RtoBulkApprovalModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    selectedShipments: PropTypes.array,
    onApprove: PropTypes.func,
    onCancel: PropTypes.func
};

export default RtoBulkApprovalModal;
