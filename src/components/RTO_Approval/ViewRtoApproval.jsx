import React from "react";
import {
    Modal,
    ModalHeader,
    ModalBody,
    Table,
    Button
} from "@/components/ui";
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
                <span className="font-bold">{awbNumber || "Shipment History"}</span>
            </ModalHeader>
            <ModalBody>
                <div className="table-responsive border rounded-3 bg-white" style={{ maxHeight: "400px", overflowY: "auto" }}>
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
                                        <td className="pl-4 py-2 text-ink-muted" style={{ fontSize: "14px" }}>
                                            {item.attempt_date ? moment(item.attempt_date).format("DD-MM-YYYY HH:mm") : "--"}
                                        </td>
                                        <td className="py-2 text-ink-muted" style={{ fontSize: "14px" }}>{item.customer_service_remark || "--"}</td>
                                    </tr>
                                ))
                            ) : (
                                Array(7).fill(0).map((_, i) => (
                                    <tr key={i}>
                                        <td className="py-4 pl-4 border-0">&nbsp;</td>
                                        <td className="py-4 border-0">&nbsp;</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>
                <div className="flex justify-end mt-4">
                    <Button color="secondary" onClick={toggle} size="sm" className="px-6">
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