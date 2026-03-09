import React, { useEffect, useMemo, useState } from 'react';
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Row,
    Col,
    Collapse,
    FormFeedback,
} from 'reactstrap';
import locations from "../../data/locations.json"
import { Country, State, City } from "country-state-city";
import { customStyles } from '../../helpers/CustomStyle';
import Select from "react-select";
import { useGetApiCall } from '../../hooks/useGetApiCall';
import { GET_ADDRESS } from '../../api';
const AddFranchiseeForm = ({ formData, setFormData, SubmitForm, onPreButtonClick }) => {
    const [errors, setErrors] = useState()
    const [velexpAddress, setVelexpAddress] = useState()
    // api callings
    const { apifunc: getAddresses, data, error, loading } = useGetApiCall()

    const handleChange = (e) => {
        const { name, type, value, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const [AddressOptions, setAddressOption] = useState([])
    // getting the velexp address
    useEffect(() => {
        getAddresses(GET_ADDRESS)
    }, [])

    // setting select dropdonw formate
    useEffect(() => {
        let addressData = data?.map((ele) => {
            return {
                value: ele?.id?.toString(),
                label: ele?.address
            }
        })
        setAddressOption(addressData)
    }, [data])


    const handleAddressDropdownChange = (option) => {
        setFormData({
            ...formData,
            velexp_address: option.value.toString()
        })
        let updatedAddress = option.label?.split(",")
        console.log(updatedAddress,"updatedAddress")
        setVelexpAddress(updatedAddress[updatedAddress?.length-1])
    }

    const handleSubmit = (e) => {
        const errors = {};

        // Required string fields (non-empty)
        const requiredStringFields = [
            'franchise_name',
            'contact_person',
            'state',
            'pincode',
            'address2'
        ];

        requiredStringFields.forEach(field => {
            if (!formData[field]) {
                errors[field] = `${field.replace(/_/g, ' ')} is required`;
            }
        });


        if (!formData?.city) {
            errors.city = 'City is required';
        }

        // Special format validations
        if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
            errors.pincode = 'Pincode must be 6 digits';
        }

        if (formData.telephone2 && !/^\d{10,15}$/.test(formData.telephone2)) {
            errors.telephone2 = 'Telephone must be 10-15 digits';
        }
        else if (!formData.telephone2) {
            errors.telephone2 = 'Telephone  is required';
        }

        // Date validation
        if (!formData.start_date) {
            errors.start_date = 'Start date is required';
        } else if (new Date(formData.start_date) >= new Date()) {
            errors.start_date = 'Start date cannot be in the future';
        }
        if (!formData?.velexp_address) {
            errors.velexp_address = 'Velexp address  is required';
        }

        if (Object.keys(errors).length === 0) {
            // Proceed with form submission
            console.log('Form is valid', formData);
            setErrors({});
            console.log(error, "error11")
            SubmitForm()
        } else {
            // Show errors to user
            setErrors(errors);
            console.log('Validation errors', errors, formData);
        }
        e.preventDefault();
        console.log('Submitted data:', errors);
    };


    // select dropdown on change
    const selectDropdownChange = (field, option) => {

        if (field === "state") {
            setFormData((prev) => {
                return {
                    ...prev,
                    city: null
                }
            })
        }

        setFormData((prev) => {
            return {
                ...prev,
                [field]: option?.label
            }
        })
    }


    const [selectedStates, setSelectedStates] = useState("")

    // get all States
    const AllStates = useMemo(() => {
        return locations.map((ele) => ({
            value: ele.state,
            label: ele?.state
        }))
    }, [])



    // get all filtered  Cities
    const AllCities = useMemo(() => {

        if (!selectedStates) return []
        return locations.filter((ele) => ele.state === selectedStates)
            .flatMap(state => state.cities)
            .map(obj => ({
                value: obj.name,
                label: obj.name
            }));
    }, [selectedStates])

    const renderInput = (label, name, errorMessage, type = 'text') => (
        <FormGroup className="mb-3">
            <Label for={name}>{label}</Label>
            <Input
                type={type}
                name={name}
                id={name}
                value={formData[name]}
                onChange={handleChange}
                invalid={!!errorMessage}
            />
            <FormFeedback className='text-capitalize'>{errorMessage}</FormFeedback>
        </FormGroup>
    );

    const renderCheckbox = (label, name) => (
        <FormGroup check className="mb-2">
            <Label check>
                <Input
                    type="checkbox"
                    name={name}
                    checked={formData[name]}
                    onChange={handleChange}
                />{' '}
                {label}
            </Label>
        </FormGroup>
    );

    return (
        <div className="mt-4">

            <h4>Add Franchise</h4>

            <div >
                {renderCheckbox('Postpaid Payment', 'postpaid_payment')}
                <Row>
                    <Col md={6}>
                        {renderInput('Franchise Name', 'franchise_name', errors?.franchise_name)}
                        {renderInput('Contact Person', 'contact_person', errors?.contact_person)}
                        {renderInput('Address Line 1 (Optional)', 'address1')}
                        {renderInput('Address Line 2', 'address2', errors?.address2)}
                        {/* {renderInput('Country (Optional)', 'country',)} */}
                        <FormGroup className="mb-3">
                            <Label >Country</Label>
                            <Input
                                disabled
                                type="text"
                                name={"country"}
                                id={"country"}
                                value={formData?.country}
                            // onChange={handleChange}
                            // invalid={!!errorMessage}
                            />
                            {/* <FormFeedback>{errorMessage}</FormFeedback> */}
                        </FormGroup>
                        <FormGroup className="mb-3">
                            <Label>State</Label>
                            <Select
                                options={AllStates}
                                onChange={(option) => {
                                    setSelectedStates(option.value)
                                    selectDropdownChange("state", option)
                                }}
                                value={{
                                    value: formData.state,
                                    label: formData.state
                                }}
                                // value={formData.state}
                                placeholder="Select State"
                                isClearable={true}
                                styles={customStyles}
                            />
                            <small className='text-danger text-capitalize'>{errors?.state}</small>
                        </FormGroup>
                        <FormGroup className="mb-3">
                            <Label>City</Label>
                            <Select
                                options={AllCities}
                                onChange={(option) => {

                                    selectDropdownChange("city", option)
                                }}
                                value={{
                                    value: formData.city,
                                    label: formData.city
                                }}
                                // value={formData.city}
                                placeholder="Select city"
                                isClearable={true}
                                styles={customStyles}
                            />
                            <small className='text-danger'>{errors?.city}</small>
                        </FormGroup>

                        {/* {renderInput('State', 'state', errors?.state)} */}
                        {/* {renderInput('City', 'city', errors?.city)} */}
                        {renderInput('Landmark (Optional)', 'landmark')}
                        {renderInput('Pincode', 'pincode', errors?.pincode)}
                        {renderInput('Telephone 1 (Optional)', 'telephone1')}
                        {renderInput('Telephone 2', 'telephone2', errors?.telephone2)}
                        {renderInput('Alt Mobile (Optional)', 'alt_mobile')}
                        {renderInput('Customer Billing State (Optional)', 'customer_billing_state')}
                        {renderInput('Branch (Optional)', 'branch')}
                        {renderInput('Start Date', 'start_date', errors?.start_date, "date")}
                        {renderInput('Origin (Optional)', 'origin')}
                        {renderInput('Origin Code (Optional)', 'origin_code')}
                        {renderInput('GST No. (Optional)', 'gst_no')}
                        {renderInput('PAN No. (Optional)', 'pan_no')}
                        {renderInput('TAN No. (Optional)', 'tan_no')}
                        {/* <FormGroup className="mb-3">
                            <Label for="billing_type">Billing Type (Optional)</Label>
                            <Input
                                type="select"
                                name="billing_type"
                                id="billing_type"
                                value={formData.billing_type}
                                onChange={handleChange}
                            >
                                <option value="">Select Billing Type</option>
                                <option value="Prepaid">Prepaid</option>
                                <option value="Postpaid">Postpaid</option>
                            </Input>
                        </FormGroup> */}
                    </Col>

                    <Col md={6}>
                        {renderInput('Credit Days (Optional)', 'credit_days', "", "number")}
                        {renderInput('Credit Percent (Optional)', 'credit_percent', "", "number")}
                        {renderInput('Unbilled Amount (Optional)', 'unbilled_amount', "", "number")}
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
                        {/* {renderInput('Velexp Address', 'velexp_address',"","number")} */}


                        <FormGroup className="mb-3">
                            <Label>Velexp Address</Label>
                            <Select
                                options={AddressOptions}
                                onChange={(option) => handleAddressDropdownChange(option)}
                                value={{
                                    value: velexpAddress,
                                    label: velexpAddress
                                }}
                                isClearable
                                placeholder="Select Address"
                                styles={customStyles}
                            />
                            <h6 className='mt-2'>Velexp Address</h6>
                          
                            <small className='text-danger'>{errors?.velexp_address}</small>
                        </FormGroup>


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
                <div className='d-flex gap-3 mt-5 justify-content-end'>
                    <Button color="primary" className='px-4 py-2' onClick={() => {
                        onPreButtonClick(2)
                    }}>Prev</Button>
                    <Button color="primary" className='px-4 py-2' onClick={handleSubmit}>Submit</Button>
                </div>
            </div>
        </div>
    );
};

export default AddFranchiseeForm;
