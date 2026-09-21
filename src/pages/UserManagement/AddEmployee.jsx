import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui"
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

const AddEmployee = () => {
    useEffect(() => { document.title = "Add Employee" }, [])

    const navigate = useNavigate()
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const { apifunc: addEmployee, loading } = usePostFileApicall()

    const [formData, setFormData] = useState({ is_active: true, service_center: [] })
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
