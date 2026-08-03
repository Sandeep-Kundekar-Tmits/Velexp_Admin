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
} from "@/components/ui";
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
                <Row className="gap-0">
                    {/* Left Column: Form */}
                    <Col md={6} className="border-end flex flex-col" style={{ height: "480px" }}>
                        <div className="border-bottom p-4">
                            <h3 className="font-bold mb-0">RTO Approval</h3>
                        </div>

                        <div className="grow overflow-auto">
                            <div className="mb-2 border-bottom px-4 py-2">
                                <h4 className="font-bold mb-0">{awbNumber}</h4>
                                <small className="text-ink-muted font-bold">AWB</small>
                            </div>

                            <FormGroup className="mb-4 px-4 mt-2">
                                <Label for="remark" className="text-ink-muted font-normal mb-1" style={{ fontSize: "14px" }}>
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

                            <FormGroup check className="mb-2 ml-4 flex items-center">
                                <Input
                                    type="checkbox"
                                    id="markRts"
                                    className="mr-2"
                                    style={{ width: "20px", height: "20px", marginTop: "0", cursor: "pointer" }}
                                    checked={isRts}
                                    onChange={(e) => setIsRts(e.target.checked)}
                                />
                                <Label for="markRts" check className="font-bold mb-0" style={{ fontSize: "16px", cursor: "pointer" }}>
                                    Mark RTS
                                </Label>
                            </FormGroup>
                        </div>

                        <div className="flex gap-4 px-4 py-4 border-top bg-canvas bg-opacity-10">
                            <Button
                                color="danger"
                                className="grow py-2 font-bold"
                                style={{ borderRadius: "8px" }}
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                            <Button
                                color="primary"
                                className="grow py-2 font-bold"
                                style={{ backgroundColor: "#0066b2", borderColor: "#0066b2", borderRadius: "8px" }}
                                onClick={handleApprove}
                            >
                                {isRts ? "Approve" : "Remark"}
                            </Button>
                        </div>
                    </Col>

                    {/* Right Column: History Table */}
                    <Col md={6} className="p-6 bg-canvas bg-opacity-10">
                        <div className="table-responsive border rounded-3 bg-white" style={{ height: "410px", overflowY: "auto" }}>
                            <Table className="mb-0 align-middle">
                                <thead className="bg-canvas">
                                    <tr>
                                        <th className="border-bottom-0 py-2 pl-4" style={{ width: "40%" }}>Date</th>
                                        <th className="border-bottom-0 py-2">Remark</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan="2" className="text-center py-6 text-ink-muted">Loading history...</td>
                                        </tr>
                                    ) : historyItems.length > 0 ? (
                                        historyItems.map((item, index) => (
                                            <tr key={index}>
                                                <td className="pl-4 py-2 text-ink-muted" style={{ fontSize: "13px" }}>
                                                    {item.attempt_date ? moment(item.attempt_date).format("DD-MM-YYYY HH:mm") : "--"}
                                                </td>
                                                <td className="py-2 text-ink-muted" style={{ fontSize: "13px" }}>{item.customer_service_remark || "--"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        // Empty rows to match visual style
                                        Array(7).fill(0).map((_, i) => (
                                            <tr key={i}>
                                                <td className="py-4 pl-4">&nbsp;</td>
                                                <td className="py-4">&nbsp;</td>
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
