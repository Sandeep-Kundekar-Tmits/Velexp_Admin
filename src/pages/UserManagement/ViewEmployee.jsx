import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, UserX, UserCheck, History } from "lucide-react"
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem } from "@/components/ui"
import usePostApiCall from "../../hooks/usePostApiCall"
import { GET_EMPLOYEE_DETAIL } from "../../api"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import { FaUserEdit } from "react-icons/fa"
import { extractApiRecord } from "../../helpers/extractApiRecord"
import { formatDisplayDate } from "../../helpers/formatDisplayDate"
import MarkExitModal from "../../components/UserManagement/MarkExitModal"
import ReverseExitModal from "../../components/UserManagement/ReverseExitModal"
import ExitHistoryModal from "../../components/UserManagement/ExitHistoryModal"

const ViewEmployee = () => {
    useEffect(() => { document.title = "View Employee" }, [])

    const { id } = useParams()
    const navigate = useNavigate()
    const { apifunc: getDetail, data, loading } = usePostApiCall()
    const [employee, setEmployee] = useState({})
    const [showMarkExit, setShowMarkExit] = useState(false)
    const [showReverseExit, setShowReverseExit] = useState(false)
    const [showExitHistory, setShowExitHistory] = useState(false)

    // Memoized so the effect below (and MarkExitModal's onSuccess={reload})
    // don't re-fire/re-render on every render the way a plain inline
    // function recreated each time would.
    const reload = useCallback(() => getDetail(GET_EMPLOYEE_DETAIL, { id }), [getDetail, id])

    useEffect(() => { reload() }, [reload])

    useEffect(() => { setEmployee(extractApiRecord(data, ["employee_code", "name", "first_name"])) }, [data])

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Employee Profile"
                extraFields={
                    <div className="flex items-center gap-2">
                        <Button
                            className="table-action-btn table-action-btn-ghost"
                            onClick={() => navigate("/employees")}
                        >
                            <ArrowLeft aria-hidden="true" size={15} />
                            Back to List
                        </Button>
                        <Button color="primary" className="flex items-center gap-2" onClick={() => navigate(`/employees/edit/${id}`)}>
                            Edit Employee
                            <FaUserEdit size={16} />
                        </Button>
                        <Button color="secondary" className="flex items-center gap-2" onClick={() => setShowExitHistory(true)}>
                            Exit History
                            <History size={16} />
                        </Button>
                        {employee?.is_active ? (
                            <Button color="danger" className="flex items-center gap-2" onClick={() => setShowMarkExit(true)}>
                                Mark Exit
                                <UserX size={16} />
                            </Button>
                        ) : (
                            <Button color="success" className="flex items-center gap-2" onClick={() => setShowReverseExit(true)}>
                                Reverse Exit
                                <UserCheck size={16} />
                            </Button>
                        )}
                    </div>
                }
            />

            <div className="container-fluid relative z-10 px-4 pb-4">
                {loading ? (
                    <Loader message="Loading Employee…" fullscreen={false} />
                ) : (
                    <Card className="mb-4 overflow-hidden">
                        <CardHeader className="border-b border-[rgb(var(--overlay-rgb)/0.08)] bg-[rgb(var(--overlay-rgb)/0.03)] py-3">
                            <CardTitle tag="h4" className="m-0 flex items-center gap-2 text-[13px] font-semibold text-ink">
                                <i className="fas fa-user-circle mr-2 text-ink"></i>
                                Employee Profile
                            </CardTitle>
                        </CardHeader>
                        <CardBody className="p-0">
                            <ListGroup flush>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Employee Code</span>
                                    <span className="text-ink">{employee?.employee_code || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Name</span>
                                    <span className="text-ink">{employee?.name || [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Email</span>
                                    <span className="text-ink">{employee?.email || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Phone</span>
                                    <span className="text-ink">{employee?.mobile_no || employee?.phone || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Designation</span>
                                    <span className="text-ink">{employee?.designation_name || employee?.designation || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Department</span>
                                    <span className="text-ink">{employee?.department_name || employee?.department || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Service Centre</span>
                                    <span className="text-ink">{employee?.service_center_name || employee?.service_center || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Is Active</span>
                                    <Badge color={employee?.is_active ? "success" : "secondary"} pill>{employee?.is_active ? "Yes" : "No"}</Badge>
                                </ListGroupItem>
                                {/* Exit fields are read-only everywhere except mark-exit itself --
                                    only shown once the employee actually has one on record. */}
                                {employee?.date_of_exit && (
                                    <>
                                        <ListGroupItem className="flex justify-between items-center p-4">
                                            <span className="font-bold text-ink-muted">Date of Exit</span>
                                            <span className="text-ink">{formatDisplayDate(employee.date_of_exit) || employee.date_of_exit}</span>
                                        </ListGroupItem>
                                        <ListGroupItem className="flex justify-between items-center p-4">
                                            <span className="font-bold text-ink-muted">Exit Remark</span>
                                            <span className="text-ink">{employee?.exit_remark || "—"}</span>
                                        </ListGroupItem>
                                        <ListGroupItem className="flex justify-between items-center p-4">
                                            <span className="font-bold text-ink-muted">Exit Marked By</span>
                                            <span className="text-ink">{employee?.exit_marked_by || "—"}</span>
                                        </ListGroupItem>
                                        <ListGroupItem className="flex justify-between items-center p-4">
                                            <span className="font-bold text-ink-muted">Exit Marked At</span>
                                            <span className="text-ink">{formatDisplayDate(employee?.exit_marked_at) || employee?.exit_marked_at || "—"}</span>
                                        </ListGroupItem>
                                    </>
                                )}
                            </ListGroup>
                        </CardBody>
                    </Card>
                )}
            </div>

            <MarkExitModal
                employee={employee}
                isOpen={showMarkExit}
                setIsOpen={setShowMarkExit}
                onSuccess={reload}
            />
            <ReverseExitModal
                employee={employee}
                isOpen={showReverseExit}
                setIsOpen={setShowReverseExit}
                onSuccess={reload}
            />
            <ExitHistoryModal
                employeeCode={employee?.employee_code}
                isOpen={showExitHistory}
                setIsOpen={setShowExitHistory}
            />
        </div>
    )
}

export default ViewEmployee
