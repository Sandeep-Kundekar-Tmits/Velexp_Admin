import React, { useMemo, useState } from 'react';
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Col,
    Row,
    FormFeedback
} from 'reactstrap';
import { customStyles } from '../../helpers/CustomStyle';
import locations from "../../data/locations.json"
import Select from "react-select";
const AddUserForm = ({ formData, setFormData, onNextButtonClick, setFrachiseeData }) => {


    // const [formData, setFormData] = useState({
    //     first_name: '',
    //     last_name: '',
    //     email: '',
    //     phone: '',
    //     username: '',
    //     password: '', // Always keep blank for security
    //     accno: '',
    //     otp: '',
    //     cust_type: '',
    //     customer_name: '',
    //     kyc_document: null,
    //     kyc_approved: false,
    //     // wallet_amount: isToUpdate ? editData?.wallet_amount : 0.0,
    //     billing_type: '',
    //     gst_no: '',
    //     pan_no: ''
    // });

    // const AllCities = locations
    //     .flatMap(state => state.cities) // Combine all cities from all states into one array
    //     .map(obj => ({
    //         value: obj.name,
    //         label: obj.name
    //     }));

    const [CustomerCharCount, setCustomerCharCount] = useState(0)
    function isNumber(input) {
        return /^-?\d*\.?\d*$/.test(input); // Allows empty string
    }

    const [selectedCity, setSelectedCity] = useState("")
    const AllCities = useMemo(() => {
        return locations
            .flatMap(state => state.cities) // Combine all cities from all states into one array
            .map(obj => ({
                value: obj.name,
                label: obj.name
            }));
    }, [])


    // const GetAllPinCodes = useMemo(() => {
    //     if (!selectedCity) return []; // ✅ Return empty array if city is not selected

    //     return locations
    //         .flatMap(state => state.cities)
    //         .filter(city => city.name === selectedCity)
    //         .map(city => ({
    //             value: city.pincode,
    //             label: city.pincode,
    //         }));
    // }, [selectedCity]);
    const [errors, setErrors] = useState({});


    const handleSelectDropdownChange = (name, option) => {

        if (name === "city") {
            setFormData((prev) => ({
                ...prev,
                pincode: null
            }))
        }
        setFormData((prev) => ({
            ...prev,
            [name]: option.value
        }))
    }

    const handleChange = (e) => {
        const { name, value, type, checked, files } = e.target;
        let error = {}
        if (name === "gst_no") {
            setFrachiseeData((prev) => {
                return {
                    ...prev,
                    gst_no: value
                }
            })
        }

        if (type === 'checkbox') {
            setFormData({ ...formData, [name]: checked });
        } else if (type === 'file') {
            setFormData({ ...formData, [name]: files[0] });
        } else {
            if (name === "customer_name") {
                let count = value.trim().length;
                setCustomerCharCount(count);

                // Only update formData if under 50 characters
                if (count < 50) {
                    setFormData({ ...formData, [name]: value });
                }
                else {
                    setCustomerCharCount(count);
                    setFormData({ ...formData, [name]: value.trim().substring(0, 50) });
                    error.customer_name = "Not allowed to enter more then 50 characters"
                }
                setErrors(error)
            } else {
                // For other fields, update normally
                setFormData({ ...formData, [name !== "customer_name" && name]: value });
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const errors = {};

        // First Name validation
        if (!formData.first_name || !formData.first_name.trim()) {
            errors.first_name = 'First name is required';
        } else if (formData.first_name.length < 2) {
            errors.first_name = 'First name must be at least 2 characters';
        }

        // Last Name validation
        if (!formData.last_name || !formData.last_name.trim()) {
            errors.last_name = 'Last name is required';
        } else if (formData.last_name.length < 2) {
            errors.last_name = 'Last name must be at least 2 characters';
        }

        // Email validation
        if (!formData.email || !formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email.trim())) {
            errors.email = 'Email is invalid';
        }

        // if (formData.cust_type === "3") {
        //     if (!formData?.gst_no) {
        //         errors.gst_no = 'GST No is required';
        //     }
        // }

        // Phone validation
        if (!formData.phone) {
            errors.phone = 'Phone number is required';
        } else if (!/^\d{10}$/.test(formData.phone)) {
            errors.phone = 'Phone number must be exactly 10 digits';
        }
        // Username validation
        if (!formData.username) {
            errors.username = 'Username is required';
        } else if (formData.username.length < 4) {
            errors.username = 'Username must be at least 4 characters';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        }

        // Account number validation
        // if (!formData.accno) {
        //     errors.accno = 'Account number is required';
        // } else if (!/^\d{10,20}$/.test(formData.accno.trim())) {
        //     errors.accno = 'Account number must be 10-20 digits';
        // }

        // Customer type validation
        if (!formData.cust_type) {
            errors.cust_type = 'Customer type is required';
        }

        if (!formData.customer_name) {
            errors.customer_name = 'Customer  name is required';
        }

        //  
        if (!formData?.city) {
            errors.city = 'City name is required';
        }

        if (!formData?.pincode) {
            errors.pincode = 'Pincode is required';
        }
        if (!formData?.referred_by) {
            errors.referred_by = 'referred by is required';
        }
        if (!formData?.industry) {
            errors.industry = 'industry is required';
        }
        console.log(errors, "errors")


        if (Object.keys(errors).length === 0) {
            console.log(errors, formData)
            onNextButtonClick(2)
            setErrors(null);
        } else {
            setErrors(errors);
        }
    };

    return (
        <div className="mt-4">
            <h4>Add New User</h4>
            {/* add user form */}
            <div>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>First Name</Label>
                            <Input type="text" name="first_name" value={formData.first_name} onChange={handleChange} invalid={!!errors?.first_name} />
                            <FormFeedback>{errors?.first_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Last Name</Label>
                            <Input type="text" name="last_name" value={formData.last_name} onChange={handleChange} invalid={!!errors?.last_name} />
                            <FormFeedback>{errors?.last_name}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Email</Label>
                            <Input type="email" name="email" value={formData.email} onChange={handleChange} invalid={!!errors?.email} />
                            <FormFeedback>{errors?.email}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Phone</Label>
                            <Input type="text" name="phone" value={formData.phone} onChange={handleChange} invalid={!!errors?.phone} />
                            <FormFeedback>{errors?.phone}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Username</Label>
                            <Input type="text" name="username" value={formData.username} onChange={handleChange} invalid={!!errors?.username} />
                            <FormFeedback>{errors?.username}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Password</Label>
                            <Input type="password" name="password" value={formData.password} onChange={handleChange} invalid={!!errors?.password} />
                            <FormFeedback>{errors?.password}</FormFeedback>
                        </FormGroup>
                    </Col>
                    {/* <Col md={6}>
                        <FormGroup>
                            <Label>Account No</Label>
                            <Input type="text" name="accno" value={formData.accno} onChange={handleChange} invalid={!!errors?.accno} />
                            <FormFeedback>{errors?.accno}</FormFeedback>
                        </FormGroup>
                    </Col> */}
                </Row>
                <Row>
                    {/* <Col md={6}>
                        <FormGroup>
                            <Label>OTP (Optional)</Label>
                            <Input type="text" name="otp" value={formData.otp} onChange={handleChange} />
                        </FormGroup>
                    </Col> */}
                    <Col md={6}>
                        <FormGroup>
                            <Label>Customer Type</Label>
                            <Input type="select" name="cust_type" value={formData.cust_type} onChange={handleChange} invalid={!!errors?.cust_type}>
                                <option value="">Select Type</option>
                                <option value="2">Corporate</option>
                                {/* <option value="1">Retail</option> */}
                                <option value="3">Franchise</option>
                            </Input>
                            <FormFeedback>{errors?.cust_type}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <FormGroup>
                    <Label>Customer Name</Label>
                    <Input type="text" name="customer_name" value={formData.customer_name} onChange={handleChange} invalid={!!errors?.customer_name} />
                    <small>{CustomerCharCount}/50</small>
                    <FormFeedback>{errors?.customer_name}</FormFeedback>
                </FormGroup>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Lead Generated By</Label>
                            <Input type="text" name="referred_by" value={formData?.referred_by} placeholder='Enter Lead Generated By' onChange={handleChange} invalid={!!errors?.referred_by} />
                            <FormFeedback>{errors?.referred_by}</FormFeedback>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Type of Industry</Label>
                            <Input type="text" name="industry" value={formData?.industry} placeholder='Enter Type of Industry' onChange={handleChange} invalid={!!errors?.industry} />
                            <FormFeedback>{errors?.industry}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Soft Limit</Label>
                            <Input type="number" name="soft_limit" value={formData.soft_limit} placeholder="Enter Soft Limit" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Customer Potential</Label>
                            <Input type="text" name="customer_potential" value={formData.customer_potential} placeholder="Enter Potential" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={4}>
                        <FormGroup>
                            <Label>Expected Business</Label>
                            <Input type="number" name="expected_business" value={formData.expected_business} placeholder="Expected Business" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Sales Head</Label>
                            <Input type="text" name="sales_head" value={formData.sales_head} placeholder="Enter Sales Head" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Employee Code</Label>
                            <Input type="text" name="emp_code" value={formData.emp_code} placeholder="Enter Employee Code" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Finance Emails (Comma separated)</Label>
                            <Input type="text" name="finance_emails" value={formData.finance_emails} placeholder="email1@example.com, email2@example.com" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Customer Agreement Document</Label>
                            <Input type="file" name="customer_agreement_doc" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    <Col md={6}>
                        <FormGroup>
                            <Label>KYC Document (Optional)</Label>
                            <Input type="file" name="kyc_document" onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup check className="mt-4">
                            <Label check>
                                <Input type="checkbox" name="kyc_approved" checked={formData.kyc_approved} onChange={handleChange} />
                                KYC Approved (Optional)
                            </Label>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    {/* <Col md={6}>
                        <FormGroup>
                            <Label>Wallet Amount</Label>
                            <Input type="number" step="0.01" name="wallet_amount" value={formData.wallet_amount} onChange={handleChange} />
                        </FormGroup>
                    </Col> */}
                    <Col md={6}>
                        <FormGroup>
                            <Label>Billing Type (Optional)</Label>
                            <Input type="text" name="billing_type" value={formData.billing_type} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>City</Label>
                            {/* <Input type="text" name="city" value={formData.city} onChange={handleChange} invalid={!!errors?.city} /> */}
                            <Select
                                options={AllCities}
                                onChange={(option) => {
                                    handleSelectDropdownChange("city", option)
                                    setSelectedCity(option.value)
                                    console.log(option, "dhsid")
                                }}
                                value={{
                                    value: formData.city,
                                    label: formData.city,
                                }}
                                placeholder="Select Cities"
                                styles={customStyles}
                            />
                            <small className='text-danger'>{errors?.city}</small>
                        </FormGroup>
                    </Col>
                    <Col md={6}>
                        <FormGroup>
                            <Label>Pincode</Label>
                            <Input type="text" name="pincode" value={formData.pincode} onChange={(e) => { isNumber(e.target.value) && handleChange(e) }} invalid={!!errors?.pincode} />
                            {/* <Select
                                options={GetAllPinCodes}
                                onChange={(option) => handleSelectDropdownChange("pincode", option)}
                                value={{
                                    value: formData.pincode,
                                    label: formData.pincode,
                                }}
                                placeholder="Select Cities"
                                styles={customStyles}
                            /> */}
                            <FormFeedback>{errors?.pincode}</FormFeedback>
                        </FormGroup>
                    </Col>
                </Row>
                <Row>
                    {
                        <Col md={6}>
                            <FormGroup>
                                <Label>GST No(Optional)</Label>
                                <Input type="text" name="gst_no" value={formData.gst_no} onChange={handleChange} invalid={!!errors?.gst_no} />
                                <FormFeedback>{errors?.gst_no}</FormFeedback>
                            </FormGroup>
                        </Col>
                    }
                    <Col md={6}>
                        <FormGroup>
                            <Label>PAN No (Optional)</Label>
                            <Input type="text" name="pan_no" value={formData.pan_no} onChange={handleChange} />
                        </FormGroup>
                    </Col>
                </Row>
            </div>



            <div className='d-flex gap-3 mt-5 justify-content-end'>
                <Button color="primary" className='px-4 py-2' onClick={handleSubmit}>Next</Button>
            </div>
        </div>
    );
};

export default AddUserForm;
