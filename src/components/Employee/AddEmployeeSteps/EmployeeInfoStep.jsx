import { useEffect, useState } from "react"
import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, FormFeedback, Button } from "@/components/ui"
import Select from "react-select"
import { customStyles } from "../../../helpers/CustomStyle"
import { useDepartments, useDesignations, useServiceCentreDirectory } from "../../../hooks/queries/useReferenceData"
import { GENDER_OPTIONS, EMPLOYEE_TYPE_OPTIONS } from "../employeeFormOptions"

const RequiredMark = () => <span className="text-danger-500"> *</span>

const EmployeeInfoStep = ({ formData, setFormData, onNextButtonClick, isEdit = false }) => {
    const [errors, setErrors] = useState({})

    const { data: departmentOptions = [] } = useDepartments()
    const { data: designationOptions = [] } = useDesignations()
    const { data: serviceCentreOptions = [] } = useServiceCentreDirectory()

    // The Select's `value` prop can display a name-matched fallback (below),
    // but that alone never touches formData.designation -- so an edit
    // submitted without the user re-picking a designation would silently
    // send whatever id (possibly none) the detail response happened to
    // carry. Backfill the real id once options are loaded and a name match
    // is found, same as the visible fallback resolves to.
    useEffect(() => {
        if (formData.designation || !formData.designation_name || !designationOptions.length) return
        const match = designationOptions.find((opt) => opt.label === formData.designation_name)
        if (match) setFormData((prev) => ({ ...prev, designation: match.value }))
    }, [designationOptions, formData.designation, formData.designation_name, setFormData])

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target
        if (type === "checkbox") setFormData((prev) => ({ ...prev, [name]: checked }))
        else if (type === "file") setFormData((prev) => ({ ...prev, [name]: files[0] }))
        else setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name, option) => {
        setFormData((prev) => ({ ...prev, [name]: option?.value ?? null }))
    }

    // service_center is multi-select -- an employee can belong to more than
    // one centre -- so it's stored as an array of ids, unlike the single-value
    // selects above.
    const handleServiceCentreChange = (options) => {
        setFormData((prev) => ({ ...prev, service_center: (options || []).map((opt) => opt.value) }))
    }

    const handleSubmit = () => {
        const newErrors = {}
        if (!formData?.first_name) newErrors.first_name = "First name is required"
        if (!formData?.email) newErrors.email = "Email is required"
        // Status dropdown is hidden (see below) -- create defaults it to
        // "active", edit keeps whatever the record already had -- so there's
        // nothing left for the user to fill in here.
        if (!formData?.designation) newErrors.designation = "Designation is required"
        if (!formData?.service_center?.length) newErrors.service_center = "At least one service centre is required"
        // Credentials are set once at creation, not re-required on every edit --
        // matches the account-details section's own required rule at creation.
        // `type` picks the code series the server generates employee_code from,
        // so it's only meaningful (and only enforced by the backend) on create.
        if (!isEdit) {
            if (!formData?.password) newErrors.password = "Password is required"
            if (!formData?.type) newErrors.type = "Type is required"
        }
        setErrors(newErrors)
        if (Object.keys(newErrors).length === 0) {
            onNextButtonClick(2)
        }
    }

    return (
        <div className="mt-4">
            <h4>Employee Info</h4>
            <div>
                <h6 className="text-ink-muted mt-3 mb-2">Account Details</h6>
                <Row>
                    <Col md={3}>
                        <FormGroup>
                            <Label>Type<RequiredMark /></Label>
                            <Select
                                options={EMPLOYEE_TYPE_OPTIONS}
                                onChange={(option) => handleSelectChange("type", option)}
                                value={EMPLOYEE_TYPE_OPTIONS.find((opt) => opt.value === formData.type) || null}
                                placeholder="Select Type"
                                isClearable
                                isDisabled={isEdit}
                                styles={customStyles}
                            />
                            {errors?.type && <div className="text-danger-500 text-sm mt-1">{errors.type}</div>}
                        </FormGroup>
                    </Col>
                    {/* Hidden on both Add and Edit -- create defaults
                        status/is_active to "active" (AddEmployee.jsx's
                        initial formData); edit just carries through whatever
                        the record already had, unmodified. Active/inactive
                        is managed separately now via Mark Exit / Reverse
                        Exit, not by hand-picking a value here. */}
                    <Col md={3}>
                        <FormGroup>
                            <Label>Password{!isEdit && <RequiredMark />}</Label>
                            <Input
                                type="password"
                                name="password"
                                value={formData.password || ""}
                                onChange={handleChange}
                                invalid={!!errors?.password}
                                placeholder={isEdit ? "Leave blank to keep current password" : undefined}
                            />
                            <FormFeedback>{errors?.password}</FormFeedback>
                        </FormGroup>
                    </Col>
                    {isEdit && (
                        <>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Employee Code</Label>
                                    <Input type="text" value={formData.employee_code || ""} disabled readOnly />
                                </FormGroup>
                            </Col>
                            <Col md={3}>
                                <FormGroup>
                                    <Label>Username</Label>
                                    <Input type="text" value={formData.user_name || ""} disabled readOnly />
                                </FormGroup>
                            </Col>
                        </>
                    )}
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Personal Details</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>First Name<RequiredMark /></Label>
                            <Input type="text" name="first_name" value={formData.first_name || ""} onChange={handleChange} invalid={!!errors?.first_name} />
                            <FormFeedback>{errors?.first_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Last Name</Label>
                            <Input type="text" name="last_name" value={formData.last_name || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Gender</Label>
                            <Select
                                options={GENDER_OPTIONS}
                                onChange={(option) => handleSelectChange("gender", option)}
                                value={GENDER_OPTIONS.find((opt) => opt.value === formData.gender) || null}
                                placeholder="Select Gender"
                                isClearable
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Date of Birth</Label>
                            <Input type="date" name="date_of_birth" value={formData.date_of_birth || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Qualification</Label>
                            <Input type="text" name="qualification" value={formData.qualification || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Profile Photo</Label>
                            <Input type="file" name="photo_url" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Contact Details</h6>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Email<RequiredMark /></Label>
                            <Input type="email" name="email" value={formData.email || ""} onChange={handleChange} invalid={!!errors?.email} />
                            <FormFeedback>{errors?.email}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Mobile No</Label>
                            <Input type="text" name="mobile_no" value={formData.mobile_no || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Organization Details</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Designation<RequiredMark /></Label>
                            <Select
                                options={designationOptions}
                                onChange={(option) => handleSelectChange("designation", option)}
                                // Falls back to a label match on designation_name -- GET_EMPLOYEE_DETAIL
                                // (reference-confirmed) returns designation_name on the record, not
                                // necessarily the id this Select's options are keyed by.
                                value={
                                    designationOptions.find((opt) => opt.value === formData.designation) ||
                                    (formData.designation_name && designationOptions.find((opt) => opt.label === formData.designation_name)) ||
                                    null
                                }
                                placeholder="Select Designation"
                                isClearable
                                styles={customStyles}
                            />
                            {errors?.designation && <div className="text-danger-500 text-sm mt-1">{errors.designation}</div>}
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Service Centre<RequiredMark /></Label>
                            <Select
                                isMulti
                                options={serviceCentreOptions}
                                onChange={handleServiceCentreChange}
                                value={serviceCentreOptions.filter((opt) => (formData.service_center || []).includes(opt.value))}
                                placeholder="Select Service Centre(s)"
                                styles={customStyles}
                            />
                            {errors?.service_center && <div className="text-danger-500 text-sm mt-1">{errors.service_center}</div>}
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Job Title</Label>
                            <Input type="text" name="job_title" value={formData.job_title || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Department</Label>
                            <Select
                                options={departmentOptions}
                                onChange={(option) => handleSelectChange("department", option)}
                                value={departmentOptions.find((opt) => opt.value === formData.department) || null}
                                placeholder="Select Department"
                                isClearable
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Reporting Centre</Label>
                            <Input type="text" name="reporting_centre" value={formData.reporting_centre || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Access</Label>
                            <Input type="text" name="access" value={formData.access || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Date of Joining</Label>
                            <Input type="date" name="date_of_joining" value={formData.date_of_joining || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    {/* No standalone "Active" checkbox -- the Status dropdown
                        above is the only control for it now, and already
                        keeps formData.is_active in sync (handleSelectChange),
                        so it still goes out in the submit payload. */}
                    <Col md={6}>
                        <FormGroup check className="mt-4">
                            <Label check>
                                <Input type="checkbox" name="ai_flag" checked={!!formData.ai_flag} onChange={handleChange} />
                                AI Flag
                            </Label>
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Remarks</h6>
                <Row>
                    <Col md={12}>
                        <FormGroup>
                            <Input type="textarea" name="remark" value={formData.remark || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
                <Button color="primary" className="px-4 py-2" onClick={handleSubmit}>Next</Button>
            </div>
        </div>
    )
}

EmployeeInfoStep.propTypes = {
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    onNextButtonClick: PropTypes.func.isRequired,
    isEdit: PropTypes.bool,
}

export default EmployeeInfoStep
