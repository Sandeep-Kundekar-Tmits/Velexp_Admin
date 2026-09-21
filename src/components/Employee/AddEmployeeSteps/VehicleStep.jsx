import { useState } from "react"
import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, FormFeedback, Button, Spinner } from "@/components/ui"
import Select from "react-select"
import { customStyles } from "../../../helpers/CustomStyle"
import { VEHICLE_TYPE_OPTIONS, FUEL_TYPE_OPTIONS, OWNERSHIP_TYPE_OPTIONS } from "../employeeFormOptions"

const RequiredMark = () => <span className="text-danger-500"> *</span>

// Driving licence fields moved to the KYC tab (a licence belongs to the
// person, not the vehicle) -- see KycStep.jsx.
const VehicleStep = ({ formData, setFormData, onPreButtonClick, SubmiteForm, loading }) => {
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target
        if (type === "checkbox") setFormData((prev) => ({ ...prev, [name]: checked }))
        else if (type === "file") setFormData((prev) => ({ ...prev, [name]: files[0] }))
        else setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSelectChange = (name, option) => {
        setFormData((prev) => ({ ...prev, [name]: option?.value ?? null }))
    }

    const handleSubmitClick = () => {
        const newErrors = {}
        if (!formData?.vehicle_number) newErrors.vehicle_number = "Vehicle number is required"
        if (!formData?.vehicle_type) newErrors.vehicle_type = "Vehicle type is required"
        setErrors(newErrors)
        if (Object.keys(newErrors).length === 0) {
            SubmiteForm()
        }
    }

    return (
        <div className="mt-4">
            <h4>Vehicles</h4>
            <div>
                <h6 className="text-ink-muted mt-3 mb-2">Vehicle Details</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Number<RequiredMark /></Label>
                            <Input type="text" name="vehicle_number" value={formData.vehicle_number || ""} onChange={handleChange} invalid={!!errors?.vehicle_number} />
                            <FormFeedback>{errors?.vehicle_number}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Type<RequiredMark /></Label>
                            <Select
                                options={VEHICLE_TYPE_OPTIONS}
                                onChange={(option) => handleSelectChange("vehicle_type", option)}
                                value={VEHICLE_TYPE_OPTIONS.find((opt) => opt.value === formData.vehicle_type) || null}
                                placeholder="Select Vehicle Type"
                                isClearable
                                styles={customStyles}
                            />
                            {errors?.vehicle_type && <div className="text-danger-500 text-sm mt-1">{errors.vehicle_type}</div>}
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Fuel Type</Label>
                            <Select
                                options={FUEL_TYPE_OPTIONS}
                                onChange={(option) => handleSelectChange("fuel_type", option)}
                                value={FUEL_TYPE_OPTIONS.find((opt) => opt.value === formData.fuel_type) || null}
                                placeholder="Select Fuel Type"
                                isClearable
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Ownership Type</Label>
                            <Select
                                options={OWNERSHIP_TYPE_OPTIONS}
                                onChange={(option) => handleSelectChange("ownership_type", option)}
                                value={OWNERSHIP_TYPE_OPTIONS.find((opt) => opt.value === formData.ownership_type) || null}
                                placeholder="Select Ownership Type"
                                isClearable
                                styles={customStyles}
                            />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Registration Date</Label>
                            <Input type="date" name="registration_date" value={formData.registration_date || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>RC Number</Label>
                            <Input type="text" name="rc_number" value={formData.rc_number || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Brand</Label>
                            <Input type="text" name="vehicle_brand" value={formData.vehicle_brand || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Capacity</Label>
                            <Input type="text" name="vehicle_capacity" value={formData.vehicle_capacity || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Category</Label>
                            <Input type="text" placeholder="e.g. Owned, Rented" name="vehicle_category" value={formData.vehicle_category || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Cost</Label>
                            <Input type="number" name="vehicle_cost" value={formData.vehicle_cost || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Insurance & Compliance</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Insurance Number</Label>
                            <Input type="text" name="insurance_number" value={formData.insurance_number || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Insurance Valid Till</Label>
                            <Input type="date" name="insurance_valid_till" value={formData.insurance_valid_till || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Pollution Valid Till</Label>
                            <Input type="date" name="pollution_valid_till" value={formData.pollution_valid_till || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Vehicle Documents</h6>
                <Row>
                    <Col md={3}>
                        <FormGroup>
                            <Label>RC Document</Label>
                            <Input type="file" name="rc_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label>Insurance Document</Label>
                            <Input type="file" name="insurance_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label>Pollution Document</Label>
                            <Input type="file" name="pollution_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label>Vehicle Photo</Label>
                            <Input type="file" name="photo" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Remarks</h6>
                <Row>
                    <Col md={12}>
                        <FormGroup>
                            <Input type="textarea" name="vehicle_remarks" value={formData.vehicle_remarks || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
                <Button color="primary" className="px-4 py-2" onClick={() => onPreButtonClick(3)}>Previous</Button>
                <Button color="primary" className="px-4 py-2 flex items-center gap-2" onClick={handleSubmitClick} disabled={loading}>
                    {loading ? <><Spinner size="sm" /> Saving...</> : "Submit"}
                </Button>
            </div>
        </div>
    )
}

VehicleStep.propTypes = {
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    onPreButtonClick: PropTypes.func.isRequired,
    SubmiteForm: PropTypes.func.isRequired,
    loading: PropTypes.bool,
}

export default VehicleStep
