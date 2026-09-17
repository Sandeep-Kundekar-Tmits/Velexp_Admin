import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, ListGroup, ListGroupItem } from "@/components/ui"
import usePostApiCall from "../../hooks/usePostApiCall"
import { GET_EMPLOYEE_DETAIL } from "../../api"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import { FaUserEdit } from "react-icons/fa"
import { extractApiRecord } from "../../helpers/extractApiRecord"

const ViewEmployee = () => {
    useEffect(() => { document.title = "View Employee" }, [])

    const { id } = useParams()
    const navigate = useNavigate()
    const { apifunc: getDetail, data, loading } = usePostApiCall()
    const [employee, setEmployee] = useState({})

    useEffect(() => { getDetail(GET_EMPLOYEE_DETAIL, { id }) }, [getDetail, id])

    useEffect(() => { setEmployee(extractApiRecord(data, ["employee_code", "name"])) }, [data])

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
                    </div>
                }
            />

            <div className="container-fluid relative z-10 px-4 pb-4">
                {loading ? (
                    <Loader message="Loading Employee…" fullscreen={false} />
                ) : (
                    <Card className="mb-4 overflow-hidden">
                        <CardHeader className="border-b border-white/8 bg-white/3 py-3">
                            <CardTitle tag="h4" className="m-0 flex items-center gap-2 text-[13px] font-semibold text-white">
                                <i className="fas fa-user-circle mr-2 text-white"></i>
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
                                    <span className="text-ink">{employee?.name || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Email</span>
                                    <span className="text-ink">{employee?.email || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Phone</span>
                                    <span className="text-ink">{employee?.phone || "—"}</span>
                                </ListGroupItem>
                                <ListGroupItem className="flex justify-between items-center p-4">
                                    <span className="font-bold text-ink-muted">Designation</span>
                                    <span className="text-ink">{employee?.designation || "—"}</span>
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
                            </ListGroup>
                        </CardBody>
                    </Card>
                )}
            </div>
        </div>
    )
}

export default ViewEmployee
