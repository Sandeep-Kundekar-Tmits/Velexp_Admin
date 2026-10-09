import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/ui"
import TabProvider from "../../components/Table/TabProvider"
import usePostFileApicall from "../../hooks/usePostFileApicall"
import { ADD_EMPLOYEE } from "../../api"
import ToasterProvider from "../../helpers/ToasterProvider"
import MainHeaderComp from "../../components/MainHeaderCom"
import { buildEmployeeFormData } from "../../helpers/buildEmployeeFormData"
import EmployeeInfoStep from "../../components/Employee/AddEmployeeSteps/EmployeeInfoStep"
import KycStep from "../../components/Employee/AddEmployeeSteps/KycStep"
import BankDetailsStep from "../../components/Employee/AddEmployeeSteps/BankDetailsStep"
import VehicleStep from "../../components/Employee/AddEmployeeSteps/VehicleStep"

// Label/value pair for the created-employee summary -- only rendered when
// there's a real value, so fields the backend left null (most of them, on a
// freshly created record) don't show up as a wall of blank rows.
const DetailRow = ({ label, value }) => {
    if (value === null || value === undefined || value === "") return null
    return (
        <div className="flex justify-between gap-4 py-1.5 border-b border-white/8 last:border-0">
            <span className="text-ink-muted text-[13px]">{label}</span>
            <span className="text-ink text-[13px] font-semibold text-right">{value}</span>
        </div>
    )
}

const AddEmployee = () => {
    useEffect(() => { document.title = "Add Employee" }, [])

    const navigate = useNavigate()
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: addEmployee, loading } = usePostFileApicall()

    const [formData, setFormData] = useState({ is_active: true, service_center: [] })
    const [activeTab, setActiveTab] = useState(1)
    // Holds the backend's own created-employee record, shown in a summary
    // modal before leaving the page -- the Employee Code and Username are
    // both server-generated now (no longer typed in on this form), so this
    // is the only place the user actually sees what they came out as.
    const [createdEmployee, setCreatedEmployee] = useState(null)

    const toggle = (tabId) => {
        if (activeTab !== tabId) setActiveTab(tabId)
    }

    const SubmitAddEmployeeForm = async () => {
        const body = buildEmployeeFormData(formData)
        const result = await addEmployee(ADD_EMPLOYEE, body)
        if (result?.status) {
            SucceesToaster("Employee Added Successfully")
            setCreatedEmployee(result.data)
        } else {
            ErrorToaster("Employee Failed To Add. Please Check All Fields")
        }
    }

    const tabs = [
        {
            id: 1,
            title: "Employee Info",
            content: <EmployeeInfoStep formData={formData} setFormData={setFormData} onNextButtonClick={(id) => toggle(id)} />,
        },
        {
            id: 2,
            title: "KYC",
            content: <KycStep formData={formData} setFormData={setFormData} onNextButtonClick={(id) => toggle(id)} onPreButtonClick={(id) => toggle(id)} />,
        },
        {
            id: 3,
            title: "Bank Details",
            content: <BankDetailsStep formData={formData} setFormData={setFormData} onNextButtonClick={(id) => toggle(id)} onPreButtonClick={(id) => toggle(id)} />,
        },
        {
            id: 4,
            title: "Vehicles",
            content: <VehicleStep formData={formData} setFormData={setFormData} onPreButtonClick={(id) => toggle(id)} SubmiteForm={SubmitAddEmployeeForm} loading={loading} />,
        },
    ]

    return (
        <>
            <MainHeaderComp
                title="Add Employee"
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
            <TabProvider tabs={tabs} toggle={toggle} activeTab={activeTab} />

            <Modal isOpen={!!createdEmployee} toggle={() => { }} centered>
                <ModalHeader>Employee Created</ModalHeader>
                <ModalBody>
                    <DetailRow label="Employee Code" value={createdEmployee?.employee_code} />
                    <DetailRow label="Username" value={createdEmployee?.user_name} />
                    <DetailRow
                        label="Name"
                        value={[createdEmployee?.first_name, createdEmployee?.last_name].filter(Boolean).join(" ")}
                    />
                    <DetailRow label="Email" value={createdEmployee?.email} />
                    <DetailRow label="Mobile No" value={createdEmployee?.mobile_no} />
                    <DetailRow label="Designation" value={createdEmployee?.designation_name} />
                    <DetailRow label="Status" value={createdEmployee?.status} />
                    <DetailRow
                        label="Service Centre(s)"
                        value={createdEmployee?.service_centers?.join(", ")}
                    />
                    <DetailRow label="Bank Account Holder" value={createdEmployee?.bank_details?.[0]?.account_holder_name} />
                    <DetailRow label="Bank Account No" value={createdEmployee?.bank_details?.[0]?.account_number} />
                    <DetailRow label="Vehicle Number" value={createdEmployee?.vehicles?.[0]?.vehicle_number} />
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => navigate("/employees")}>
                        Back to List
                    </Button>
                </ModalFooter>
            </Modal>
        </>
    )
}

export default AddEmployee
