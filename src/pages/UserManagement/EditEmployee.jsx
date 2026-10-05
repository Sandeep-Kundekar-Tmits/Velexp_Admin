import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui"
import TabProvider from "../../components/Table/TabProvider"
import usePostApiCall from "../../hooks/usePostApiCall"
import { usePatchApiCall } from "../../hooks/usePatchApiCall"
import { GET_EMPLOYEE_DETAIL, UPDATE_EMPLOYEE } from "../../api"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import { extractApiRecord } from "../../helpers/extractApiRecord"
import { buildEmployeeFormData } from "../../helpers/buildEmployeeFormData"
import EmployeeInfoStep from "../../components/Employee/AddEmployeeSteps/EmployeeInfoStep"
import KycStep from "../../components/Employee/AddEmployeeSteps/KycStep"
import BankDetailsStep from "../../components/Employee/AddEmployeeSteps/BankDetailsStep"
import VehicleStep from "../../components/Employee/AddEmployeeSteps/VehicleStep"

// GET_EMPLOYEE_DETAIL response shape confirmed against the reference
// implementation (Velocity-Ops ViewEmployee.jsx): { result: { <flat fields>,
// kyc: {…object…}, bank_details: [ {…} ], vehicles: [ {…} ] } }.
// extractApiRecord already unwraps the `result` envelope below.
//
// Each field is read from its OWN section only, not a fallback chain --
// `kyc` there also carries legacy/redundant bank_account_number, ifsc_code,
// bank_name, passbook_image fields (an artifact of that app's history, not
// replicated in this form's Bank Details tab), which would silently win over
// the real bank_details[0] values if a generic "check every section" lookup
// were used here.
function flattenEmployeeRecord(record) {
    if (!record) return { is_active: true, service_center: [] }
    const kyc = record.kyc || {}
    const bank = (Array.isArray(record.bank_details) && record.bank_details[0]) || {}
    const vehicle = (Array.isArray(record.vehicles) && record.vehicles[0]) || {}

    const serviceCenters = record.service_center ?? record.service_centers ?? []
    const designationOptionValue = record.designation ?? record.designation_id ?? null

    return {
        // Employee Info -- flat on the record.
        employee_code: record.employee_code || "",
        type: record.type || "",
        // Username pre-fills so the field isn't blank on open; password never
        // does -- the API doesn't return it, and it shouldn't be guessable
        // from a blank-looking field either way. Leaving password blank on
        // submit means "keep the current one" (buildEmployeeFormData only
        // appends it when non-empty).
        user_name: record.user_name || "",
        first_name: record.first_name || record.name || "",
        last_name: record.last_name || "",
        gender: record.gender || "",
        date_of_birth: record.date_of_birth || "",
        qualification: record.qualification || "",
        email: record.email || "",
        mobile_no: record.mobile_no || record.phone || "",
        status: record.status || (record.is_active === false ? "inactive" : "active"),
        designation: designationOptionValue,
        // Only the id form of designation is used for the Select's value match
        // (EmployeeInfoStep); designation_name is kept too so it can fall back
        // to a label match if the detail response only carries the name.
        designation_name: record.designation_name || "",
        job_title: record.job_title || "",
        department: record.department ?? null,
        reporting_centre: record.reporting_centre || "",
        access: record.access || "",
        date_of_joining: record.date_of_joining || "",
        remark: record.remark || "",
        is_active: record.is_active ?? true,
        ai_flag: !!record.ai_flag,
        service_center: Array.isArray(serviceCenters) ? serviceCenters : [serviceCenters].filter(Boolean),

        // KYC tab -- from `kyc` only.
        aadhar_number: kyc.aadhar_number || "",
        pan_number: kyc.pan_number || "",
        driving_licence_no: kyc.driving_licence_no || "",
        licence_type: kyc.licence_type || "",
        licence_issued_state: kyc.licence_issued_state || "",
        licence_issued_date: kyc.licence_issued_date || "",
        licence_expiry_date: kyc.licence_expiry_date || "",
        kyc_status: kyc.kyc_status || "pending",
        kyc_is_active: kyc.is_active ?? true,

        // Bank Details tab -- from bank_details[0] only.
        bank_name: bank.bank_name || "",
        account_holder_name: bank.account_holder_name || "",
        account_number: bank.account_number || "",
        ifsc_code: bank.ifsc_code || "",
        bank_branch: bank.bank_branch || "",
        account_type: bank.account_type || "",
        upi_id: bank.upi_id || "",
        is_default: !!bank.is_default,

        // Vehicles tab -- from vehicles[0] only.
        vehicle_number: vehicle.vehicle_number || "",
        vehicle_type: vehicle.vehicle_type || "",
        fuel_type: vehicle.fuel_type || "",
        ownership_type: vehicle.ownership_type || "",
        registration_date: vehicle.registration_date || "",
        rc_number: vehicle.rc_number || "",
        vehicle_brand: vehicle.vehicle_brand || "",
        vehicle_capacity: vehicle.vehicle_capacity || "",
        vehicle_category: vehicle.vehicle_category || "",
        vehicle_cost: vehicle.vehicle_cost || "",
        insurance_number: vehicle.insurance_number || "",
        insurance_valid_till: vehicle.insurance_valid_till || "",
        pollution_valid_till: vehicle.pollution_valid_till || "",
        vehicle_remarks: vehicle.remarks || "",
    }
}

const EditEmployee = () => {
    useEffect(() => { document.title = "Edit Employee" }, [])

    const navigate = useNavigate()
    const { id } = useParams()

    const { apifunc: getDetail, data: detailData, loading: detailLoading } = usePostApiCall()
    const { apifunc: updateEmployee, loading: updateLoading } = usePatchApiCall("Employee Updated Successfully", () => navigate("/employees"))

    const [formData, setFormData] = useState({ is_active: true, service_center: [] })
    const [activeTab, setActiveTab] = useState(1)

    useEffect(() => { getDetail(GET_EMPLOYEE_DETAIL, { id }) }, [getDetail, id])

    useEffect(() => {
        if (detailData) {
            const record = extractApiRecord(detailData, ["employee_code", "name", "first_name"])
            setFormData(flattenEmployeeRecord(record))
        }
    }, [detailData])

    const toggle = (tabId) => {
        if (activeTab !== tabId) setActiveTab(tabId)
    }

    const SubmitEditEmployeeForm = async () => {
        const body = buildEmployeeFormData(formData)
        await updateEmployee(`${UPDATE_EMPLOYEE}${id}/`, body, true)
    }

    const tabs = [
        {
            id: 1,
            title: "Employee Info",
            content: <EmployeeInfoStep formData={formData} setFormData={setFormData} onNextButtonClick={(tabId) => toggle(tabId)} isEdit />,
        },
        {
            id: 2,
            title: "KYC",
            content: <KycStep formData={formData} setFormData={setFormData} onNextButtonClick={(tabId) => toggle(tabId)} onPreButtonClick={(tabId) => toggle(tabId)} />,
        },
        {
            id: 3,
            title: "Bank Details",
            content: <BankDetailsStep formData={formData} setFormData={setFormData} onNextButtonClick={(tabId) => toggle(tabId)} onPreButtonClick={(tabId) => toggle(tabId)} />,
        },
        {
            id: 4,
            title: "Vehicles",
            content: <VehicleStep formData={formData} setFormData={setFormData} onPreButtonClick={(tabId) => toggle(tabId)} SubmiteForm={SubmitEditEmployeeForm} loading={updateLoading} />,
        },
    ]

    return (
        <>
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
            {detailLoading ? (
                <Loader message="Loading Employee…" fullscreen={false} />
            ) : (
                <TabProvider tabs={tabs} toggle={toggle} activeTab={activeTab} />
            )}
        </>
    )
}

export default EditEmployee
