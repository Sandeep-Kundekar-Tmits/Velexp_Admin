import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, Button } from "@/components/ui"

const KycStep = ({ formData, setFormData, onNextButtonClick, onPreButtonClick }) => {
    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target
        if (type === "checkbox") setFormData((prev) => ({ ...prev, [name]: checked }))
        else if (type === "file") setFormData((prev) => ({ ...prev, [name]: files[0] }))
        else setFormData((prev) => ({ ...prev, [name]: value }))
    }

    return (
        <div className="mt-4">
            <h4>KYC</h4>
            <div>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>KYC Document</Label>
                            <Input type="file" name="kyc_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup check className="mt-4">
                            <Label check>
                                <Input type="checkbox" name="kyc_approved" checked={!!formData.kyc_approved} onChange={handleChange} />
                                KYC Approved
                            </Label>
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
