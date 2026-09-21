import { useState } from "react"
import PropTypes from "prop-types"
import { Row, Col, FormGroup, Label, Input, FormFeedback, Button } from "@/components/ui"
import Select from "react-select"
import { customStyles } from "../../../helpers/CustomStyle"
import { ACCOUNT_TYPE_OPTIONS } from "../employeeFormOptions"

const RequiredMark = () => <span className="text-danger-500"> *</span>

const BankDetailsStep = ({ formData, setFormData, onNextButtonClick, onPreButtonClick }) => {
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

    // Spreading e.target directly (`{...e.target}`) doesn't work here -- name/
    // type/value are inherited accessors on HTMLInputElement, not the target's
    // own enumerable properties, so the spread silently drops them.
    const handleUpperChange = (e) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value.toUpperCase() }))
    }

    const handleNext = () => {
        const newErrors = {}
        if (!formData?.account_holder_name) newErrors.account_holder_name = "Account holder name is required"
        if (!formData?.bank_name) newErrors.bank_name = "Bank name is required"
        if (!formData?.account_number) newErrors.account_number = "Account number is required"
        if (!formData?.ifsc_code) newErrors.ifsc_code = "IFSC code is required"
        if (!formData?.account_type) newErrors.account_type = "Account type is required"
        setErrors(newErrors)
        if (Object.keys(newErrors).length === 0) {
            onNextButtonClick(4)
        }
    }

    return (
        <div className="mt-4">
            <h4>Bank Details</h4>
            <div>
                <h6 className="text-ink-muted mt-3 mb-2">Bank Account Details</h6>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Bank Name<RequiredMark /></Label>
                            <Input type="text" name="bank_name" value={formData.bank_name || ""} onChange={handleChange} invalid={!!errors?.bank_name} />
                            <FormFeedback>{errors?.bank_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Account Holder Name<RequiredMark /></Label>
                            <Input type="text" name="account_holder_name" value={formData.account_holder_name || ""} onChange={handleChange} invalid={!!errors?.account_holder_name} />
                            <FormFeedback>{errors?.account_holder_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Account Number<RequiredMark /></Label>
                            <Input type="text" name="account_number" value={formData.account_number || ""} onChange={handleChange} invalid={!!errors?.account_number} />
                            <FormFeedback>{errors?.account_number}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>IFSC Code<RequiredMark /></Label>
                            <Input type="text" name="ifsc_code" value={formData.ifsc_code || ""} onChange={handleUpperChange} invalid={!!errors?.ifsc_code} />
                            <FormFeedback>{errors?.ifsc_code}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Bank Branch</Label>
                            <Input type="text" name="bank_branch" value={formData.bank_branch || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Account Type<RequiredMark /></Label>
                            <Select
                                options={ACCOUNT_TYPE_OPTIONS}
                                onChange={(option) => handleSelectChange("account_type", option)}
                                value={ACCOUNT_TYPE_OPTIONS.find((opt) => opt.value === formData.account_type) || null}
                                placeholder="Select Account Type"
                                isClearable
                                styles={customStyles}
                            />
                            {errors?.account_type && <div className="text-danger-500 text-sm mt-1">{errors.account_type}</div>}
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Digital Payment Details</h6>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>UPI ID</Label>
                            <Input type="text" name="upi_id" value={formData.upi_id || ""} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>

                <h6 className="text-ink-muted mt-3 mb-2">Status & Documents</h6>
                <Row>
                    <Col md={4}>
                        <FormGroup check className="mt-2">
                            <Label check>
                                <Input type="checkbox" name="is_default" checked={!!formData.is_default} onChange={handleChange} />
                                Default Account
                            </Label>
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Passbook Image</Label>
                            <Input type="file" name="passbook_image" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
            </div>
            <div className="flex gap-3 mt-5 justify-end">
                <Button color="primary" className="px-4 py-2" onClick={() => onPreButtonClick(2)}>Previous</Button>
                <Button color="primary" className="px-4 py-2" onClick={handleNext}>Next</Button>
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
