import { useState } from "react"
import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, FormFeedback, Button, Spinner, Card, CardHeader, CardBody } from "@/components/ui"
import Select from "react-select"
import { customStyles } from "../../helpers/CustomStyle"
import { useDepartments, useServiceCentreDirectory } from "../../hooks/queries/useReferenceData"

const REQUIRED_FIELDS = ["employee_code", "name", "phone"]
const RequiredMark = () => <span className="text-danger-500"> *</span>

const EmployeeForm = ({ formData, setFormData, onSubmit, loading, submitLabel = "Save", onCancel, isEdit = false }) => {
    const [errors, setErrors] = useState({})

    const { data: departmentOptions = [] } = useDepartments()
    const { data: serviceCentreOptions = [] } = useServiceCentreDirectory()

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    }

    const handleSelectChange = (name, option) => {
        setFormData((prev) => ({ ...prev, [name]: option?.value ?? null }))
    }

    const handleSubmit = () => {
        const newErrors = {}
        REQUIRED_FIELDS.forEach((field) => {
            if (!formData?.[field]) newErrors[field] = `${field.replaceAll("_", " ")} is required`
        })
        if (!isEdit) {
            if (!formData?.user_name) newErrors.user_name = "Username is required"
            if (!formData?.password) newErrors.password = "Password is required"
        }
        setErrors(newErrors)
        if (Object.keys(newErrors).length === 0) {
            onSubmit()
        }
    }

    return (
        <div className="mt-4">
            <Card className="mb-3">
                <CardHeader><h5 className="m-0">Basic Info</h5></CardHeader>
                <CardBody>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Employee Code<RequiredMark /></Label>
                                <Input type="text" name="employee_code" value={formData.employee_code || ""} onChange={handleChange} invalid={!!errors?.employee_code} />
                                <FormFeedback>{errors?.employee_code}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Name<RequiredMark /></Label>
                                <Input type="text" name="name" value={formData.name || ""} onChange={handleChange} invalid={!!errors?.name} />
                                <FormFeedback>{errors?.name}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Designation</Label>
                                <Input type="text" name="designation" value={formData.designation || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Email</Label>
                                <Input type="email" name="email" value={formData.email || ""} onChange={handleChange} invalid={!!errors?.email} />
                                <FormFeedback>{errors?.email}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Phone<RequiredMark /></Label>
                                <Input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} invalid={!!errors?.phone} />
                                <FormFeedback>{errors?.phone}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup check className="mt-4">
                                <Label check>
                                    <Input type="checkbox" name="is_active" checked={!!formData.is_active} onChange={handleChange} />
                                    Active
                                </Label>
                            </FormGroup>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader><h5 className="m-0">Work Details</h5></CardHeader>
                <CardBody>
                    <Row>
                        <Col md={6}>
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
                        <Col md={6}>
                            <FormGroup>
                                <Label>Service Centre</Label>
                                <Select
                                    options={serviceCentreOptions}
                                    onChange={(option) => handleSelectChange("service_center", option)}
                                    value={serviceCentreOptions.find((opt) => opt.value === formData.service_center) || null}
                                    placeholder="Select Service Centre"
                                    isClearable
                                    styles={customStyles}
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            {!isEdit && (
                <Card className="mb-3">
                    <CardHeader><h5 className="m-0">Login Credentials</h5></CardHeader>
                    <CardBody>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Username<RequiredMark /></Label>
                                    <Input type="text" name="user_name" value={formData.user_name || ""} onChange={handleChange} invalid={!!errors?.user_name} />
                                    <FormFeedback>{errors?.user_name}</FormFeedback>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Password<RequiredMark /></Label>
                                    <Input type="password" name="password" value={formData.password || ""} onChange={handleChange} invalid={!!errors?.password} />
                                    <FormFeedback>{errors?.password}</FormFeedback>
                                </FormGroup>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>
            )}

            <div className="flex gap-3 mt-4 justify-end">
                {onCancel && <Button color="secondary" outline onClick={onCancel}>Cancel</Button>}
                <Button color="primary" className="px-4 py-2 flex items-center gap-2" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Saving...</> : submitLabel}
                </Button>
            </div>
        </div>
    )
}

EmployeeForm.propTypes = {
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    submitLabel: PropTypes.string,
    onCancel: PropTypes.func,
    isEdit: PropTypes.bool,
}

export default EmployeeForm
