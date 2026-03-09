import { Col, Input, Label, Row } from "reactstrap"
import { PiSlideshowLight } from "react-icons/pi";
import { LiaWeightSolid } from "react-icons/lia";
import { CiCalculator2 } from "react-icons/ci";
import { GiThermometerScale } from "react-icons/gi";

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
const SingleOrderContentDetails = () => {
    return (
        <div className="p-0">
            <h4>CONTENT DETAILS</h4>
            <hr />
            <div className="p-0">
                <Row>
                    <Col md="12">
                        <Inputfiled
                            title="Product Description:*"
                            name="product_description"
                            icon={<PiSlideshowLight className="" style={{ width: "20px", height: "20px", transition: "revert" }} />}
                            placeholder={"Product Descriptions"} />
                    </Col>

                    {/* different row */}
                    <Col md="4">
                        <Inputfiled
                            title="Weight:*"
                            name="weight"
                            icon={<LiaWeightSolid className="" style={{ width: "20px", height: "20px", transition: "revert" }} />}
                            placeholder={"weight"} />
                    </Col>
                    <Col md="4">
                        <Inputfiled
                            title="Quantity"
                            name="quantity"
                            icon={<CiCalculator2 className="" style={{ width: "20px", height: "20px", transition: "revert" }} />}
                            placeholder={"Quantity"} />
                    </Col>
                    <Col md="4">
                        <Inputfiled
                            title="Length"
                            name="length"
                            icon={<GiThermometerScale  className="" style={{ width: "20px", height: "20px", transition: "revert" }} />}
                            placeholder={"Length"} />
                    </Col>
                    {/* different row */}
                    <Col md="4">
                        <Inputfiled
                            title="Product Description:*"
                            name="product_description"
                            icon={<PiSlideshowLight className="" style={{ width: "20px", height: "20px", transition: "revert" }} />}
                            placeholder={"Product Descriptions"} />
                    </Col>
                    <Col md="4">
                        <Inputfiled
                            title="Product Description:*"
                            name="product_description"
                            icon={<PiSlideshowLight className="" style={{ width: "20px", height: "20px", transition: "revert" }} />}
                            placeholder={"Product Descriptions"} />
                    </Col>
                    <Col md="4">
                        <Inputfiled
                            title="Product Description:*"
                            name="product_description"
                            icon={<PiSlideshowLight className="" style={{ width: "20px", height: "20px", transition: "revert" }} />}
                            placeholder={"Product Descriptions"} />
                    </Col>

                </Row>
            </div>
        </div>
    )
}
export default SingleOrderContentDetails