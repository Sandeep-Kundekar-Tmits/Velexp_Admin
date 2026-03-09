import React, { useState, useEffect } from 'react';
import {
    Button,
    Form,
    FormGroup,
    Label,
    Input,
    Modal,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Row,
    Col,
    Spinner
} from 'reactstrap';
import Select from 'react-select'
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { INT_GET_COUNTRY_CODE } from '../../../api';
import { customStyles } from '../../../helpers/CustomStyle';

const UpdateINTCustomerRateData = ({ Int_rateData, toggle, onSave, Loading }) => {
    const [AllCountries, setAllCountries] = useState([])

    // defining the get all countries data
    const { apifunc: getAllCountries, data: AllCountriesList, loading: countryLoading } = useGetApiCall()
    const [formData, setFormData] = useState({
        customer_name: '',
        country_code: null,
        service_code: null,
        vendor: '',
        weight_min: 0,
        weight_max: 0,
        rate: '0.00',
        FSC: 0,
        FOV_flat: 0,
        FOV_percentage: 0,
        gst: 0,
        country_id: 0
    });

    useEffect(() => {
        if (Int_rateData) {
            setFormData(Int_rateData);
        }
    }, [Int_rateData]);

    useEffect(() => {
        getAllCountries(INT_GET_COUNTRY_CODE)
    }, [])

    useEffect(() => {
        if (AllCountriesList) {
            let Countries = AllCountriesList.map((ele) => {
                return {
                    value: ele?.name,
                    label: ele?.name,
                    id: ele?.id
                }
            })
            setAllCountries(Countries)
        }
    }, [AllCountriesList])

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // handel change select dropdown
    const OnSelectChange = (key, value) => {
        setFormData({
            ...formData,
            [key]: value?.id
        })
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log(formData, "formData")
        onSave(formData);
    };


    return (
        <Modal isOpen={true} size="lg">
            <ModalHeader tag="h4" toggle={toggle}>Update International Customer Rate Details</ModalHeader>
            <Form onSubmit={handleSubmit}>
                <ModalBody>
                    <Row>
                        <Col md={12}>
                            <FormGroup>
                                <Label for="customer_name">Customer Name</Label>
                                <Input
                                    type="text"
                                    name="customer_name"
                                    id="customer_name"
                                    value={formData?.customer_name}
                                    onChange={handleChange}
                                    required
                                />
                            </FormGroup>
                        </Col>

                    </Row>

                    <Row>
                        <Col md={3}>
                            <FormGroup>
                                <Label for="country">Country</Label>
                                <Select
                                    name="country_id"
                                    options={AllCountries}
                                    placeholder={countryLoading ? "Loading" : "Search Countries"}
                                    value={AllCountries.find((ele) => ele?.id === formData?.country_id)}
                                    onChange={(option) => OnSelectChange("country_id", option)}
                                    isClearable={true}
                                    styles={customStyles} />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label for="country_code">Country Code</Label>
                                <Input
                                    type="number"
                                    name="country_code"
                                    id="country_code"
                                    value={formData?.country_code || ''}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label for="service_code">Service Code</Label>
                                <Input
                                    type="number"
                                    name="service_code"
                                    id="service_code"
                                    value={formData?.service_code || ''}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={3}>
                            <FormGroup>
                                <Label for="vendor">Vendor</Label>
                                <Input
                                    type="text"
                                    name="vendor"
                                    id="vendor"
                                    value={formData?.vendor || ''}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="weight_min">Weight Min (g)</Label>
                                <Input
                                    type="number"
                                    name="weight_min"
                                    id="weight_min"
                                    value={formData?.weight_min}
                                    onChange={handleChange}
                                    step="0.1"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="weight_max">Weight Max (g)</Label>
                                <Input
                                    type="number"
                                    name="weight_max"
                                    id="weight_max"
                                    value={formData?.weight_max}
                                    onChange={handleChange}
                                    step="0.1"
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="rate">Rate (₹)</Label>
                                <Input
                                    type="number"
                                    name="rate"
                                    id="rate"
                                    value={formData?.rate}
                                    onChange={handleChange}
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="FSC">FSC (%)</Label>
                                <Input
                                    type="number"
                                    name="FSC"
                                    id="FSC"
                                    value={formData?.FSC}
                                    onChange={handleChange}
                                    step="0.1"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={4}>
                            <FormGroup>
                                <Label for="gst">GST (%)</Label>
                                <Input
                                    type="number"
                                    name="gst"
                                    id="gst"
                                    value={formData?.gst}
                                    onChange={handleChange}
                                    step="0.1"
                                />
                            </FormGroup>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="FOV_flat">FOV Flat Rate (₹)</Label>
                                <Input
                                    type="number"
                                    name="FOV_flat"
                                    id="FOV_flat"
                                    value={formData?.FOV_flat}
                                    onChange={handleChange}
                                    step="0.01"
                                />
                            </FormGroup>
                        </Col>
                        <Col md={6}>
                            <FormGroup>
                                <Label for="FOV_percentage">FOV Percentage (%)</Label>
                                <Input
                                    type="number"
                                    name="FOV_percentage"
                                    id="FOV_percentage"
                                    value={formData?.FOV_percentage}
                                    onChange={handleChange}
                                    step="0.1"
                                />
                            </FormGroup>
                        </Col>
                    </Row>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={toggle}>Cancel</Button>
                    <Button color="primary" type="submit" className='d-flex justify-content-center align-items-center '>
                        {
                            Loading ? <Spinner size="sm">
                                Loading...
                            </Spinner> : "Save Changes"
                        }
                    </Button>
                </ModalFooter>
            </Form>
        </Modal>
    );
};

export default UpdateINTCustomerRateData;