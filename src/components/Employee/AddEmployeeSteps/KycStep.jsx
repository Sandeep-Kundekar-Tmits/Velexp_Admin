import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, Button } from "@/components/ui"
import Select from "react-select"
import { customStyles } from "../../../helpers/CustomStyle"
import { KYC_STATUS_OPTIONS } from "../employeeFormOptions"

// Driving licence fields live here, not on the Vehicles tab -- a licence
// belongs to the person, not any one vehicle they're assigned. Matches the
// reference implementation's tab boundaries.
const KycStep = ({ formData, setFormData, onNextButtonClick, onPreButtonClick }) => {
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target
        if (type === "checkbox") setFormData((prev) => ({ ...prev, [name]: checked }))
        else if (type === "file") setFormData((prev) => ({ ...prev, [name]: files[0] }))
        else setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name, option) => {
        setFormData((prev) => ({ ...prev, [name]: option?.value ?? null }))
    }

    // Spreading e.target directly (`{...e.target}`) doesn't work here -- name/
    // type/value are inherited accessors on HTMLInputElement, not the target's
    // own enumerable properties, so the spread silently drops them.
    const handleUpperChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
    }

    return (
        <div className="mt-4">
            <h4>KYC</h4>
            <div>
                <h6 className="text-ink-muted mt-3 mb-2">Identity Details</h6>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Aadhar Number</Label>
                            <Input type="text" name="aadhar_number" value={formData.aadhar_number || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>PAN Number</Label>
                            <Input type="text" name="pan_number" value={formData.pan_number || ""} onChange={handleUpperChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Driving Licence Details</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Driving Licence No</Label>
                            <Input type="text" name="driving_licence_no" value={formData.driving_licence_no || ""} onChange={handleUpperChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Licence Type</Label>
                            <Input type="text" placeholder="e.g. Heavy, Light" name="licence_type" value={formData.licence_type || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Licence Issued State</Label>
                            <Input type="text" name="licence_issued_state" value={formData.licence_issued_state || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Licence Issued Date</Label>
                            <Input type="date" name="licence_issued_date" value={formData.licence_issued_date || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Licence Expiry Date</Label>
                            <Input type="date" name="licence_expiry_date" value={formData.licence_expiry_date || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Licence Image</Label>
                            <Input type="file" name="licence_image" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">KYC Status</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>KYC Status</Label>
                            <Select
                                options={KYC_STATUS_OPTIONS}
                                onChange={(option) => handleSelectChange("kyc_status", option)}
                                value={KYC_STATUS_OPTIONS.find((opt) => opt.value === formData.kyc_status) || KYC_STATUS_OPTIONS[0]}
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup check className="mt-4">
                            <Label check>
                                <Input type="checkbox" name="kyc_is_active" checked={!!formData.kyc_is_active} onChange={handleChange} />
                                Active
                            </Label>
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">KYC Documents</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>PAN Image</Label>
                            <Input type="file" name="pan_image" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Aadhar Front</Label>
                            <Input type="file" name="aadhar_front" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Aadhar Back</Label>
                            <Input type="file" name="aadhar_back" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Passbook Image</Label>
                            <Input type="file" name="kyc_passbook_image" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
                <Button color="primary" className="px-4 py-2" onClick={() => onPreButtonClick(1)}>Previous</Button>
                <Button color="primary" className="px-4 py-2" onClick={() => onNextButtonClick(3)}>Next</Button>
            </div>
        </div>
    )
}

KycStep.propTypes = {
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    onNextButtonClick: PropTypes.func.isRequired,
    onPreButtonClick: PropTypes.func.isRequired,
}

export default KycStep
