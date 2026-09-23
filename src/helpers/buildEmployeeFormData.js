// Shared between AddEmployee and EditEmployee -- both submit the same
// multipart shape to their respective endpoints (ADD_EMPLOYEE / UPDATE_EMPLOYEE),
// built from the same flat formData the 4 step components share.
//
// Nesting mirrors the reference implementation (Velocity-Ops):
// service_center is an array of ids, kyc is a single nested object, bank_details
// and vehicles are each a one-item nested array, all JSON-stringified as their
// own form field (this backend's existing convention, unlike the reference's
// bracket-notation flattening). Files are always appended flat by their own
// key name regardless of which nested section they logically belong to.
export const buildEmployeeFormData = (data) => {
    const fd = new FormData()

    // employee info
    fd.append("employee_code", data.employee_code || "")
    fd.append("first_name", data.first_name || "")
    fd.append("last_name", data.last_name || "")
    fd.append("email", data.email || "")
    fd.append("mobile_no", data.mobile_no || "")
    fd.append("status", data.status || "")
    fd.append("gender", data.gender || "")
    fd.append("date_of_birth", data.date_of_birth || "")
    fd.append("qualification", data.qualification || "")
    fd.append("designation", data.designation || "")
    fd.append("job_title", data.job_title || "")
    if (data.department) fd.append("department", data.department)
    fd.append("reporting_centre", data.reporting_centre || "")
    fd.append("access", data.access || "")
    fd.append("date_of_joining", data.date_of_joining || "")
    fd.append("remark", data.remark || "")
    fd.append("is_active", data.is_active ?? true)
    fd.append("ai_flag", data.ai_flag || false)
    if (data.user_name) fd.append("user_name", data.user_name)
    // Backend field is `user_password`, not `password` -- confirmed against
    // the reference implementation (Velocity-Ops EmployeeInfo.jsx). Sending
    // it as "password" meant the backend never saw it at all, so it reported
    // the field missing/required regardless of what was typed.
    //
    // trim() before checking: a field left blank on Edit must never reach the
    // backend at all (blank means "keep the current password"), and a value
    // of only whitespace is exactly as blank as an empty string -- checking
    // `data.password` alone would let it through as truthy.
    if (data.password && data.password.trim()) fd.append("user_password", data.password.trim())
    if (data.photo_url) fd.append("photo_url", data.photo_url)

    fd.append("service_center", JSON.stringify(data.service_center || []))

    // kyc -- single nested object, not an array
    fd.append("kyc", JSON.stringify({
        aadhar_number: data.aadhar_number || "",
        pan_number: data.pan_number || "",
        driving_licence_no: data.driving_licence_no || "",
        licence_type: data.licence_type || "",
        licence_issued_state: data.licence_issued_state || "",
        licence_issued_date: data.licence_issued_date || null,
        licence_expiry_date: data.licence_expiry_date || null,
        kyc_status: data.kyc_status || "pending",
        is_active: data.kyc_is_active ?? true,
    }))
    if (data.pan_image) fd.append("pan_image", data.pan_image)
    if (data.aadhar_front) fd.append("aadhar_front", data.aadhar_front)
    if (data.aadhar_back) fd.append("aadhar_back", data.aadhar_back)
    if (data.licence_image) fd.append("licence_image", data.licence_image)
    if (data.kyc_passbook_image) fd.append("kyc_passbook_image", data.kyc_passbook_image)

    // bank details
    fd.append("bank_details", JSON.stringify([{
        bank_name: data.bank_name || "",
        account_holder_name: data.account_holder_name || "",
        account_number: data.account_number || "",
        ifsc_code: data.ifsc_code || "",
        bank_branch: data.bank_branch || "",
        account_type: data.account_type || "",
        upi_id: data.upi_id || "",
        is_default: data.is_default || false,
    }]))
    if (data.passbook_image) fd.append("passbook_image", data.passbook_image)

    // vehicles
    fd.append("vehicles", JSON.stringify([{
        vehicle_number: data.vehicle_number || "",
        vehicle_type: data.vehicle_type || "",
        fuel_type: data.fuel_type || "",
        ownership_type: data.ownership_type || "",
        registration_date: data.registration_date || null,
        rc_number: data.rc_number || "",
        vehicle_brand: data.vehicle_brand || "",
        vehicle_capacity: data.vehicle_capacity || "",
        vehicle_category: data.vehicle_category || "",
        vehicle_cost: data.vehicle_cost || "",
        insurance_number: data.insurance_number || "",
        insurance_valid_till: data.insurance_valid_till || null,
        pollution_valid_till: data.pollution_valid_till || null,
        remarks: data.vehicle_remarks || "",
        is_active: true,
    }]))
    if (data.rc_document) fd.append("rc_document", data.rc_document)
    if (data.insurance_document) fd.append("insurance_document", data.insurance_document)
    if (data.pollution_document) fd.append("pollution_document", data.pollution_document)
    if (data.photo) fd.append("photo", data.photo)

    return fd
}
