import React, { useState } from "react";
import {
    Modal,
    ModalHeader,
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
import { useEffect } from "react";
import usePostApiCall from "../../hooks/usePostApiCall";
import { GET_DELIVERY_ATTEMPTS_REMARKS } from "../../api";
import moment from "moment";

const RtoApprovalModal = ({
    isOpen,
    toggle,
    awbNumber = "V01223455",
    historyData = [],
    onApprove,
    onCancel
}) => {
    const [remark, setRemark] = useState("");
    const [isRts, setIsRts] = useState(false);
    const [error, setError] = useState(false);

    const { apifunc: getHistory, data: historyResponse, loading } = usePostApiCall();

    useEffect(() => {
        if (isOpen && awbNumber) {
            getHistory(GET_DELIVERY_ATTEMPTS_REMARKS, { awbno: awbNumber });
        }
    }, [isOpen, awbNumber]);

    const historyItems = historyResponse || [];

    const handleApprove = () => {
        if (!remark.trim()) {
            setError(true);
            return;
        }
        setError(false);
        onApprove?.({ remark, isRts, });
        toggle();
    };

    const handleCancel = () => {
        onCancel?.();
        toggle();
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} size="lg" centered className="rto-approval-modal">
            <ModalBody className="p-0">
                <Row className="g-0">
                    {/* Left Column: Form */}
                    <Col md={6} className="border-end d-flex flex-column" style={{ height: "480px" }}>
                        <div className="border-bottom p-3">
                            <h3 className="fw-bold mb-0">RTO Approval</h3>
                        </div>

                        <div className="flex-grow-1 overflow-auto">
                            <div className="mb-2 border-bottom px-3 py-2">
                                <h4 className="fw-bold mb-0">{awbNumber}</h4>
                                <small className="text-muted fw-bold">AWB</small>
                            </div>

                            <FormGroup className="mb-3 px-3 mt-2">
                                <Label for="remark" className="text-muted fw-normal mb-1" style={{ fontSize: "14px" }}>
                                    Remark
                                </Label>
                                <Input
                                    type="textarea"
                                    id="remark"
                                    placeholder="Enter Remark.."
                                    rows="4"
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

                            <FormGroup check className="mb-2 ms-3 d-flex align-items-center">
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

                    {/* Right Column: History Table */}
                    <Col md={6} className="p-4 bg-light bg-opacity-10">
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
                                        // Empty rows to match visual style
                                        Array(7).fill(0).map((_, i) => (
                                            <tr key={i}>
                                                <td className="py-3 ps-3">&nbsp;</td>
                                                <td className="py-3">&nbsp;</td>
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

RtoApprovalModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    awbNumber: PropTypes.string,
    historyData: PropTypes.array,
    onApprove: PropTypes.func,
    onCancel: PropTypes.func
};

export default RtoApprovalModal;
