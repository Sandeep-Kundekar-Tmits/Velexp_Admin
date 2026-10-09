// Fixed dropdown option sets shared across the Employee Info/KYC/Bank
// Details/Vehicles tabs -- mirrors the reference implementation at
// Velocity-Ops (src/Components/Masters/Employee/*.jsx) value-for-value so
// submitted values match what the backend expects.
// Kept in lockstep with the "Active" checkbox (is_active) in
// EmployeeInfoStep -- picking a status here checks/unchecks it and vice
// versa, so only these two values are meaningful.
export const STATUS_OPTIONS = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
]

// Maps to the backend's `type` field on create (POST /api/employee/employees/),
// required there to pick which active code series the server generates
// employee_code from.
export const EMPLOYEE_TYPE_OPTIONS = [
    { value: "V", label: "V" },
    { value: "DV", label: "DV" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
    { value: "AT", label: "AT" },
]

export const GENDER_OPTIONS = [
    { value: "male", label: "Male" },
    { value: "female", label: "Female" },
    { value: "other", label: "Other" },
]

export const KYC_STATUS_OPTIONS = [
    { value: "pending", label: "Pending" },
    { value: "verified", label: "Verified" },
    { value: "rejected", label: "Rejected" },
]

export const ACCOUNT_TYPE_OPTIONS = [
    { value: "savings", label: "Savings" },
    { value: "current", label: "Current" },
]

export const VEHICLE_TYPE_OPTIONS = [
    { value: "two-wheeler", label: "Two Wheeler" },
    { value: "four-wheeler", label: "Four Wheeler" },
    { value: "other", label: "Other" },
]

export const FUEL_TYPE_OPTIONS = [
    { value: "petrol", label: "Petrol" },
    { value: "diesel", label: "Diesel" },
    { value: "electric", label: "Electric" },
    { value: "cng", label: "CNG" },
]

export const OWNERSHIP_TYPE_OPTIONS = [
    { value: "self-owned", label: "Self Owned" },
    { value: "company-owned", label: "Company Owned" },
]
