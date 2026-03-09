import { memo, useEffect, useState } from "react"
import { Button, Col, FormGroup, Input, Label, Row } from "reactstrap"
import Select from 'react-select'
import { customStyles } from "../../../../helpers/CustomStyle"
import { useGetApiCall } from "../../../../hooks/useGetApiCall"
import { GET_USER_API } from "../../../../api"
import SearchableDropdown from "../../../Common/SearchableDropdown"
import { LiaRupeeSignSolid } from "react-icons/lia";

const Estimate = () => {
    const [username, setUsername] = useState({})
    // select user option
    const [UserListOptions, setUserListOption] = useState([])


    //  calling user api
    useEffect(() => {
        GetUserList(`${GET_USER_API}/`)
    }, [])

    // api calls
    // defining get user api
    const { apifunc: GetUserList, data: UserList } = useGetApiCall()
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
                    label: ele.customer_name
                }));
            setUserListOption(updatedOptions);
        }
    }, [UserList]);
    return (
        <div className="p-0">
            {/* user Dropdonw */}
            <FormGroup className="mb-2" style={{ width: "300px" }}>
                <Label for="Customer">Select Customer</Label>
                <Select options={UserListOptions}
                    placeholder="Search Customer"
                    value={username}
                    onChange={setUsername}
                    isClearable={true}
                    styles={customStyles} />
            </FormGroup>
            <h4>Get Estimate</h4>
            {/* form */}
            <div>
                <Row>
                    <Col md={5}>
                        <Label>From *</Label>
                        <SearchableDropdown
                            className="w-100"
                            // onChange={}
                            locations={[]}
                        // value={}
                        />
                    </Col>
                    <Col md={5} className="d-flex flex-column align-items-start">
                        <Label>To *</Label>
                        <SearchableDropdown
                            className="w-100"
                            // onChange={}
                            locations={[]}
                        // value={}
                        />
                    </Col>
                </Row>
                <Row className="mt-2">
                    <Col md={3}>
                        <Label>Product Type *</Label>
                        <select className=" d-block w-100 rounded-3 " style={{ border: "solid #D3D3D3 1px", paddingTop: "6px", paddingBottom: "6px" }}>
                            <option>1</option>
                            <option>2</option>
                            <option>3</option>
                            <option>4</option>
                        </select>
                        {/* <Input type="text" /> */}
                    </Col>
                    <Col md={3}>
                        <Label>Weight *</Label>
                        <div className="d-flex  rounded-3" style={{ border: "solid #D3D3D3 1px" }}>
                            <Input type="text" className="border-0 w-75" placeholder="Total Weight" />
                            <select className="bg-light border-start border  w-25 ">
                                <option>KG</option>
                                <option>GM</option>
                            </select>
                        </div>
                    </Col>
                    <Col md={3}>
                        <Label>Shipment Value: *</Label>
                        <div className="d-flex  rounded-3" style={{ border: "solid #D3D3D3 1px" }}>
                            <div className="bg-light rounded-start-3 border-end  w-25 d-flex  justify-content-center align-items-center">
                                <LiaRupeeSignSolid style={{ width: "18px", height: "18px" }} />
                            </div>
                            <Input type="text" className="border-0 w-75" placeholder="Shipment Value" />
                        </div>
                    </Col>
                </Row>
            </div>

            <div className="mt-3 d-flex justify-content-end border-top pt-3">
                <Button className="bg-primary" style={{width:"140px"}}>Next</Button>
            </div>
        </div>
    )
}

export default memo(Estimate)