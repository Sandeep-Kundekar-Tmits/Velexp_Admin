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
import Select from 'react-select';
import { useGetApiCall } from '../../../hooks/useGetApiCall';
import { GET_RATE_DATE_PRODUCT, GET_RATE_DATE_ZONE } from '../../../api';
import { customStyles } from '../../../helpers/CustomStyle';

const UpdateCorporateDataRate = ({
  isOpen,
  toggle,
  initialData,
  onSave,
  loading = false
}) => {
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});

  // API calls for dropdowns
  const { apifunc: getZones, data: ZonesData } = useGetApiCall();
  const { apifunc: getProducts, data: ProductsData } = useGetApiCall();
//   const { apifunc: getServiceLevels, data: ServiceLevelsData } = useGetApiCall();
  
  const [zones, setZones] = useState([]);
  const [products, setProducts] = useState([]);
  const [serviceLevels, setServiceLevels] = useState([]);

  useEffect(() => {
    if (isOpen) {
      // Exclude created and updated fields from the form data
      const { created, updated, ...formFields } = initialData;
      setFormData(formFields);
      setErrors({});
      
      // Fetch dropdown data
      getZones(GET_RATE_DATE_ZONE);
      getProducts(GET_RATE_DATE_PRODUCT);
    //   getServiceLevels(GET_SERVICE_LEVELS);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (ZonesData) {
      const zonesOptions = ZonesData.map(zone => ({
        label: zone.name,
        value: zone.name,
        id: zone.id
      }));
      setZones(zonesOptions);
    }

    if (ProductsData) {
      const productsOptions = ProductsData.map(product => ({
        label: product.name,
        value: product.name,
        id: product.id
      }));
      setProducts(productsOptions);
    }


  }, [ZonesData, ProductsData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? '' : Number(value)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer) newErrors.customer = 'Required';
    if (isNaN(formData.weight_min)) newErrors.weight_min = 'Must be a number';
    if (formData.weight_max !== null && isNaN(formData.weight_max)) newErrors.weight_max = 'Must be a number';
    if (isNaN(formData.rate)) newErrors.rate = 'Must be a number';
    if (isNaN(formData.base_weight_slab)) newErrors.base_weight_slab = 'Must be a number';
    if (isNaN(formData.base_weight)) newErrors.base_weight = 'Must be a number';
    if (isNaN(formData.base_amount)) newErrors.base_amount = 'Must be a number';
    if (isNaN(formData.FSC)) newErrors.FSC = 'Must be a number';
    if (isNaN(formData.gst)) newErrors.gst = 'Must be a number';
    if (isNaN(formData.volume_divisor)) newErrors.volume_divisor = 'Must be a number';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} size="lg">
      <ModalHeader toggle={toggle}>Update Customer Rate</ModalHeader>
      <Form onSubmit={handleSubmit}>
        <ModalBody>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label for="customer">Customer*</Label>
                <Input
                  type="text"
                  name="customer"
                  id="customer"
                  value={formData.customer || ''}
                  onChange={handleChange}
                  invalid={!!errors.customer}
                />
                <FormFeedback>{errors.customer}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="weight_min">Min Weight (kg)*</Label>
                <Input
                  type="number"
                  name="weight_min"
                  id="weight_min"
                  value={formData.weight_min || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.weight_min}
                />
                <FormFeedback>{errors.weight_min}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={3}>
              <FormGroup>
                <Label for="weight_max">Max Weight (kg)</Label>
                <Input
                  type="number"
                  name="weight_max"
                  id="weight_max"
                  value={formData.weight_max || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.weight_max}
                />
                <FormFeedback>{errors.weight_max}</FormFeedback>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
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
            <Col md={4}>
              <FormGroup>
                <Label for="base_weight_slab">Base Weight Slab*</Label>
                <Input
                  type="number"
                  name="base_weight_slab"
                  id="base_weight_slab"
                  value={formData.base_weight_slab || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.base_weight_slab}
                />
                <FormFeedback>{errors.base_weight_slab}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="base_weight">Base Weight*</Label>
                <Input
                  type="number"
                  name="base_weight"
                  id="base_weight"
                  value={formData.base_weight || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.base_weight}
                />
                <FormFeedback>{errors.base_weight}</FormFeedback>
              </FormGroup>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="base_amount">Base Amount*</Label>
                <Input
                  type="number"
                  name="base_amount"
                  id="base_amount"
                  value={formData.base_amount || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.base_amount}
                />
                <FormFeedback>{errors.base_amount}</FormFeedback>
              </FormGroup>
            </Col>
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
          </Row>

          <Row>
            <Col md={4}>
              <FormGroup>
                <Label for="volume_divisor">Volume Divisor*</Label>
                <Input
                  type="number"
                  name="volume_divisor"
                  id="volume_divisor"
                  value={formData.volume_divisor || ''}
                  onChange={handleNumberChange}
                  invalid={!!errors.volume_divisor}
                />
                <FormFeedback>{errors.volume_divisor}</FormFeedback>
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
            <Col md={4}>
              <FormGroup>
                <Label for="oda_amount">ODA Amount</Label>
                <Input
                  type="number"
                  name="oda_amount"
                  id="oda_amount"
                  value={formData.oda_amount || 0}
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
          </Row>

          <Row>
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
          </Row>

          <Row>
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
                <Select 
                  styles={customStyles} 
                  value={zones.find(ele => ele.id === formData.zone)} 
                  options={zones} 
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      zone: value?.id
                    }));
                  }} 
                />
              </FormGroup>
            </Col>
            <Col md={4}>
              <FormGroup>
                <Label for="product">Product</Label>
                <Select 
                  styles={customStyles} 
                  value={products.find(ele => ele.id === formData.product)} 
                  options={products} 
                  onChange={(value) => {
                    setFormData(prev => ({
                      ...prev,
                      product: value?.id
                    }));
                  }} 
                />
              </FormGroup>
            </Col>
          
          </Row>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggle}>Cancel</Button>
          <Button color="primary" type="submit" className='d-flex justify-content-center align-items-center'>
            {loading ? <Spinner size="sm">Loading...</Spinner> : "Save Changes"}
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default UpdateCorporateDataRate;