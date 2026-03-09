import React, { useEffect, useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, FormGroup, Label, Input, FormFeedback, Spinner } from 'reactstrap';
import Select from 'react-select';
import { customStyles } from '../../helpers/CustomStyle';
import { useGetApiCall } from '../../hooks/useGetApiCall';
import { SERVICE_CENTER } from '../../api';

const AddWareHouseModel = ({ toggle, onSave, loading }) => {
    // service center option dropdown
    const [ServiceCenterOption, setServiceCenterOption] = useState([])
    const [Errors, setErrors] = useState({})
    // selected service center
    const [SelectedServiceCenter, setSelectedServiceCenter] = useState()
    // warehouse data
    const [WareHouseData, setWarehouseData] = useState({
        address: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        email: ""
    })

    const OnInputChange = (e) => {
        const { name, value } = e.target
        setWarehouseData({
            ...WareHouseData,
            [name]: value
        })
    }
    // definging the get service center api
    const { apifunc: GetServiceCenter, data: ServiceCenters } = useGetApiCall()

    //  calling user api
    useEffect(() => {
        GetServiceCenter(SERVICE_CENTER)
    }, [])

    //  getting the service center data
    useEffect(() => {
        if (ServiceCenters) {
            let updatedServiceCenters = ServiceCenters.map((ele) => {
                return {
                    value: ele?.ec_code,
                    label: ele?.ec_code
                }
            })
            setServiceCenterOption(updatedServiceCenters)
        }
    }, [ServiceCenters])


    const onAddWareHouse = () => {
        let errors = {}

        Object.entries(WareHouseData).forEach(([key, value]) => {
            let options = ["address", "city", "state", "pincode","phone"]
            if (value === "" && options.includes(key)) {
                errors[key] = `${key} is required`
                return
            }
        })

        if (!SelectedServiceCenter) {
            errors["service_center"] = "Service center required"
        }

        setErrors(errors)

        if (Object.entries(errors).length === 0) {
            // call the api
            let payload = {
                ...WareHouseData,
                service_center: SelectedServiceCenter.value 
            }
            onSave(payload)
        }
    }

    return (
        <div>
            {/* Modal */}
            <Modal isOpen={true} toggle={toggle} size="lg">
                <ModalHeader toggle={toggle}>Create New Warehouse</ModalHeader>
                <ModalBody>
                    <Row>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Service Center</Label>
                                <Select
                                    options={ServiceCenterOption}
                                    placeholder="Search"
                                    value={SelectedServiceCenter}
                                    onChange={setSelectedServiceCenter}
                                    isClearable={true}
                                    styles={customStyles}
                                />
                                <small className='text-danger'>{Errors?.service_center}</small>
                            </FormGroup>
                        </Col>
                        <Col md={5}>
                            <FormGroup className="mb-2">
                                <Label for="address">Address</Label>
                                <Input type="textarea" placeholder="Address"
                                    value={WareHouseData.address}
                                    name='address'
                                    onChange={OnInputChange}
                                    invalid={!!Errors?.address} />
                                <FormFeedback>{Errors?.address}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup className="mb-2">
                                <Label for="City">City</Label>
                                <Input type="text" placeholder="City"
                                    value={WareHouseData?.city}
                                    name='city'
                                    onChange={OnInputChange} invalid={!!Errors?.city} />
                                <FormFeedback>{Errors?.city}</FormFeedback>
                            </FormGroup>
                        </Col>
                         <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="pincode">Pincode</Label>
                                <Input type="number" placeholder="pinocode"
                                    value={WareHouseData?.pincode}
                                    name='pincode'
                                    onChange={OnInputChange} invalid={!!Errors?.pincode} />
                                <FormFeedback>{Errors?.pincode}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="state">State</Label>
                                <Input type="text" placeholder="State"
                                    value={WareHouseData?.state}
                                    name='state'
                                    onChange={OnInputChange} invalid={!!Errors?.state} />
                                <FormFeedback>{Errors?.state}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="phone">Phone</Label>
                                <Input type="number" placeholder="Phone"
                                    value={WareHouseData?.phone}
                                    name='phone'
                                    onChange={OnInputChange} invalid={!!Errors?.phone}/>
                                    <FormFeedback>{Errors?.phone}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={5}>
                            <FormGroup className="mb-2">
                                <Label for="email">Email</Label>
                                <Input type="email" placeholder="Email"
                                    value={WareHouseData?.email}
                                    name='email'
                                    onChange={OnInputChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={onAddWareHouse} className='d-flex justify-content-center align-items-center'>
                        {
                            loading ? <Spinner size="sm">loading...</Spinner> : "Create"
                        }
                    </Button>{' '}
                    <Button color="secondary" onClick={toggle}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default AddWareHouseModel;