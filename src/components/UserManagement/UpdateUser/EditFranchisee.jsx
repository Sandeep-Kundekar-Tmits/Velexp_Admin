import { Card, CardBody, CardHeader, Col, FormFeedback, FormGroup, Input, Label, Row } from "reactstrap";

const EditFranchisee = ({ formData, handleChange }) => {
    const renderInput = (label, name, errorMessage, type = 'text') => (
        <FormGroup className="mb-3">
            <Label for={name}>{label}</Label>
            <Input
                type={type}
                name={name}
                id={name}
                value={formData?.franchise_profile?.[name] || ''}
                onChange={handleChange}
                invalid={!!errorMessage}
            />
            <FormFeedback>{errorMessage}</FormFeedback>
        </FormGroup>
    );

    const renderCheckbox = (label, name) => (
        <FormGroup check className="mb-2">
            <Label check>
                <Input
                    type="checkbox"
                    name={name}
                    id={`checkbox-${name}`}
                    checked={formData?.franchise_profile?.[name] || false}
                    onChange={handleChange}
                />{' '}
                {label}
            </Label>
        </FormGroup>
    );

    return (
        <Card className="mb-4">
            <CardHeader>Edit Franchisee</CardHeader>
            <CardBody>
                <div>
                    {renderCheckbox('Postpaid Payment', 'postpaid_payment')}
                    <Row>
                        <Col md={6}>
                            {renderInput('Franchise Name', 'franchise_name')}
                            {renderInput('Contact Person', 'contact_person')}
                            {renderInput('Address Line 1 (Optional)', 'address1')}
                            {renderInput('Address Line 2', 'address2')}
                            {renderInput('City', 'city')}
                            {renderInput('State', 'state')}
                            {renderInput('Country (Optional)', 'country')}
                            {renderInput('Landmark (Optional)', 'landmark')}
                            {renderInput('Pincode', 'pincode')}
                            {renderInput('Telephone 1 (Optional)', 'telephone1')}
                            {renderInput('Telephone 2', 'telephone2')}
                            {renderInput('Alt Mobile (Optional)', 'alt_mobile')}
                            {renderInput('Customer Billing State (Optional)', 'customer_billing_state')}
                            {renderInput('Branch (Optional)', 'branch')}
                            {renderInput('Start Date', 'start_date', "", "date")}
                            {renderInput('Origin (Optional)', 'origin')}
                            {renderInput('Origin Code (Optional)', 'origin_code')}
                            {renderInput('GST No. (Optional)', 'gst_no')}
                            {renderInput('PAN No. (Optional)', 'pan_no')}
                            {renderInput('TAN No. (Optional)', 'tan_no')}
                            <FormGroup className="mb-3">
                                <Label for="billing_type">Billing Type (Optional)</Label>
                                <Input
                                    type="select"
                                    name="billing_type"
                                    id="billing_type"
                                    value={formData?.franchise_profile?.billing_type || ''}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Billing Type</option>
                                    <option value="Prepaid">Prepaid</option>
                                    <option value="Postpaid">Postpaid</option>
                                </Input>
                            </FormGroup>
                        </Col>

                        <Col md={6}>
                            {renderInput('Credit Days (Optional)', 'credit_days')}
                            {renderInput('Credit Percent (Optional)', 'credit_percent')}
                            {renderInput('Unbilled Amount (Optional)', 'unbilled_amount')}
                            {renderInput('Volume Discount (Optional)', 'volume_discount')}
                            {renderInput('Contact Origin (Optional)', 'contact_origin')}
                            {renderInput('IEC No. (Optional)', 'iec_no')}
                            {renderInput('Bank AD Code (Optional)', 'bank_ad_code')}
                            {renderInput('Bank Account (Optional)', 'bank_account')}
                            {renderInput('Bank IFSC (Optional)', 'bank_ifsc')}
                            {renderInput('LUT No. (Optional)', 'lut_no')}
                            {renderInput('LUT Issue Date (Optional)', 'lut_issue_date', "", 'date')}
                            {renderInput('LUT Till Date (Optional)', 'lut_till_date', "", 'date')}
                            {renderInput('Shipper Type (Optional)', 'shipper_type')}
                            {renderInput('Customer Message (Optional)', 'customer_msg')}
                            {renderInput('Account Email (Optional)', 'account_email', '', "email")}
                            {renderInput('Geolocation (Optional)', 'geolocation')}
                            {renderInput('Velexp Address (Optional)', 'velexp_address')}

                            <hr />
                            {renderCheckbox('Disable Customer Origin', 'disable_customer_origin')}
                            {renderCheckbox('Email Booking Info', 'email_booking_info')}
                            {renderCheckbox('SMS Booking Info', 'sms_booking_info')}
                            {renderCheckbox('Email Forwarding Info', 'email_forwarding_info')}
                            {renderCheckbox('Email On Progress', 'email_on_progress')}
                            {renderCheckbox('Email POD Info', 'email_pod_info')}
                            {renderCheckbox('SMS POD Info', 'sms_pod_info')}
                            {renderCheckbox('E-Invoice', 'e_invoice')}
                            {renderCheckbox('WhatsApp Booking Info', 'whatsapp_booking_info')}
                            {renderCheckbox('WhatsApp Delivery Info', 'whatsapp_delivery_info')}
                        </Col>
                    </Row>
                </div>
            </CardBody>
        </Card>
    );
};

export default EditFranchisee;