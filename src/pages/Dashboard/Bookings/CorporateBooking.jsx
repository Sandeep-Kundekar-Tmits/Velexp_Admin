// CorporateBookingForm.js
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Row,
    Col,
    FormFeedback,
    Spinner,
} from "@/components/ui";
import { User, MapPin, Package, Truck } from "lucide-react";
import usePostApiCall from "../../../hooks/usePostApiCall";
import { CORPORATE_BOOKING, GET_USER_API, PRODUCT_LIST } from "../../../api";
import Select from 'react-select'
import ToasterProvider from "../../../helpers/ToasterProvider";
import { useGetApiCall } from "../../../hooks/useGetApiCall";
import { customStyles } from "../../../helpers/CustomStyle";
import { useNavigate } from "react-router-dom";
import MainHeaderComp from "../../../components/MainHeaderCom";

/* One glass panel per form section, matching the grid-shell/modal/sidebar
   look everywhere else in the app, rather than the whole form living inside
   one flat Card the way it did before this screen had a header pattern to
   match. */
const Section = ({ icon: Icon, title, children }) => (
    /* p-4 on a phone: at p-5 the card padding plus the Row/Col gutters took
       ~56px of a 360px screen, leaving the inputs noticeably narrow. */
    <div className="rounded-2xl border border-white/8 bg-[rgba(17,24,39,0.70)] p-4 backdrop-blur-xl sm:p-5">
        <h5 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-white">
            <Icon aria-hidden="true" className="size-4 text-[#3B82F6]" />
            {title}
        </h5>
        {children}
    </div>
);

Section.propTypes = {
    icon: PropTypes.elementType.isRequired,
    title: PropTypes.string.isRequired,
    children: PropTypes.node,
};

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
        <FormGroup className="mb-4">
            <Label for={name} className="font-bold">{label}</Label>
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
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Corporate Booking"
                subTitle="Create a new shipment for a corporate customer."
                extraFields={
                    <Button
                        className="table-action-btn table-action-btn-solid"
                        onClick={() => navigate("/service-provider-booking")}
                    >
                        View Bookings
                    </Button>
                }
            />

            <div className="relative z-10 pb-4">
                <Form onSubmit={handleSubmit} className="flex flex-col gap-4">

                    {/* Account Info */}
                    <Section icon={User} title="Account Information">
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
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                    <small className="text-danger-500 fw-2">{errors.CustomerName}</small>
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
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                    <small className="text-danger-500 fw-2">{errors.serviceType}</small>
                                </FormGroup>

                            </Col>
                            <Col md={4}>{renderInput("Order ID", "Order_ID", "text", 20)}</Col>
                        </Row>
                        {/* {renderInput("Customer Name", "CustomerName", "text", 50)}
                                {renderInput("Service Type", "serviceType", "text", 20)}
                                {renderInput("Order ID", "Order_ID", "text", 20)} */}
                    </Section>

                    {/* Pickup */}
                    <Section icon={Truck} title="Shipper Details">
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
                    </Section>

                    {/* Drop */}
                    <Section icon={MapPin} title="Consignee Details">
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
                    </Section>

                    {/* Dimensions */}
                    <Section icon={Package} title="Package Details">
                        <Row>
                            {/* Was a bare renderInput() with no Col wrapper, so
                                it had no width of its own inside a flex row --
                                wrapping it gives the description its intended
                                full row before the dimension fields below. */}
                            <Col md={12}>{renderInput("Product Description", "Product_Description", "textarea", 255)}</Col>
                                    <Col md={4}>{renderInput("Length (cm)", "length", "number")}</Col>
                                    <Col md={4}>{renderInput("Breadth (cm)", "breadth", "number")}</Col>
                                    <Col md={4}>{renderInput("Height (cm)", "height", "number")}</Col>
                                    <Col md={4}>{renderInput("Weight (kg)", "weight", "number")}</Col>
                                    <Col md={4}>{renderInput("Quantity", "quantity", "number")}</Col>
                            <Col md={4}>{renderInput("Shipment Value", "Shipment_value", "number")}</Col>
                        </Row>

                        {/* Schedule */}
                        {/* <h5 className="text-brand-500 mt-2 mb-1"><Calendar className="mr-2" /> Schedule</h5> */}
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
                                        menuPortalTarget={document.body}
                                        menuPosition="fixed"
                                    />
                                    <small className="text-danger-500 fw-2">{errors.delhivery_booking_type}</small>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                {/* Was <Input type="switch">, which does not
                                    exist as an HTML input type -- browsers
                                    fall back to type="text" for anything they
                                    do not recognise, so this rendered as a
                                    text box with a `checked` attribute doing
                                    nothing: the toggle never actually worked.
                                    A real checkbox is what the Input
                                    component supports. */}
                                <FormGroup className="mb-2 flex flex-col">
                                    <Label className="font-bold mb-2 text-left" for="send_otp">
                                        Send OTP
                                    </Label>
                                    <Input
                                        type="checkbox"
                                        id="send_otp"
                                        name="send_otp"
                                        className="size-5"
                                        checked={formData.send_otp === "True"}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                send_otp: e.target.checked ? "True" : "False",
                                            })
                                        }
                                    />
                                </FormGroup>
                            </Col>
                        </Row>

                        {/* <FormGroup>
                                    <Label className="font-bold">Payment Mode</Label>
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
                    </Section>

                    {/* RTO */}
                    <Section icon={MapPin} title="RTO Vendor Info">
                        <Row>
                            <Col md={6}>{renderInput("RTO Vendor Name", "RTO_vendorname", "text", 30)}</Col>
                            <Col md={6}>{renderInput("RTO Vendor Contact No", "RTO_vendorcontactno", "text", 20)}</Col>
                        </Row>
                        <Row>
                            <Col md={6}> {renderInput("RTO Vendor Address", "RTO_vendoraddress", "textarea", 500)}</Col>
                            <Col md={6}>{renderInput("RTO Vendor Pincode", "RTO_vendorpincode", "text", 10)}</Col>
                            {/* <Col md={6}>{renderInput("RTO Vendor Contact No", "RTO_vendorcontactno", "text", 20)}</Col> */}
                        </Row>
                    </Section>

                    {/* Full width on a phone, where a right-aligned button with
                        px-12 is a small target adrift at the end of a long
                        form; back to its natural size from sm up. */}
                    <div className="flex justify-end border-t border-white/8 pt-4">
                        <Button
                            color="primary"
                            size="lg"
                            type="submit"
                            className="w-full shadow-sm sm:w-auto sm:px-12"
                        >
                            {
                                corporatebookingloading ?
                                    <Spinner size="sm">loading...</Spinner>
                                    : "Book Now"
                            }
                        </Button>
                    </div>
                </Form>
            </div>
        </div>
    );
};

export default CorporateBooking;
