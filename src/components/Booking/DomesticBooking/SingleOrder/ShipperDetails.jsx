import React from 'react';
import { Container, Form, FormGroup, Label, Input, Button, Row, Col } from 'reactstrap';
import { FaArrowLeft, FaArrowRight } from 'react-icons/fa';
import { MdOutlineAttachEmail, MdPersonPin } from 'react-icons/md';
import { LuLandmark } from "react-icons/lu";
import { CiLocationArrow1 } from "react-icons/ci";


const Inputfiled = ({ title, icon = null, name, value, onChange, placeholder }) => {
    return (
        <div className='w-100 mb-3'>
            <Label>{title}</Label>
            <div className="d-flex  rounded-3" style={{ border: "solid #D3D3D3 1px", }}>
                <div style={{ width: "50px" }} className="bg-light rounded-start-3 border-end d-flex  justify-content-center align-items-center">
                    {icon}
                </div>
                <Input type="text" className="border-0" placeholder={placeholder} name={name} value={value} onChange={onChange} />
            </div>
        </div>
    )
}
const ShipperDetails = () => {

    return (
        <div className="p-0">
            <h4>SHIPPER DETAILS</h4>
            <hr />
            <div className="p-0">

                <Row className='mb-2'>
                    <Col md={4}>
                        <Inputfiled
                            title="Shipper Name :*"
                            name="shipper_name"
                            icon={<MdPersonPin style={{ width: "20px", height: "20px" }} />}
                            placeholder={"Shipper name"} />
                    </Col>
                    <Col md={4}>
                        <Inputfiled
                            title="Shipper Mobile :*"
                            name="shipper_mobile"
                            icon={`+91`}
                            placeholder={"Shipper Mobile"} />
                    </Col>
                    <Col md={4}>
                        <Inputfiled
                            title="Alternate Mobile(Opt.):"
                            name="Alternate_no"
                            icon={'+91'}
                            placeholder={"Phone No"} />
                    </Col>

                    {/* email */}
                    <Col md={4}>
                        <Inputfiled
                            title="Email(Opt.):"
                            name="email"
                            icon={<MdOutlineAttachEmail style={{ width: "20px", height: "20px" }} />}
                            placeholder={"Email"} />
                    </Col>
                    {/* house no */}
                    <Col md={8}>
                        <Inputfiled
                            title="House No. / Flat No.:"
                            name="house_no"
                            icon={<CiLocationArrow1 style={{ width: "20px", height: "20px" }} />}
                            placeholder={"House No. / Flat No."} />
                    </Col>

                    {/* landmark */}
                    <Col md={4}>
                        <Inputfiled
                            title="Landmark(Opt.):"
                            name="landmark"
                            icon={<LuLandmark style={{ width: "20px", height: "20px" }} />}
                            placeholder={"Shipper Landmark"} />
                    </Col>
                    {/*address */}
                    <Col md={8}>
                        <Inputfiled
                            title="Apartment / Building Name / Street / Lane / Area / Colony *"
                            name="address"
                            icon={<CiLocationArrow1 style={{ width: "20px", height: "20px" }} />}
                            placeholder={"Apartment / Building Name / Street / Lane / Area / Colony *."} />
                    </Col>
                </Row>
                {/* City, State, Country, Pincode */}
                <Row form>
                    <Col md={3}>
                        <FormGroup>
                            <Label for="city" className="font-weight-bold">City:</Label>
                            <Input type="text" id="city" value="BELGAUM" readOnly />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label for="state" className="font-weight-bold">State:</Label>
                            <Input type="text" id="state" value="KARNATAKA" readOnly />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label for="country" className="font-weight-bold">Country:</Label>
                            <Input type="text" id="country" value="India" readOnly />
                        </FormGroup>
                    </Col>
                    <Col md={3}>
                        <FormGroup>
                            <Label for="pincode" className="font-weight-bold">Pincode:</Label>
                            <Input type="text" id="pincode" value="590009" readOnly />
                        </FormGroup>
                    </Col>
                </Row>



                {/* Navigation Buttons */}
                <div className="d-flex justify-content-between mt-4">
                    <Button color="secondary">
                        <FaArrowLeft className="mr-2" /> Back
                    </Button>
                    <Button color="primary">
                        Next <FaArrowRight className="ml-2" />
                    </Button>
                </div>
            </div>
        </div>

    )
}

export default ShipperDetails