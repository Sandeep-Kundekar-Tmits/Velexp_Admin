import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, Button } from "@/components/ui"

const BankDetailsStep = ({ formData, setFormData, onNextButtonClick, onPreButtonClick }) => {
    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    return (
        <div className="mt-4">
            <h4>Bank Details</h4>
            <div>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Bank Name</Label>
                            <Input type="text" name="bank_name" value={formData.bank_name || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Account Holder Name</Label>
                            <Input type="text" name="account_holder_name" value={formData.account_holder_name || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Account Number</Label>
                            <Input type="text" name="bank_account_number" value={formData.bank_account_number || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>IFSC Code</Label>
                            <Input type="text" name="ifsc_code" value={formData.ifsc_code || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Branch</Label>
                            <Input type="text" name="branch" value={formData.branch || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
                <Button color="primary" className="px-4 py-2" onClick={() => onPreButtonClick(2)}>Previous</Button>
                <Button color="primary" className="px-4 py-2" onClick={() => onNextButtonClick(4)}>Next</Button>
            </div>
        </div>
    )
}

BankDetailsStep.propTypes = {
    formData: PropTypes.object.isRequired,
    setFormData: PropTypes.func.isRequired,
    onNextButtonClick: PropTypes.func.isRequired,
    onPreButtonClick: PropTypes.func.isRequired,
}

export default BankDetailsStep
