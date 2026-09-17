import { useState } from "react"
import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, FormFeedback, Button, Spinner, Card, CardHeader, CardBody } from "@/components/ui"

const REQUIRED_FIELDS = ["service_center_code", "company_name", "city", "state", "phone"]
const RequiredMark = () => <span className="text-danger-500"> *</span>

const ServiceCentreForm = ({ formData, setFormData, subData, setSubData, onSubmit, loading, submitLabel = "Save", onCancel }) => {
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    }

    const handleSubChange = (e) => {
        const { name, value, type, checked } = e.target
        setSubData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }))
    }

    const handleSubmit = () => {
        const newErrors = {}
        REQUIRED_FIELDS.forEach((field) => {
            if (!formData?.[field]) {
                newErrors[field] = `${field.replaceAll("_", " ")} is required`
            }
        })
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
                                <Label>Service Centre Code<RequiredMark /></Label>
                                <Input type="text" name="service_center_code" value={formData.service_center_code || ""} onChange={handleChange} invalid={!!errors?.service_center_code} />
                                <FormFeedback>{errors?.service_center_code}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Company Name<RequiredMark /></Label>
                                <Input type="text" name="company_name" value={formData.company_name || ""} onChange={handleChange} invalid={!!errors?.company_name} />
                                <FormFeedback>{errors?.company_name}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Service Centre Type</Label>
                                <Input type="text" placeholder="e.g. Warehouse" name="service_center_type" value={formData.service_center_type || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Office Category</Label>
                                <Input type="text" placeholder="e.g. Main" name="office_category" value={formData.office_category || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Office Type</Label>
                                <Input type="text" placeholder="e.g. Branch" name="office_type" value={formData.office_type || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Employee Count</Label>
                                <Input type="number" name="employee_count" value={formData.employee_count || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <FormGroup check className="mt-2">
                                <Label check>
                                    <Input type="checkbox" name="is_active" checked={!!formData.is_active} onChange={handleChange} />
                                    Active
                                </Label>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup check className="mt-2">
                                <Label check>
                                    <Input type="checkbox" name="is_default" checked={!!formData.is_default} onChange={handleChange} />
                                    Default Service Centre
                                </Label>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup check className="mt-2">
                                <Label check>
                                    <Input type="checkbox" name="ai_flag" checked={!!formData.ai_flag} onChange={handleChange} />
                                    AI Flag
                                </Label>
                            </FormGroup>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader><h5 className="m-0">Contact</h5></CardHeader>
                <CardBody>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Email</Label>
                                <Input type="email" name="email_id" value={formData.email_id || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Head Office Email</Label>
                                <Input type="email" name="head_email" value={formData.head_email || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Phone<RequiredMark /></Label>
                                <Input type="text" name="phone" value={formData.phone || ""} onChange={handleChange} invalid={!!errors?.phone} />
                                <FormFeedback>{errors?.phone}</FormFeedback>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Alternate Phone</Label>
                                <Input type="text" name="alternate_phone_no" value={formData.alternate_phone_no || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Call Masking Number</Label>
                                <Input type="text" name="call_masking_number" value={formData.call_masking_number || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup check className="mt-2">
                                <Label check>
                                    <Input type="checkbox" name="sms" checked={!!formData.sms} onChange={handleChange} />
                                    SMS Enabled
                                </Label>
                            </FormGroup>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader><h5 className="m-0">Location &amp; Geo</h5></CardHeader>
                <CardBody>
                    <Row>
                        <Col md={12}>
                            <FormGroup>
                                <Label>Address</Label>
                                <Input type="textarea" name="address" value={formData.address || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={3}>
                            <FormGroup>
                                <Label>City<RequiredMark /></Label>
                                <Input type="text" name="city" value={formData.city || ""} onChange={handleChange} invalid={!!errors?.city} />
                                <FormFeedback>{errors?.city}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Area</Label>
                                <Input type="text" name="area" value={formData.area || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>District</Label>
                                <Input type="text" name="district" value={formData.district || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>City Code</Label>
                                <Input type="text" name="citycode" value={formData.citycode || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={3}>
                            <FormGroup>
                                <Label>State<RequiredMark /></Label>
                                <Input type="text" name="state" value={formData.state || ""} onChange={handleChange} invalid={!!errors?.state} />
                                <FormFeedback>{errors?.state}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>State Code</Label>
                                <Input type="text" name="state_code" value={formData.state_code || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Region</Label>
                                <Input type="text" name="region" value={formData.region || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Country</Label>
                                <Input type="text" name="branch_country" value={formData.branch_country || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Pincode</Label>
                                <Input type="text" name="pincode" value={formData.pincode || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Hub Code</Label>
                                <Input type="text" name="hub_code" value={formData.hub_code || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Latitude</Label>
                                <Input type="number" name="latitude" value={formData.latitude || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Longitude</Label>
                                <Input type="number" name="longitude" value={formData.longitude || ""} onChange={handleChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <Card className="mb-3">
                <CardHeader><h5 className="m-0">Operational Sub-details</h5></CardHeader>
                <CardBody>
                    <Row>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Cycler Count</Label>
                                <Input type="number" name="cycler" value={subData.cycler || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Biker Count</Label>
                                <Input type="number" name="biker" value={subData.biker || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Support Staff</Label>
                                <Input type="number" name="support_staff" value={subData.support_staff || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Amazon Staff</Label>
                                <Input type="number" name="amazon_staff" value={subData.amazon_staff || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Cargo Staff</Label>
                                <Input type="number" name="cargo_staff" value={subData.cargo_staff || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Pincode Count</Label>
                                <Input type="number" name="pincode_count" value={subData.pincode_count || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Bank Name</Label>
                                <Input type="text" name="bank_name" value={subData.bank_name || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Network Name</Label>
                                <Input type="text" name="network_name" value={subData.network_name || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Branch Manager</Label>
                                <Input type="text" name="branch_manager" value={subData.branch_manager || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Branch Supervisor</Label>
                                <Input type="text" name="branch_supervisor" value={subData.branch_supervisor || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label>Branch Executive</Label>
                                <Input type="text" name="branch_executive" value={subData.branch_executive || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={3}>
                            <FormGroup>
                                <Label>SF Station</Label>
                                <Input type="text" name="sf_station" value={subData.sf_station || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>User Tag</Label>
                                <Input type="text" name="user_tag" value={subData.user_tag || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Head Employee Code</Label>
                                <Input type="text" name="head_employee_code" value={subData.head_employee_code || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label>Main Service Centre</Label>
                                <Input type="text" name="main_service_center" value={subData.main_service_center || ""} onChange={handleSubChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4}>
                            <FormGroup check className="mt-2">
                                <Label check>
                                    <Input type="checkbox" name="wt_flag" checked={!!subData.wt_flag} onChange={handleSubChange} />
                                    WT Flag
                                </Label>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup check className="mt-2">
                                <Label check>
                                    <Input type="checkbox" name="is_active" checked={!!subData.is_active} onChange={handleSubChange} />
                                    Operational Details Active
                                </Label>
                            </FormGroup>
                        </Col>
                    </Row>
                </CardBody>
            </Card>

            <div className="flex gap-3 mt-4 justify-end">
                {onCancel && <Button color="secondary" outline onClick={onCancel}>Cancel</Button>}
                <Button color="primary" className="px-4 py-2 flex items-center gap-2" onClick={handleSubmit} disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Saving...</> : submitLabel}
                </Button>
            </div>
        </div>
    )
}

ServiceCentreForm.propTypes = {
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    subData: PropTypes.object.isRequired,
    setSubData: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    submitLabel: PropTypes.string,
    onCancel: PropTypes.func,
}

export default ServiceCentreForm
