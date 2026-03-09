import React from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    Table,
    Button
} from "reactstrap";
import PropTypes from "prop-types";
import { useEffect } from "react";
import usePostApiCall from "../../hooks/usePostApiCall";
import { GET_DELIVERY_ATTEMPTS_REMARKS } from "../../api";
import moment from "moment";

const ViewRtoApproval = ({ isOpen, toggle, awbNumber, serviceCenter }) => {
    const { apifunc: getHistory, data: historyResponse, loading } = usePostApiCall();

    useEffect(() => {
        if (isOpen && awbNumber) {
            const authUser = JSON.parse(localStorage.getItem("authUser"));
            const payload = {
                awbno: awbNumber,
                employee_id: authUser?.user?.id,
                service_center: serviceCenter
            };
            getHistory(GET_DELIVERY_ATTEMPTS_REMARKS, payload);
        }
    }, [isOpen, awbNumber, serviceCenter]);

    const historyItems = historyResponse || [];
    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="md">
            <ModalHeader toggle={toggle} className="border-bottom-0 pb-0 shadow-none">
                <span className="fw-bold">{awbNumber || "Shipment History"}</span>
            </ModalHeader>
            <ModalBody>
                <div className="table-responsive border rounded-3 bg-white" style={{ maxHeight: "400px", overflowY: "auto" }}>
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
                                        <td className="ps-3 py-2 text-muted" style={{ fontSize: "14px" }}>
                                            {item.attempt_date ? moment(item.attempt_date).format("DD-MM-YYYY HH:mm") : "--"}
                                        </td>
                                        <td className="py-2 text-muted" style={{ fontSize: "14px" }}>{item.customer_service_remark || "--"}</td>
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
                <div className="d-flex justify-content-end mt-3">
                    <Button color="secondary" onClick={toggle} size="sm" className="px-4">
                        Close
                    </Button>
                </div>
            </ModalBody>
        </Modal>
    );
};

ViewRtoApproval.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    toggle: PropTypes.func.isRequired,
    awbNumber: PropTypes.string,
    historyData: PropTypes.array
};

export default ViewRtoApproval;