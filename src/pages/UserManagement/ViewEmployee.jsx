import { useCallback, useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ArrowLeft, UserX, UserCheck, History } from "lucide-react"
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui"
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
import {
    GENDER_OPTIONS,
    KYC_STATUS_OPTIONS,
    ACCOUNT_TYPE_OPTIONS,
    VEHICLE_TYPE_OPTIONS,
    FUEL_TYPE_OPTIONS,
    OWNERSHIP_TYPE_OPTIONS,
} from "../../components/Employee/employeeFormOptions"

// Same value -> label maps the add/edit steps use for these dropdowns, so a
// raw stored value like "two-wheeler" reads as "Two Wheeler" here too instead
// of the two screens disagreeing on how a field is worded.
const labelFrom = (options, value) => options.find((opt) => opt.value === value)?.label || value

// One tile per field, same visual language as Customer360Modal's Metric --
// a small uppercase label over the value -- instead of a full-width row per
// field, so a profile with 20+ fields reads as a scannable grid rather than
// a long single column of rows.
const FieldBox = ({ label, children }) => (
    <div className="min-w-0 rounded-xl border border-white/8 bg-white/2 px-3.5 py-2.5">
        <div className="text-[10.5px] font-semibold uppercase tracking-wider text-ink-muted">{label}</div>
        <div className="mt-1 truncate text-[13px] font-medium text-ink" title={typeof children === "string" ? children : undefined}>
            {children}
        </div>
    </div>
)

const Field = ({ label, value }) => (
    <FieldBox label={label}>{value || value === 0 ? value : "—"}</FieldBox>
)

const DateField = ({ label, value }) => (
    <Field label={label} value={value ? (formatDisplayDate(value) || value) : null} />
)

const BadgeField = ({ label, color, children }) => (
    <FieldBox label={label}>
        <Badge color={color} pill>{children}</Badge>
    </FieldBox>
)

// Every KYC/bank/vehicle image field is either null or a URL -- a plain link
// is enough, there's no inline preview anywhere else in this app either.
const DocField = ({ label, url }) => (
    <FieldBox label={label}>
        {url ? (
            <a href={url} target="_blank" rel="noreferrer" className="text-primary-500 hover:underline">
                View
            </a>
        ) : "—"}
    </FieldBox>
)

const SectionCard = ({ icon, title, children }) => (
    <Card className="mb-4 overflow-hidden">
        <CardHeader className="border-b border-[rgb(var(--overlay-rgb)/0.08)] bg-[rgb(var(--overlay-rgb)/0.03)] py-3">
            <CardTitle tag="h4" className="m-0 flex items-center gap-2 text-[13px] font-semibold text-ink">
                <i className={`${icon} mr-2 text-ink`}></i>
                {title}
            </CardTitle>
        </CardHeader>
        <CardBody className="p-4">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {children}
            </div>
        </CardBody>
    </Card>
)

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

    const kyc = employee?.kyc
    const bankAccounts = Array.isArray(employee?.bank_details) ? employee.bank_details : []
    const vehicles = Array.isArray(employee?.vehicles) ? employee.vehicles : []
    const serviceCentres = Array.isArray(employee?.service_centers) ? employee.service_centers : []

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
                    <>
                        {/* Identity strip: the handful of fields that identify who this
                            page is about, large enough to read at a glance above the
                            field grid below. */}
                        <div className="mb-4 flex flex-wrap items-center gap-4 rounded-xl border border-white/8 bg-white/3 px-4 py-3.5">
                            <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-white/8 bg-white/5">
                                <i className="fas fa-user text-[18px] text-ink"></i>
                            </div>
                            <div className="min-w-0">
                                <div className="truncate text-[15px] font-semibold text-ink">
                                    {employee?.name || [employee?.first_name, employee?.last_name].filter(Boolean).join(" ") || "—"}
                                </div>
                                <div className="truncate text-[12px] text-ink-muted">
                                    {employee?.employee_code || "—"} · {employee?.designation_name || employee?.designation || "—"}
                                </div>
                            </div>
                            <div className="ml-auto flex items-center gap-2">
                                <Badge color={employee?.status === "active" ? "success" : "secondary"} pill>{employee?.status || "—"}</Badge>
                                <Badge color={employee?.is_active ? "success" : "secondary"} pill>{employee?.is_active ? "Active" : "Inactive"}</Badge>
                            </div>
                        </div>

                        <SectionCard icon="fas fa-user-circle" title="Basic Details">
                            <Field label="Employee Code" value={employee?.employee_code} />
                            <Field label="Name" value={employee?.name || [employee?.first_name, employee?.last_name].filter(Boolean).join(" ")} />
                            <Field label="Username" value={employee?.user_name} />
                            <Field label="Email" value={employee?.email} />
                            <Field label="Phone" value={employee?.mobile_no || employee?.phone} />
                            <Field label="Gender" value={labelFrom(GENDER_OPTIONS, employee?.gender)} />
                            <DateField label="Date of Birth" value={employee?.date_of_birth} />
                            <Field label="Qualification" value={employee?.qualification} />
                            <Field label="Job Title" value={employee?.job_title} />
                            <Field label="Designation" value={employee?.designation_name || employee?.designation} />
                            <Field label="Department" value={employee?.department_name || employee?.department} />
                            <Field label="Team Lead" value={employee?.team_lead_name} />
                            <Field
                                label="Service Centres"
                                value={serviceCentres.length ? serviceCentres.join(", ") : (employee?.service_center_name || employee?.service_center)}
                            />
                            <Field label="Reporting Centre" value={employee?.reporting_centre} />
                            <Field label="Access" value={employee?.access} />
                            <Field label="Verification ID" value={employee?.verification_id} />
                            <DateField label="Date of Joining" value={employee?.date_of_joining} />
                            <BadgeField label="Status" color={employee?.status === "active" ? "success" : "secondary"}>
                                {employee?.status || "—"}
                            </BadgeField>
                            <BadgeField label="Is Active" color={employee?.is_active ? "success" : "secondary"}>
                                {employee?.is_active ? "Yes" : "No"}
                            </BadgeField>
                            <BadgeField label="AI Flag" color={employee?.ai_flag ? "success" : "secondary"}>
                                {employee?.ai_flag ? "Yes" : "No"}
                            </BadgeField>
                            <Field label="Remark" value={employee?.remark} />
                            <DocField label="Photo" url={employee?.photo_url} />
                            <Field label="Created By" value={employee?.created_by} />
                            <DateField label="Created Date" value={employee?.created_date} />
                            <Field label="Updated By" value={employee?.updated_by} />
                            <DateField label="Updated Date" value={employee?.updated_date} />
                            {/* Exit fields are read-only everywhere except mark-exit itself --
                                only shown once the employee actually has one on record. */}
                            {employee?.date_of_exit && (
                                <>
                                    <DateField label="Date of Exit" value={employee?.date_of_exit} />
                                    <Field label="Exit Remark" value={employee?.exit_remark} />
                                    <Field label="Exit Marked By" value={employee?.exit_marked_by} />
                                    <DateField label="Exit Marked At" value={employee?.exit_marked_at} />
                                </>
                            )}
                        </SectionCard>

                        {kyc && (
                            <SectionCard icon="fas fa-id-card" title="KYC Details">
                                <BadgeField
                                    label="KYC Status"
                                    color={kyc.kyc_status === "verified" ? "success" : kyc.kyc_status === "rejected" ? "danger" : "warning"}
                                >
                                    {labelFrom(KYC_STATUS_OPTIONS, kyc.kyc_status)}
                                </BadgeField>
                                <Field label="Aadhar Number" value={kyc.aadhar_number} />
                                <Field label="PAN Number" value={kyc.pan_number} />
                                <Field label="Driving Licence No" value={kyc.driving_licence_no} />
                                <Field label="Licence Type" value={kyc.licence_type} />
                                <Field label="Licence Issued State" value={kyc.licence_issued_state} />
                                <DateField label="Licence Issued Date" value={kyc.licence_issued_date} />
                                <DateField label="Licence Expiry Date" value={kyc.licence_expiry_date} />
                                <Field label="Bank Name" value={kyc.bank_name} />
                                <Field label="Bank Account Number" value={kyc.bank_account_number} />
                                <Field label="IFSC Code" value={kyc.ifsc_code} />
                                <Field label="Verified By" value={kyc.verified_by} />
                                <DateField label="Verified At" value={kyc.verified_at} />
                                <DocField label="Aadhar Front" url={kyc.aadhar_front} />
                                <DocField label="Aadhar Back" url={kyc.aadhar_back} />
                                <DocField label="PAN Image" url={kyc.pan_image} />
                                <DocField label="Licence Image" url={kyc.licence_image} />
                                <DocField label="Passbook Image" url={kyc.passbook_image} />
                            </SectionCard>
                        )}

                        {bankAccounts.map((account, index) => (
                            <SectionCard
                                key={account.id ?? index}
                                icon="fas fa-university"
                                title={bankAccounts.length > 1 ? `Bank Account ${index + 1}` : "Bank Account"}
                            >
                                <Field label="Account Holder Name" value={account.account_holder_name} />
                                <Field label="Bank Name" value={account.bank_name} />
                                <Field label="Account Number" value={account.account_number} />
                                <Field label="IFSC Code" value={account.ifsc_code} />
                                <Field label="Bank Branch" value={account.bank_branch} />
                                <Field label="Account Type" value={labelFrom(ACCOUNT_TYPE_OPTIONS, account.account_type)} />
                                <Field label="UPI ID" value={account.upi_id} />
                                <BadgeField label="Default Account" color={account.is_default ? "success" : "secondary"}>
                                    {account.is_default ? "Yes" : "No"}
                                </BadgeField>
                                <DocField label="Passbook Image" url={account.passbook_image} />
                            </SectionCard>
                        ))}

                        {vehicles.map((vehicle, index) => (
                            <SectionCard
                                key={vehicle.id ?? index}
                                icon="fas fa-motorcycle"
                                title={vehicles.length > 1 ? `Vehicle ${index + 1}` : "Vehicle"}
                            >
                                <Field label="Vehicle Number" value={vehicle.vehicle_number} />
                                <Field label="Vehicle Type" value={labelFrom(VEHICLE_TYPE_OPTIONS, vehicle.vehicle_type)} />
                                <Field label="Fuel Type" value={labelFrom(FUEL_TYPE_OPTIONS, vehicle.fuel_type)} />
                                <Field label="Ownership Type" value={labelFrom(OWNERSHIP_TYPE_OPTIONS, vehicle.ownership_type)} />
                                <DateField label="Registration Date" value={vehicle.registration_date} />
                                <Field label="RC Number" value={vehicle.rc_number} />
                                <Field label="Insurance Number" value={vehicle.insurance_number} />
                                <DateField label="Insurance Valid Till" value={vehicle.insurance_valid_till} />
                                <DateField label="Pollution Valid Till" value={vehicle.pollution_valid_till} />
                                <Field label="Remarks" value={vehicle.remarks} />
                                <DocField label="RC Document" url={vehicle.rc_document} />
                                <DocField label="Insurance Document" url={vehicle.insurance_document} />
                                <DocField label="Pollution Document" url={vehicle.pollution_document} />
                                <DocField label="Vehicle Photo" url={vehicle.photo} />
                            </SectionCard>
                        ))}
                    </>
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
