import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Button, Card, CardBody, CardHeader, Badge,
    Modal, ModalHeader, ModalBody, ModalFooter
} from "reactstrap";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { OPS_DISPUTES_BASE } from "../../api";
import { GridLoader } from "react-spinners";
import MainHeaderComp from "../../components/MainHeaderCom";

const STATUS_COLOR = { OPEN: "warning", SPL: "danger", CLOSED: "success" };

const DisputeDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const userId = useMemo(() => JSON.parse(localStorage.getItem("authUser"))?.user?.id, []);

    const { apifunc: fetchDetail, data, loading } = useGetApiCall();
    const { apifunc: closeDispute, loading: closeLoading } = usePostApiCall(null, "Dispute closed successfully");

    const [closeModal, setCloseModal] = useState(false);

    const reload = () => fetchDetail(`${OPS_DISPUTES_BASE}${id}/?employee_id=${userId}`);

    useEffect(() => {
        document.title = "Dispute Detail";
        reload();
    }, [id]);

    const dispute = data?.dispute;
    const tracking = useMemo(() => data?.tracking_history || [], [data]);

    const handleClose = async () => {
        const res = await closeDispute(`${OPS_DISPUTES_BASE}${id}/close/`, { employee_id: userId });
        if (res?.status === "success") {
            setCloseModal(false);
            reload();
        }
    };

    if (loading) return (
        <div className="d-flex justify-content-center mt-5">
            <GridLoader color="#556ee6" />
        </div>
    );

    if (!dispute) return (
        <div className="page-content">
            <p className="text-muted">Dispute not found or you do not have access.</p>
            <Button color="secondary" size="sm" onClick={() => navigate("/ops-disputes")}>
                Back to Disputes
            </Button>
        </div>
    );

    return (
        <div className="page-content">
            <MainHeaderComp
                title={`Dispute — ${dispute.awbno}`}
                subTitle={`ID #${dispute.id}`}
                extraFields={
                    <div className="d-flex gap-2 align-items-center">
                        <Badge color={STATUS_COLOR[dispute.dispute_status] || "secondary"} style={{ fontSize: "14px" }}>
                            {dispute.dispute_status}
                        </Badge>
                        {dispute.dispute_status === "OPEN" && (
                            <Button color="success" size="sm" onClick={() => setCloseModal(true)}>
                                Close Dispute
                            </Button>
                        )}
                        <Button color="secondary" size="sm" onClick={() => navigate("/ops-disputes")}>
                            Back
                        </Button>
                    </div>
                }
            />

            <div className="row mt-3">
                {/* Dispute Info */}
                <div className="col-md-6 mb-3">
                    <Card className="h-100">
                        <CardHeader><strong>Dispute Info</strong></CardHeader>
                        <CardBody>
                            <table className="table table-sm table-borderless mb-0">
                                <tbody>
                                    <tr>
                                        <td className="text-muted" style={{ width: "40%" }}>AWB</td>
                                        <td><strong>{dispute.awbno}</strong></td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Status</td>
                                        <td>
                                            <Badge color={STATUS_COLOR[dispute.dispute_status] || "secondary"}>
                                                {dispute.dispute_status}
                                            </Badge>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Marked By</td>
                                        <td>{dispute.marked_dis_by_name || "--"}</td>
                                    </tr>
                                    <tr>
                                        <td className="text-muted">Marked At</td>
                                        <td>{dispute.marked_dis_at ? new Date(dispute.marked_dis_at).toLocaleString() : "--"}</td>
                                    </tr>
                                    {dispute.marked_spl_by_name && (
                                        <>
                                            <tr>
                                                <td className="text-muted">Marked Lost By</td>
                                                <td>{dispute.marked_spl_by_name}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Marked Lost At</td>
                                                <td>{dispute.marked_spl_at ? new Date(dispute.marked_spl_at).toLocaleString() : "--"}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Lost Remark</td>
                                                <td>{dispute.spl_remark || "--"}</td>
                                            </tr>
                                        </>
                                    )}
                                    {dispute.closed_by_name && (
                                        <>
                                            <tr>
                                                <td className="text-muted">Closed By</td>
                                                <td>{dispute.closed_by_name}</td>
                                            </tr>
                                            <tr>
                                                <td className="text-muted">Closed At</td>
                                                <td>{dispute.closed_at ? new Date(dispute.closed_at).toLocaleString() : "--"}</td>
                                            </tr>
                                        </>
                                    )}
                                </tbody>
                            </table>
                        </CardBody>
                    </Card>
                </div>

                {/* Tagged Service Centers */}
                <div className="col-md-6 mb-3">
                    <Card className="h-100">
                        <CardHeader><strong>Tagged Service Centers</strong></CardHeader>
                        <CardBody>
                            {(dispute.service_centers || []).length === 0
                                ? <p className="text-muted mb-0">No service centers tagged.</p>
                                : (dispute.service_centers || []).map(sc => (
                                    <span key={sc.id} className="badge bg-info me-1 mb-1" style={{ fontSize: "13px" }}>
                                        {sc.service_center_code} — {sc.city}
                                    </span>
                                ))
                            }
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* History Entries */}
            {(dispute.history_entries || []).length > 0 && (
                <Card className="mb-3">
                    <CardHeader><strong>History Entries</strong></CardHeader>
                    <CardBody>
                        {dispute.history_entries.map(entry => (
                            <div key={entry.id} className="border-bottom pb-2 mb-3">
                                <div className="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>{entry.entered_by_name}</strong>
                                        {entry.entered_by_code && (
                                            <small className="text-muted ms-1">({entry.entered_by_code})</small>
                                        )}
                                    </div>
                                    <small className="text-muted">
                                        {entry.entered_at ? new Date(entry.entered_at).toLocaleString() : "--"}
                                    </small>
                                </div>
                                <p className="mb-1 mt-1">{entry.remark}</p>
                                {(entry.service_centers || []).length > 0 && (
                                    <div>
                                        {entry.service_centers.map(sc => (
                                            <span key={sc.id} className="badge bg-secondary me-1">
                                                {sc.service_center_code}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </CardBody>
                </Card>
            )}

            {/* Documents */}
            {(dispute.documents || []).length > 0 && (
                <Card className="mb-3">
                    <CardHeader><strong>Documents</strong></CardHeader>
                    <CardBody>
                        <div className="d-flex flex-wrap gap-2">
                            {dispute.documents.map(doc => (
                                <a
                                    key={doc.id}
                                    href={`http://velexp.com:8000${doc.file}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-outline-secondary btn-sm"
                                >
                                    <i className="bx bx-file me-1"></i>
                                    {doc.remark || "Document"}
                                    {doc.uploaded_by_name && (
                                        <small className="ms-1 text-muted">({doc.uploaded_by_name})</small>
                                    )}
                                </a>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* AWB Tracking Timeline */}
            {tracking.length > 0 && (
                <Card className="mb-3">
                    <CardHeader><strong>AWB Tracking Timeline</strong></CardHeader>
                    <CardBody>
                        <div style={{ maxHeight: "420px", overflowY: "auto" }}>
                            {tracking.map((t, i) => (
                                <div key={t.id} className="d-flex gap-3 mb-2">
                                    <div className="text-center" style={{ minWidth: "52px" }}>
                                        <span
                                            className={`badge rounded-pill ${
                                                t.status === "DIS" ? "bg-warning text-dark"
                                                : t.status === "SPL" ? "bg-danger"
                                                : "bg-primary"
                                            }`}
                                            style={{ fontSize: "11px" }}
                                        >
                                            {t.status}
                                        </span>
                                        {i < tracking.length - 1 && (
                                            <div style={{
                                                width: "2px", height: "24px",
                                                background: "#dee2e6", margin: "3px auto"
                                            }} />
                                        )}
                                    </div>
                                    <div className="flex-grow-1 pb-1">
                                        <div className="d-flex justify-content-between align-items-start">
                                            <span className="fw-medium">{t.remarks || "--"}</span>
                                            <small className="text-muted ms-2 text-nowrap">
                                                {t.status_date ? new Date(t.status_date).toLocaleString() : "--"}
                                            </small>
                                        </div>
                                        <small className="text-muted">
                                            {[t.employee_name, t.service_center, t.updated_via ? `via ${t.updated_via}` : null]
                                                .filter(Boolean).join(" · ")}
                                        </small>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardBody>
                </Card>
            )}

            {/* Close Dispute Confirm Modal */}
            <Modal isOpen={closeModal} toggle={() => setCloseModal(false)}>
                <ModalHeader toggle={() => setCloseModal(false)}>Close Dispute</ModalHeader>
                <ModalBody>
                    <p>Are you sure you want to close the dispute for AWB <strong>{dispute.awbno}</strong>?</p>
                    <p className="text-muted mb-0">
                        Closing will <strong>unfreeze tracking</strong> on this AWB. No further dispute actions will be possible.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setCloseModal(false)}>Cancel</Button>
                    <Button color="success" disabled={closeLoading} onClick={handleClose}>
                        {closeLoading ? "Closing..." : "Yes, Close Dispute"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default DisputeDetail;
