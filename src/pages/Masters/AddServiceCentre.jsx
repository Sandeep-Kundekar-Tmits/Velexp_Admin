import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Alert, Button, Modal, ModalBody, ModalFooter } from "@/components/ui"
import usePostApiCall from "../../hooks/usePostApiCall"
import { ADD_SERVICE_CENTRE } from "../../api"
import ServiceCentreForm from "../../components/Masters/ServiceCentreForm"
import MainHeaderComp from "../../components/MainHeaderCom"

const AddServiceCentre = () => {
    useEffect(() => { document.title = "Add Service Centre" }, [])

    const navigate = useNavigate()
    // toggle only fires from inside the hook's own `ok` branch, so navigation only
    // happens on a real success -- a validation-error body (e.g. {"pincode": ["This
    // field is required."]}) used to also read as truthy here and navigate away as if
    // it had succeeded.
    const { apifunc: addServiceCentre, error, loading } = usePostApiCall(() => navigate("/service-centres"), "Service Centre Added Successfully")

    const [formData, setFormData] = useState({ is_active: true, branch_country: "India" })
    const [subData, setSubData] = useState({})
    const [fieldErrors, setFieldErrors] = useState({})
    const [showErrors, setShowErrors] = useState(false)

    useEffect(() => {
        if (error && typeof error === "object" && Object.keys(error).length > 0) {
            setFieldErrors(error)
            setShowErrors(true)
        }
    }, [error])

    const onSubmit = async () => {
        const createdBy = JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id
        const payload = { ...formData, created_by: createdBy, subs: [{ ...subData }] }
        await addServiceCentre(ADD_SERVICE_CENTRE, payload)
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Add Service Centre"
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
                <ServiceCentreForm
                    formData={formData}
                    setFormData={setFormData}
                    subData={subData}
                    setSubData={setSubData}
                    onSubmit={onSubmit}
                    loading={loading}
                    submitLabel="Create Service Centre"
                    onCancel={() => navigate("/service-centres")}
                />
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

export default AddServiceCentre
