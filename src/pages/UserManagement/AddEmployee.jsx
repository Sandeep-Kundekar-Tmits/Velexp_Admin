import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui"
import TabProvider from "../../components/Table/TabProvider"
import usePostFileApicall from "../../hooks/usePostFileApicall"
import { ADD_EMPLOYEE } from "../../api"
import ToasterProvider from "../../helpers/ToasterProvider"
import MainHeaderComp from "../../components/MainHeaderCom"
import EmployeeInfoStep from "../../components/Employee/AddEmployeeSteps/EmployeeInfoStep"
import KycStep from "../../components/Employee/AddEmployeeSteps/KycStep"
import BankDetailsStep from "../../components/Employee/AddEmployeeSteps/BankDetailsStep"
import VehicleStep from "../../components/Employee/AddEmployeeSteps/VehicleStep"

const buildEmployeeFormData = (data) => {
    const fd = new FormData()

    // employee info
    fd.append("employee_code", data.employee_code || "")
    fd.append("name", data.name || "")
    fd.append("designation", data.designation || "")
    fd.append("email", data.email || "")
    fd.append("phone", data.phone || "")
    if (data.department) fd.append("department", data.department)
    if (data.service_center) fd.append("service_center", data.service_center)
    fd.append("is_active", data.is_active ?? true)
    fd.append("user_name", data.user_name || "")
    fd.append("password", data.password || "")

    // kyc
    fd.append("kyc_approved", data.kyc_approved || false)
    if (data.kyc_document) fd.append("kyc_document", data.kyc_document)

    // bank details
    fd.append("bank_details", JSON.stringify({
        bank_name: data.bank_name || "",
        account_holder_name: data.account_holder_name || "",
        bank_account_number: data.bank_account_number || "",
        ifsc_code: data.ifsc_code || "",
        branch: data.branch || "",
    }))

    // vehicles
    fd.append("vehicles", JSON.stringify([{
        vehicle_number: data.vehicle_number || "",
        vehicle_type: data.vehicle_type || "",
        vehicle_brand: data.vehicle_brand || "",
        vehicle_capacity: data.vehicle_capacity || "",
        vehicle_category: data.vehicle_category || "",
        vehicle_cost: data.vehicle_cost || "",
        driving_licence_no: data.driving_licence_no || "",
        licence_type: data.licence_type || "",
        licence_issued_state: data.licence_issued_state || "",
        licence_issued_date: data.licence_issued_date || null,
        licence_expiry_date: data.licence_expiry_date || null,
        insurance_number: data.insurance_number || "",
        insurance_valid_till: data.insurance_valid_till || null,
        pollution_valid_till: data.pollution_valid_till || null,
        is_active: true,
    }]))
    if (data.licence_document) fd.append("licence_document", data.licence_document)
    if (data.insurance_document) fd.append("insurance_document", data.insurance_document)
    if (data.pollution_document) fd.append("pollution_document", data.pollution_document)
    if (data.photo) fd.append("photo", data.photo)

    return fd
}

const AddEmployee = () => {
    useEffect(() => { document.title = "Add Employee" }, [])

    const navigate = useNavigate()
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: addEmployee, loading } = usePostFileApicall()

    const [formData, setFormData] = useState({ is_active: true })
    const [activeTab, setActiveTab] = useState(1)

    const toggle = (tabId) => {
        if (activeTab !== tabId) setActiveTab(tabId)
    }

    const SubmitAddEmployeeForm = async () => {
        const body = buildEmployeeFormData(formData)
        const result = await addEmployee(ADD_EMPLOYEE, body)
        if (result?.status) {
            SucceesToaster("Employee Added Successfully")
            navigate("/employees")
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
        </>
    )
}

export default AddEmployee
