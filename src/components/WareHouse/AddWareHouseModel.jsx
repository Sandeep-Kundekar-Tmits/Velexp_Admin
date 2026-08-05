import React, { useState } from 'react';
import { Button, Modal, ModalHeader, ModalBody, ModalFooter, Row, Col, FormGroup, Label, Input, FormFeedback, Spinner } from "@/components/ui";
import Select from 'react-select';
import { customStyles } from '../../helpers/CustomStyle';
import { useServiceCenters } from '../../hooks/queries/useReferenceData';

const AddWareHouseModel = ({ toggle, onSave, loading }) => {
    // service center options -- cached 30min, shared across every screen that asks
    const { data: ServiceCenterOption = [] } = useServiceCenters()
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
                    {/* Was 4/5/3 then 4/4/4 then a lone 5 -- Bootstrap wraps at
                        12 regardless of grouping, so that left Email sitting
                        by itself on its own row with 7/12 of empty space
                        beside it. Three even fields per row, and Address on
                        its own full-width row since it is the one textarea
                        and reads better with the room. */}
                    <Row>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="Customer">Select Service Center</Label>
                                {/* Portalled: Modal's own dialog box is
                                    overflow-hidden (so a scrollable body's
                                    corners stay rounded), which would clip an
                                    inline dropdown menu at the modal's edge. */}
                                <Select
                                    options={ServiceCenterOption}
                                    placeholder="Search"
                                    value={SelectedServiceCenter}
                                    onChange={setSelectedServiceCenter}
                                    isClearable={true}
                                    styles={customStyles}
                                    menuPortalTarget={document.body}
                                    menuPosition="fixed"
                                />
                                <small className='text-danger-500'>{Errors?.service_center}</small>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
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
                                <Label for="state">State</Label>
                                <Input type="text" placeholder="State"
                                    value={WareHouseData?.state}
                                    name='state'
                                    onChange={OnInputChange} invalid={!!Errors?.state} />
                                <FormFeedback>{Errors?.state}</FormFeedback>
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
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
                                <Label for="phone">Phone</Label>
                                <Input type="number" placeholder="Phone"
                                    value={WareHouseData?.phone}
                                    name='phone'
                                    onChange={OnInputChange} invalid={!!Errors?.phone}/>
                                    <FormFeedback>{Errors?.phone}</FormFeedback>
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup className="mb-2">
                                <Label for="email">Email</Label>
                                <Input type="email" placeholder="Email"
                                    value={WareHouseData?.email}
                                    name='email'
                                    onChange={OnInputChange} />
                            </FormGroup>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={12}>
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
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={onAddWareHouse} className='flex justify-center items-center'>
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