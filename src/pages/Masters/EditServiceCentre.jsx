import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Alert, Button, Modal, ModalBody, ModalFooter } from "@/components/ui"
import usePostApiCall from "../../hooks/usePostApiCall"
import { usePutApiCall } from "../../hooks/usePutApuCall"
import { GET_SERVICE_CENTRE_DETAIL, UPDATE_SERVICE_CENTRE } from "../../api"
import ServiceCentreForm from "../../components/Masters/ServiceCentreForm"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import { extractApiRecord } from "../../helpers/extractApiRecord"

const EditServiceCentre = () => {
    useEffect(() => { document.title = "Edit Service Centre" }, [])

    const navigate = useNavigate()
    const { id } = useParams()

    const { apifunc: getDetail, data: detailData, loading: detailLoading } = usePostApiCall()
    // toggle (navigate) only fires from inside the hook's own `ok` branch, so a
    // validation-error body never navigates away as if the update had succeeded.
    const { apifunc: updateServiceCentre, error, loading: updateLoading } = usePutApiCall("Service Centre Updated Successfully", () => navigate("/service-centres"))

    const [formData, setFormData] = useState({})
    const [subData, setSubData] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})
    const [showErrors, setShowErrors] = useState(false)

    useEffect(() => { getDetail(GET_SERVICE_CENTRE_DETAIL, { id }) }, [getDetail, id])

    useEffect(() => {
        if (error && typeof error === "object" && Object.keys(error).length > 0) {
            setFieldErrors(error)
            setShowErrors(true)
        }
    }, [error])

    useEffect(() => {
        if (detailData) {
            const record = extractApiRecord(detailData, ["service_center_code", "company_name"])
            const { subs, ...rest } = record || {}
            setFormData(rest || {})
            setSubData((Array.isArray(subs) && subs[0]) || {})
        }
    }, [detailData])

    const onSubmit = async () => {
        const updatedBy = JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id
        const payload = { ...formData, updated_by: updatedBy, subs: [{ ...subData }] }
        await updateServiceCentre(`${UPDATE_SERVICE_CENTRE}${id}/`, payload)
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Edit Service Centre"
                extraFields={
                    <Button
                        className="table-action-btn table-action-btn-ghost"
                        onClick={() => navigate("/service-centres")}
                    >
                        <ArrowLeft aria-hidden="true" size={15} />
                        Back to List
                    </Button>
                }
            />
            <div className="container-fluid relative z-10 px-4 pb-4">
                {detailLoading ? (
                    <Loader message="Loading Service Centre…" fullscreen={false} />
                ) : (
                    <ServiceCentreForm
                        formData={formData}
                        setFormData={setFormData}
                        subData={subData}
                        setSubData={setSubData}
                        onSubmit={onSubmit}
                        loading={updateLoading}
                        submitLabel="Update Service Centre"
                        onCancel={() => navigate("/service-centres")}
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

export default EditServiceCentre
