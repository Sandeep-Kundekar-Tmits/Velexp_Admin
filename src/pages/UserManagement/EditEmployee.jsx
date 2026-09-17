import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Alert, Button, Modal, ModalBody, ModalFooter } from "@/components/ui"
import usePostApiCall from "../../hooks/usePostApiCall"
import { usePutApiCall } from "../../hooks/usePutApuCall"
import { GET_EMPLOYEE_DETAIL, UPDATE_EMPLOYEE } from "../../api"
import EmployeeForm from "../../components/Employee/EmployeeForm"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import { extractApiRecord } from "../../helpers/extractApiRecord"

const EditEmployee = () => {
    useEffect(() => { document.title = "Edit Employee" }, [])

    const navigate = useNavigate()
    const { id } = useParams()

    const { apifunc: getDetail, data: detailData, loading: detailLoading } = usePostApiCall()
    // toggle (navigate) only fires from inside the hook's own `ok` branch, so a
    // validation-error body never navigates away as if the update had succeeded.
    const { apifunc: updateEmployee, error, loading: updateLoading } = usePutApiCall("Employee Updated Successfully", () => navigate("/employees"))

    const [formData, setFormData] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})
    const [showErrors, setShowErrors] = useState(false)

    useEffect(() => { getDetail(GET_EMPLOYEE_DETAIL, { id }) }, [getDetail, id])

    useEffect(() => {
        if (detailData) setFormData(extractApiRecord(detailData, ["employee_code", "name"]))
    }, [detailData])

    useEffect(() => {
        if (error && typeof error === "object" && Object.keys(error).length > 0) {
            setFieldErrors(error)
            setShowErrors(true)
        }
    }, [error])

    const onSubmit = async () => {
        await updateEmployee(`${UPDATE_EMPLOYEE}${id}/`, formData)
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Edit Employee"
                extraFields={
                    <Button
                        className="table-action-btn table-action-btn-ghost"
                        onClick={() => navigate("/employees")}
                    >
                        <ArrowLeft aria-hidden="true" size={15} />
                        Back to List
                    </Button>
                }
            />
            <div className="container-fluid relative z-10 px-4 pb-4">
                {detailLoading ? (
                    <Loader message="Loading Employee…" fullscreen={false} />
                ) : (
                    <EmployeeForm
                        formData={formData}
                        setFormData={setFormData}
                        onSubmit={onSubmit}
                        loading={updateLoading}
                        submitLabel="Update Employee"
                        onCancel={() => navigate("/employees")}
                        isEdit
                    />
                )}
            </div>

            <Modal isOpen={showErrors} toggle={() => setShowErrors(false)}>
                <ModalBody>
                    {Object.entries(fieldErrors).map(([field, messages]) => (
                        <div key={field}>
                            {(Array.isArray(messages) ? messages : [messages]).map((message, index) => (
                                <Alert color="danger" key={`${field}-${index}`}>
                                    <strong>{field.replaceAll("_", " ")}:</strong> {message}
                                </Alert>
                            ))}
                        </div>
                    ))}
                </ModalBody>
                <ModalFooter>
                    <Button onClick={() => setShowErrors(false)}>Close</Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default EditEmployee
