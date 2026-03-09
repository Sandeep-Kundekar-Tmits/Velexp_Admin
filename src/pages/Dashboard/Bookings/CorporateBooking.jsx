// CorporateBookingForm.js
import React, { useEffect, useState } from "react";
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Row,
    Col,
    FormFeedback,
    Card,
    CardBody,
    CardHeader,
    Spinner,
} from "reactstrap";
import { User, MapPin, Package, Calendar, Truck } from "lucide-react";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { CORPORATE_BOOKING, GET_USER_API, PRODUCT_LIST } from "../../../api";
import Select from 'react-select'
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { customStyles } from "../../../helpers/CustomStyle";
import { useNavigate } from "react-router-dom";

const CorporateBooking = () => {

    const navigate=useNavigate()
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    // select user option
    const [UserListOptions, setUserListOption] = useState([])
    // product list
    const [ProductListOption, setProductListOption] = useState([])

    //  defining the corporate booking api
    const { apifunc: CorporateBooking, loading: corporatebookingloading } = usePostApiCall(null)

    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()
    //  defining the get product api
    const { apifunc: GetProductsList, data: ProductList, loading: ProductListLoading } = useGetApiCall()
    const date = new Date(); // current date
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        accno: "",
        secret_code: "",
        user_id: JSON.parse(localStorage.getItem("authUser"))?.user?.id,
        CustomerName: "",
        customer_id: "",
        serviceType: "",
        Product_Description: "",
        Order_ID: "",
        length: 0,
        breadth: 0,
        height: 0,
        weight: null,
        quantity: 1,
        drop_City: "",
        drop_State: "",
        drop_Address: "",
        drop_Landmark: "",
        drop_Pincode: "",
        drop_Phoneno: "",
        drop_Alt_Phoneno: "",
        drop_Name: "",
        drop_Emailid: "",
        pickup_City: "",
        pickup_State: "",
        pickup_Address: "",
        pickup_Landmark: "",
        pickup_Pincode: "",
        pickup_Phoneno: "",
        pickup_Alt_Phoneno: "",
        pickup_Name: "",
        pickup_Emailid: "",
        schedule_date: `${date.getDate()}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`,
        from_Time: "09:00:00",
        to_Time: "18:00:00",
        Shipment_value: null,
        cod_amount: 0,
        payment_mode: "PAID",
        delhivery_booking_type: "B2C",
        send_otp: "False",
        RTO_vendorname: "",
        RTO_vendoraddress: "",
        RTO_vendorpincode: "",
        RTO_vendorcontactno: "",
    });

    const [errors, setErrors] = useState({});
    const [bookingTypeOption, setBookingTypeOptions] = useState([
        { value: "B2B", label: "B2B" },
        { value: "B2C", label: "B2C" }]
    )

    const handleChange = (e) => {
        const { name, value } = e.target;

        let mapping = {
            pickup_Name: "RTO_vendorname",
            pickup_Phoneno: "RTO_vendorcontactno",
            pickup_Address: "RTO_vendoraddress",
            pickup_Pincode: "RTO_vendorpincode"
        };

        // create updated object
        let updatedForm = { ...formData, [name]: value };

        // if the changed field has a mapping, update its RTO counterpart too
        if (mapping[name]) {
            updatedForm[mapping[name]] = value;
        }

        setFormData(updatedForm);
    };


    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
        //  calling the get product list api
        GetProductsList(PRODUCT_LIST)
    }, [])

    useEffect(() => {
        if (UserList) {
            let updatedOptions = UserList
                .filter(ele => {
                    const name = ele?.customer_name?.trim();
                    return name != null &&
                        name !== "null" &&
                        name !== "undefined" &&
                        name !== "";
                })
                .map((ele) => ({
                    value: ele.customer_name,
                    label: `${ele.customer_name}-${ele.username}`,
                    id: ele?.id
                }));
            setUserListOption(updatedOptions);
        }

        if (ProductList) {
            let updatedProductList = ProductList?.map((ele) => {
                return {
                    value: ele?.name,
                    label: ele?.name
                }
            })
            setProductListOption(updatedProductList)
        }
    }, [UserList, ProductList]);


    const validate = () => {
        let newErrors = {};
        const mandatoryFields = [
            "CustomerName",
            "serviceType",
            "Product_Description",
            "quantity",
            // "Order_ID",
            "weight",
            "drop_City",
            "drop_State",
            "drop_Address",
            "drop_Pincode",
            "drop_Phoneno",
            "drop_Name",
            "pickup_State",
            "pickup_City",
            "pickup_Address",
            "pickup_Pincode",
            "pickup_Phoneno",
            "pickup_Name",
            "schedule_date",
            "from_Time",
            "to_Time",
            "Shipment_value",
            "payment_mode",
        ];
        //  phone  number validation
        const PhoneNumbersFiled = [
            "drop_Phoneno",
            "drop_Alt_Phoneno",
            "pickup_Phoneno",
            "pickup_Alt_Phoneno",
            "RTO_vendorcontactno"
        ];
        const PhoneStartWith = ["6", "7", "8", "9"];
        PhoneNumbersFiled.forEach((f) => {
            const phone = (formData[f] || "").toString().trim();
            if (phone.length > 0) {
                if (phone.length !== 10) {
                    newErrors[f] = "Phone number must be 10 digits";
                } else if (!PhoneStartWith.includes(phone[0])) {
                    newErrors[f] = "Phone number must start with 6, 7, 8, or 9";
                }
            }
        });
        //  pincode validation
        let pincodeFields = [
            "drop_Pincode",
            "pickup_Pincode",
            "RTO_vendorpincode"
        ];

        pincodeFields.forEach((f) => {
            let pincode = (formData[f] || "").toString().trim();

            if (pincode) {
                if (!/^\d+$/.test(pincode)) {
                    newErrors[f] = "Pincode must contain only digits";
                } else if (pincode.length !== 6) {
                    newErrors[f] = "Pincode should be 6 digits";
                } else if (parseInt(pincode, 10) <= 0) {
                    newErrors[f] = "Pincode can't be less than or equal to 0";
                }
            }
        });

        // parameters 
        let parameters = [
            "length",
            "breadth",
            "height",
            "weight",
            "quantity",
            "Shipment_value",
            "cod_amount"
        ]

        parameters.forEach((F) => {
            if (formData[F] < 0) {
                newErrors[F] = `${F} should be greater then 0`
            }
        })

        mandatoryFields.forEach((f) => {
            if (!formData[f]) newErrors[f] = "Required";
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        console.log(formData, "formData")
        e.preventDefault();
        if (!validate()) return;

        //  api call
        const isCorporateBooking = await CorporateBooking(CORPORATE_BOOKING, formData)
        if (isCorporateBooking?.Status === "success") {
            let message = isCorporateBooking?.message || isCorporateBooking?.msg || "Booking Successful"
            SucceesToaster(message)
            setFormData({
                username: "",
                password: "",
                accno: "",
                secret_code: "",
                CustomerName: "",
                serviceType: "",
                Product_Description: "",
                Order_ID: "",
                length: "",
                breadth: "",
                height: "",
                weight: "",
                quantity: "",
                drop_City: "",
                drop_State: "",
                drop_Address: "",
                drop_Landmark: "",
                drop_Pincode: "",
                drop_Phoneno: "",
                drop_Alt_Phoneno: "",
                drop_Name: "",
                drop_Emailid: "",
                pickup_City: "",
                pickup_State: "",
                pickup_Address: "",
                pickup_Landmark: "",
                pickup_Pincode: "",
                pickup_Phoneno: "",
                pickup_Alt_Phoneno: "",
                pickup_Name: "",
                pickup_Emailid: "",
                schedule_date: "",
                from_Time: "",
                to_Time: "",
                Shipment_value: "",
                cod_amount: "",
                payment_mode: "COD",
                send_otp: "False",
                RTO_vendorname: "",
                RTO_vendoraddress: "",
                RTO_vendorpincode: "",
                RTO_vendorcontactno: "",
            })
            setTimeout(() => {
                window.location.reload();
            }, 4000)
        }
        else {
            let message = isCorporateBooking?.message || isCorporateBooking?.msg || "Booking Failed"
            ErrorToaster(message)
        }
    };

    const renderInput = (label, name, type = "text", maxLength = null) => (
        <FormGroup className="mb-3">
            <Label for={name} className="fw-bold">{label}</Label>
            <Input
                type={type}
                name={name}
                value={formData[name]}
                onChange={handleChange}
                invalid={!!errors[name]}
                maxLength={type === "text" ? maxLength : undefined}
                {...(type === "number" && {
                    step: "0.01",   // allow float values
                    min: 0,         // optional: disallow negative numbers
                })}
            />

            <FormFeedback>{errors[name]}</FormFeedback>
        </FormGroup>
    );

    return (
        <div className='page-content p-0'>
            <div className="container-fluid p-0">
                <div className=" p-0 m-0">
                    <Card className="p-0 m-0">
                        <CardHeader className="bg-white d-flex justify-content-between align-items-center">
                            <h4 className="mb-0"><Package className="me-2" /> Corporate Booking </h4>
                            <button className="btn btn-primary px-4 py-2" onClick={() => {
                                navigate("/service-provider-booking")
                            }} >
                                View Bookings
                            </button>
                        </CardHeader>
                        <CardBody className="p-4">
                            <Form onSubmit={handleSubmit}>

                                {/* Account Info */}
                                <h5 className="text-primary mb-1"><User className="me-2" /> Account Information</h5>
                                {/* <Row>
                                    <Col md={6}>{renderInput("Username", "username", "text", 20)}</Col>
                                    <Col md={6}>{renderInput("Password", "password", "password", 20)}</Col>
                                </Row>
                                <Row>
                                    <Col md={6}>{renderInput("Account No", "accno", "text", 20)}</Col>
                                    <Col md={6}>{renderInput("Secret Code", "secret_code", "text", 20)}</Col>
                                </Row> */}
                                <Row>
                                    <Col md={4}>
                                        {/* {renderInput("Customer Name", "CustomerName", "text", 50)} */}
                                        <FormGroup className="mb-2">
                                            <Label for="Customer">Customer Name</Label>
                                            <Select
                                                options={UserListOptions}
                                                placeholder="Search Customer"
                                                value={UserListOptions.find(option => option.value === formData.CustomerName) || null}
                                                onChange={(selected) => {
                                                    setFormData({
                                                        ...formData,
                                                        CustomerName: selected?.value || "",
                                                        customer_id: selected?.id || null
                                                    })
                                                }}
                                                isClearable
                                                styles={customStyles}
                                            />
                                            <small className="text-danger fw-2">{errors.CustomerName}</small>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup className="mb-2">
                                            <Label for="Customer">Product</Label>
                                            <Select
                                                options={ProductListOption}
                                                placeholder="Search Product"
                                                value={ProductListOption.find(option => option.value === formData.serviceType) || null}
                                                onChange={(selected) => {
                                                    setFormData({
                                                        ...formData,
                                                        serviceType: selected?.value || ""
                                                    })
                                                }}
                                                isClearable
                                                styles={customStyles}
                                            />
                                            <small className="text-danger fw-2">{errors.serviceType}</small>
                                        </FormGroup>

                                    </Col>
                                    <Col md={4}>{renderInput("Order ID", "Order_ID", "text", 20)}</Col>
                                </Row>
                                {/* {renderInput("Customer Name", "CustomerName", "text", 50)}
                                {renderInput("Service Type", "serviceType", "text", 20)}
                                {renderInput("Order ID", "Order_ID", "text", 20)} */}

                                {/* ---- */}
                                {/* Pickup */}
                                <h5 className="text-primary mt-2 mb-1"><Truck className="me-2" /> Shipper Details</h5>

                                <Row>
                                    <Col md={6}>{renderInput("Pickup Name", "pickup_Name", "text", 50)}</Col>
                                    <Col md={6}>{renderInput("Pickup Phone", "pickup_Phoneno", "number", 20)}</Col>
                                </Row>
                                <Row>
                                    <Col md={6}>{renderInput("Pickup Alt Phone", "pickup_Alt_Phoneno", "number", 20)}</Col>
                                    <Col md={6}>{renderInput("Pickup Email", "pickup_Emailid", "email", 50)}</Col>
                                </Row>
                                <Row>
                                    <Col md={6}>{renderInput("Pickup Address", "pickup_Address", "textarea", 500)}</Col>
                                    <Col md={6}>{renderInput("Pickup Landmark", "pickup_Landmark", "text", 50)}</Col>
                                </Row>
                                <Row>
                                    <Col md={4}>{renderInput("Pickup City", "pickup_City", "text", 30)}</Col>
                                    <Col md={4}>{renderInput("Pickup State", "pickup_State", "text", 30)}</Col>
                                    <Col md={4}>{renderInput("Pickup Pincode", "pickup_Pincode", "number", 10)}</Col>
                                </Row>

                                {/* ----------- */}


                                {/* Drop */}
                                <h5 className="text-primary mt-2 mb-1"><MapPin className="me-2" /> Consignee Details</h5>

                                <Row>
                                    <Col md={6}>{renderInput("Drop Name", "drop_Name", "text", 50)}</Col>
                                    <Col md={6}>{renderInput("Drop Phone", "drop_Phoneno", "number", 20)}</Col>
                                </Row>
                                <Row>
                                    <Col md={6}>{renderInput("Drop Alt Phone", "drop_Alt_Phoneno", "number", 20)}</Col>
                                    <Col md={6}>{renderInput("Drop Email", "drop_Emailid", "email", 50)}</Col>
                                </Row>
                                <Row>
                                    <Col md={6}>{renderInput("Drop Address", "drop_Address", "textarea", 500)}</Col>
                                    <Col md={6}>{renderInput("Drop Landmark", "drop_Landmark", "text", 50)}</Col>
                                </Row>
                                <Row>
                                    <Col md={4}>{renderInput("Drop City", "drop_City", "text", 30)}</Col>
                                    <Col md={4}>{renderInput("Drop State", "drop_State", "text", 30)}</Col>
                                    <Col md={4}>{renderInput("Drop Pincode", "drop_Pincode", "number", 10)}</Col>
                                </Row>



                                {/* Dimensions */}
                                <h5 className="text-primary mt-2 mb-1"><Package className="me-2" /> Package Details</h5>
                                <Row>
                                    {renderInput("Product Description", "Product_Description", "textarea", 255)}
                                    <Col md={4}>{renderInput("Length (cm)", "length", "number")}</Col>
                                    <Col md={4}>{renderInput("Breadth (cm)", "breadth", "number")}</Col>
                                    <Col md={4}>{renderInput("Height (cm)", "height", "number")}</Col>
                                    <Col md={4}>{renderInput("Weight (kg)", "weight", "number")}</Col>
                                    <Col md={4}>{renderInput("Quantity", "quantity", "number")}</Col>
                                    <Col md={4}>{renderInput("Shipment Value", "Shipment_value", "number")}</Col>
                                </Row>

                                {/* Schedule */}
                                {/* <h5 className="text-primary mt-2 mb-1"><Calendar className="me-2" /> Schedule</h5> */}
                                {/* <Row>
                                    <Col md={4}>{renderInput("Schedule Date", "schedule_date", "date")}</Col>
                                    <Col md={4}>{renderInput("From Time", "from_Time", "time")}</Col>
                                    <Col md={4}>{renderInput("To Time", "to_Time", "time")}</Col>
                                </Row> */}
                                <Row>

                                    <Col md={4}>{renderInput("COD Amount", "cod_amount", "number")}</Col>
                                    <Col md={4}>
                                        <FormGroup className="mb-2">
                                            <Label for="Customer">Booking Type</Label>
                                            <Select
                                                options={bookingTypeOption}
                                                placeholder="Search Booking type"
                                                defaultValue={bookingTypeOption[1]}
                                                value={bookingTypeOption.find(ele => ele?.value === formData?.delhivery_booking_type)}
                                                onChange={(selected) => {
                                                    setFormData({
                                                        ...formData,
                                                        delhivery_booking_type: selected?.value
                                                    })
                                                }}
                                                isClearable
                                                styles={customStyles}
                                            />
                                            <small className="text-danger fw-2">{errors.delhivery_booking_type}</small>
                                        </FormGroup>
                                    </Col>
                                    <Col md={4}>
                                        <FormGroup switch className="d-flex flex-column">
                                            <Label className="fw-bold mb-2 text-start" for="send_otp">
                                                Send OTP
                                            </Label>
                                            <div>
                                                <Input
                                                    type="switch"
                                                    id="send_otp"
                                                    name="send_otp"
                                                    className="mt-2 ms-2 p-2 px-3"
                                                    checked={formData.send_otp === "True"}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            send_otp: e.target.checked ? "True" : "False",
                                                        })
                                                    }
                                                />
                                                {/* <span className="fw-semibold">
                                                    {formData.send_otp === "True" ? "True" : "False"}
                                                </span> */}
                                            </div>
                                        </FormGroup>


                                    </Col>
                                </Row>

                                {/* <FormGroup>
                                    <Label className="fw-bold">Payment Mode</Label>
                                    <Input
                                        type="select"
                                        name="payment_mode"
                                        value={formData.payment_mode}
                                        onChange={handleChange}
                                    >
                                        <option value="COD">COD</option>
                                        <option value="PAID">PAID</option>
                                    </Input>
                                </FormGroup> */}


                                {/* RTO */}
                                <h5 className="text-primary mt-2 mb-1"><MapPin className="me-2" /> RTO Vendor Info</h5>
                                <Row>
                                    <Col md={6}>{renderInput("RTO Vendor Name", "RTO_vendorname", "text", 30)}</Col>
                                    <Col md={6}>{renderInput("RTO Vendor Contact No", "RTO_vendorcontactno", "text", 20)}</Col>
                                </Row>
                                <Row>
                                    <Col md={6}> {renderInput("RTO Vendor Address", "RTO_vendoraddress", "textarea", 500)}</Col>
                                    <Col md={6}>{renderInput("RTO Vendor Pincode", "RTO_vendorpincode", "text", 10)}</Col>
                                    {/* <Col md={6}>{renderInput("RTO Vendor Contact No", "RTO_vendorcontactno", "text", 20)}</Col> */}
                                </Row>

                                <div className="text-end mt-4">
                                    <Button color="primary" size="lg" type="submit" className="px-5 shadow-sm">
                                        {
                                            corporatebookingloading ?
                                                <Spinner size="sm">loading...</Spinner>
                                                : "Book Now"
                                        }
                                    </Button>
                                </div>
                            </Form>
                        </CardBody>
                    </Card>
                </div>
            </div>
        </div>

    );
};

export default CorporateBooking;
