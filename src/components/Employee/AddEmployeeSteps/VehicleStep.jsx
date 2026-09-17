import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, Button, Spinner } from "@/components/ui"

const VehicleStep = ({ formData, setFormData, onPreButtonClick, SubmiteForm, loading }) => {
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target
        if (type === "checkbox") setFormData((prev) => ({ ...prev, [name]: checked }))
        else if (type === "file") setFormData((prev) => ({ ...prev, [name]: files[0] }))
        else setFormData((prev) => ({ ...prev, [name]: value }))
    }

    return (
        <div className="mt-4">
            <h4>Vehicles</h4>
            <div>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Number</Label>
                            <Input type="text" name="vehicle_number" value={formData.vehicle_number || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Type</Label>
                            <Input type="text" placeholder="e.g. Truck, Van, Bike" name="vehicle_type" value={formData.vehicle_type || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Brand</Label>
                            <Input type="text" name="vehicle_brand" value={formData.vehicle_brand || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
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
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Cost</Label>
                            <Input type="number" name="vehicle_cost" value={formData.vehicle_cost || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Driving Licence No</Label>
                            <Input type="text" name="driving_licence_no" value={formData.driving_licence_no || ""} onChange={handleChange} />
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
                            <Label>Licence Document</Label>
                            <Input type="file" name="licence_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
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
                            <Label>Insurance Document</Label>
                            <Input type="file" name="insurance_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Pollution Valid Till</Label>
                            <Input type="date" name="pollution_valid_till" value={formData.pollution_valid_till || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Pollution Document</Label>
                            <Input type="file" name="pollution_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Vehicle Photo</Label>
                            <Input type="file" name="photo" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
                <Button color="primary" className="px-4 py-2" onClick={() => onPreButtonClick(3)}>Previous</Button>
                <Button color="primary" className="px-4 py-2 flex items-center gap-2" onClick={SubmiteForm} disabled={loading}>
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
