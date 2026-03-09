import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  FormFeedback,
  Row,
  Col,
  Spinner
} from 'reactstrap';
import Select from 'react-select'
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_RATE_DATE_PRODUCT, GET_RATE_DATE_ZONE } from '../../../api';
import { customStyles } from '../../../helpers/CustomStyle';

const UpdateAsusModel = ({
  isOpen,
  toggle,
  initialData,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  //  defining the get zone api
  const { apifunc: getZone, data: Zone } = useGetApiCall()
  const [Zones, setZones] = useState([])
  // defining the get prodcut api
  const { apifunc: getProducts, data: ProductsInfo } = useGetApiCall()
  const [Products, SetProducts] = useState([])

  useEffect(() => {
    if (isOpen) {
      // Exclude id, created, and updated fields from the form data
      const { created, updated, ...formFields } = initialData;
      setFormData(formFields);
      setErrors({});
      //  calling the zone
      getZone(GET_RATE_DATE_ZONE)
      // calling  the products
      getProducts(GET_RATE_DATE_PRODUCT)
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    //  setting the zones
    if (Zone) {
      let ZoneInfo = Zone.map((ele) => {
        return {
          label: ele?.name,
          value: ele?.name,
          id: ele?.id
        }
      })
      setZones(ZoneInfo)
    }

    // setting the products
    if (ProductsInfo) {
      let productInfoOption = ProductsInfo.map((ele) => {
        return {
          label: ele?.name,
          value: ele?.name,
          id: ele?.id
        }
      })
      SetProducts(productInfoOption)
    }

  }, [Zone, ProductsInfo])

  // checkbox for setting the active checkobox
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  //  handlechnage function
  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };



  const validateForm = () => {
    const newErrors = {};

    if (!formData.shipping_hub) newErrors.shipping_hub = 'Required';
    if (!formData.drop_city) newErrors.drop_city = 'Required';
    if (!formData.drop_state) newErrors.drop_state = 'Required';
    if (isNaN(formData.rate)) newErrors.rate = 'Must be a number';
    if (isNaN(formData.FSC)) newErrors.FSC = 'Must be a number';
    if (isNaN(formData.gst)) newErrors.gst = 'Must be a number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log(formData, "formData")
      onSave(formData);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Update Asus Rate</ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="shipping_hub">Shipping Hub*</Label>
                <Input
                  type="text"
                  name="shipping_hub"
                  id="shipping_hub"
                  value={formData.shipping_hub || ''}
                  onChange={handleChange}
                  invalid={!!errors.shipping_hub}
                />
                <FormFeedback>{errors.shipping_hub}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="drop_city">Drop City*</Label>
                <Input
                  type="text"
                  name="drop_city"
                  id="drop_city"
                  value={formData.drop_city || ''}
                  onChange={handleChange}
                  invalid={!!errors.drop_city}
                />
                <FormFeedback>{errors.drop_city}</FormFeedback>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="drop_state">Drop State*</Label>
                <Input
                  type="text"
                  name="drop_state"
                  id="drop_state"
                  value={formData.drop_state || ''}
                  onChange={handleChange}
                  invalid={!!errors.drop_state}
                />
                <FormFeedback>{errors.drop_state}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label for="rate">Rate*</Label>
                <Input
                  type="number"
                  name="rate"
                  id="rate"
                  value={formData.rate || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.rate}
                />
                <FormFeedback>{errors.rate}</FormFeedback>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="FSC">FSC*</Label>
                <Input
                  type="number"
                  name="FSC"
                  id="FSC"
                  value={formData.FSC || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.FSC}
                />
                <FormFeedback>{errors.FSC}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="gst">GST (%)*</Label>
                <Input
                  type="number"
                  name="gst"
                  id="gst"
                  value={formData.gst || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.gst}
                />
                <FormFeedback>{errors.gst}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="docket_charges">Docket Charges</Label>
                <Input
                  type="number"
                  name="docket_charges"
                  id="docket_charges"
                  value={formData.docket_charges || ''}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="cod_flat">COD Flat</Label>
                <Input
                  type="number"
                  name="cod_flat"
                  id="cod_flat"
                  value={formData.cod_flat || 0}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="cod_percentage">COD Percentage</Label>
                <Input
                  type="number"
                  name="cod_percentage"
                  id="cod_percentage"
                  value={formData.cod_percentage || 0}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="expected_delivery_time_in_days">Delivery Days</Label>
                <Input
                  type="number"
                  name="expected_delivery_time_in_days"
                  id="expected_delivery_time_in_days"
                  value={formData.expected_delivery_time_in_days || ''}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="rto_flat">RTO Flat</Label>
                <Input
                  type="number"
                  name="rto_flat"
                  id="rto_flat"
                  value={formData.rto_flat || 0}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="rto_percentage">RTO Percentage</Label>
                <Input
                  type="number"
                  name="rto_percentage"
                  id="rto_percentage"
                  value={formData.rto_percentage || 0}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="appointment_charges">Appointment Charges</Label>
                <Input
                  type="number"
                  name="appointment_charges"
                  id="appointment_charges"
                  value={formData.appointment_charges || 0}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="FOV_flat">FOV Flat</Label>
                <Input
                  type="number"
                  name="FOV_flat"
                  id="FOV_flat"
                  value={formData.FOV_flat || 0}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="FOV_percentage">FOV Percentage</Label>
                <Input
                  type="number"
                  name="FOV_percentage"
                  id="FOV_percentage"
                  value={formData.FOV_percentage || 0}
                  onChange={handleNumberChange}
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="payment_mode">Payment Mode</Label>
                <Input
                  type="select"
                  name="payment_mode"
                  id="payment_mode"
                  value={formData.payment_mode || ''}
                  onChange={handleChange}
                >
                  <option value="">Select Payment Mode</option>
                  <option value="COD">COD</option>
                  <option value="PAID">PAID</option>
                  <option value="RTO">RTO</option>
                </Input>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="zone">Zone</Label>
                <Select styles={customStyles} value={Zones.find((ele => ele?.id === formData.zone))} options={Zones} onChange={(value) => {
                  setFormData((prev) => {
                    return {
                      ...prev,
                      zone: value?.id
                    }
                  })
                }} />

              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="product">Product</Label>
                <Select styles={customStyles} value={Products.find((ele => ele?.id === formData?.product))} options={Products} onChange={(value) => {
                  setFormData((prev) => {
                    return {
                      ...prev,
                      product: value?.id
                    }
                  })
                }} />
              </FormGroup>
            </Col>
          </Row>

          <FormGroup>
            <Label for="is_active">Active</Label>
            <Input
              type="switch"
              id="is_active"
              className='ms-2'
              name="is_active"
              label="Active"
              checked={formData.is_active || false}
              onChange={handleChange}
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle}>Cancel</Button>
          <Button color="primary" type="submit" className='d-flex justify-content-center align-items-center'>{
            loading ? <Spinner size="sm">
              Loading...
            </Spinner> : "Save Changes"
          }</Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default UpdateAsusModel;