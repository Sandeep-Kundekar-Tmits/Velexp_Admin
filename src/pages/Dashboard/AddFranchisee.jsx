import React, { useEffect, useState } from 'react';
import {
  Row, Col, Form, FormGroup, Label, Input, Button, FormText
} from 'reactstrap';
import Validation from '../../helpers/Validation';
import { State, City } from 'country-state-city';
import Select from 'react-select'
import { customStyles } from '../../helpers/CustomStyle';
const AddFranchisee = () => {
  const { allowOnlyString, validateEmail, validateNumber, validateForm, validatePanCard } = Validation()
  const franchiseeValidationRules = {
    name: {
      required: true,
      requiredMessage: 'Name is required',
    },
    contactPerson: {
      required: true,
      requiredMessage: 'Contact person is required',
    },
    contactNo: {
      required: true,
      requiredMessage: 'Contact No. is required',
      validate: (phone) => {
        return phone && phone.length >= 10;
      },
      validationMessage: 'Contact No. should be of 10 numbers'
    },
    email: {
      required: true,
      requiredMessage: 'Email is required',
      validate: validateEmail,
      validationMessage: 'Email is not valid'
    },
    username: {
      required: true,
      requiredMessage: 'Username is required',
    },
    password: {
      required: true,
      requiredMessage: 'Password is required',
    },
    landmark: {
      required: true,
      requiredMessage: 'Landmark is required',
    },
    address: {
      required: true,
      requiredMessage: 'Address is required',
    },
    state: {
      required: true,
      requiredMessage: 'State is required',
    },
    city: {
      required: true,
      requiredMessage: 'City is required',
    },
    pincode: {
      required: true,
      requiredMessage: 'Pincode is required',
      validate: (value) => {
        return value.length === 6
      },
      validationMessage: 'Pincode cannot less or greater then 6 digits'
    },
    bankAD: {
      required: true,
      requiredMessage: 'bankAD is required',
    },
    bankAccount: {
      required: true,
      requiredMessage: 'bank account  is required',
    },
    pancardNo: {
      required: true,
      requiredMessage: 'pancard No  is required',
      validate: validatePanCard,
      validationMessage: 'pan card is not valid'
    },
    gstinNo: {
      required: true,
      requiredMessage: 'GST No  is required',
    },
    bankIFSC: {
      required: true,
      requiredMessage: 'bank IFSC is required',
    },
    tanNo: {
      required: true,
      requiredMessage: 'Tan No is required',
    },
    gstUpload: {
      required: true,
      requiredMessage: 'Field  is required',
    }
  };

  // states to map
  const [states, setStates] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState('');
  const [cities, setCities] = useState([]);

  // Load states on mount
  useEffect(() => {
    const indiaStates = State.getStatesOfCountry('IN').map((state) => {
      return {
        ...state,
        value: state?.name,
        label: state?.name,
        countryCode: state?.countryCode,
        isoCode: state?.isoCode,
        latitude: state?.latitude,
        longitude: state?.longitude,
      }
    })

    console.log(indiaStates, "states")
    setStates(indiaStates);
  }, []);

  // Load cities when a state is selected
  useEffect(() => {
    if (selectedStateCode) {
      const citiesList = City.getCitiesOfState('IN', selectedStateCode).map((city) => {
        return {
          ...city,
          value: city?.name,
          label: city?.name,
          name: city?.name,
          countryCode: city?.countryCode,
          stateCode: city?.stateCode,
          latitude: city?.latitude,
          longitude: city?.longitude
        }
      })
      console.log(citiesList, "citiesList")
      setCities(citiesList);
    } else {
      setCities([]);
    }
  }, [selectedStateCode]);

  const [franchisee, setFranchisee] = useState({
    name: '',
    contactPerson: '',
    contactNo: '',
    email: '',
    username: '',
    password: '',
    address: '',
    landmark: '',
    state: '',
    city: '',
    pincode: '',
    bankAD: '',
    bankAccount: '',
    pancardNo: '',
    gstinNo: '',
    bankIFSC: '',
    tanNo: '',
    gstUpload: null
  });


  const [errors, setErrors] = useState({});

  const handleFranchiseeChange = (e) => {
    const { id, value, files } = e.target;
    setFranchisee({
      ...franchisee,
      [id]: files ? files[0] : value
    });
  };


  const handleSubmit = (e) => {
    const validationErrors = validateForm(franchisee, franchiseeValidationRules);;
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    console.log('Franchisee:', franchisee);
    alert('Form submitted!');
    setErrors({});
  };

  return (
    <div className='page-content'>
      <div className="container-fluid">
        <h3 className=''>Add Franchisee</h3>
        <Form onSubmit={handleSubmit} >

          <div className='mt-3'>
            <Row form className=''>
              <Col md={4}>
                <FormGroup>
                  <Label for="name">Name*</Label>
                  <Input type="text" id="name" value={franchisee.name} onChange={(e) => allowOnlyString(e.target.value) && handleFranchiseeChange(e)} invalid={!!errors.name} />
                  {errors.name && <FormText color="danger">{errors.name}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="contactPerson">Contact Person</Label>
                  <Input type="text" id="contactPerson" value={franchisee.contactPerson} onChange={handleFranchiseeChange} invalid={!!errors.contactPerson} />
                  {errors.contactPerson && <FormText color="danger">{errors.contactPerson}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="contactNo">Contact No.*</Label>
                  <Input type="text" id="contactNo" value={franchisee.contactNo} onChange={(e) => {
                    if (validateNumber(e.target.value)) {
                      let number = e.target.value
                      if (number.length <= 10) {
                        handleFranchiseeChange(e)
                      }

                    }
                  }} invalid={!!errors.contactNo} />
                  {errors.contactNo && <FormText color="danger">{errors.contactNo}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="email">Email</Label>
                  <Input type="email" id="email" value={franchisee.email} onChange={handleFranchiseeChange} invalid={!!errors.email} />
                  {errors.email && <FormText color="danger">{errors.email}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup autoComplete="off">
                  <Label for="username">Username</Label>
                  <Input name='user_name_input' type="text" id='username' value={franchisee.username} autoComplete="off" onChange={(e) => handleFranchiseeChange(e)} invalid={!!errors.username} />
                  {errors.username && <FormText color="danger">{errors.username}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="password">Password</Label>
                  <Input type="password" id="password" autoComplete="off" value={franchisee.password} onChange={handleFranchiseeChange} invalid={!!errors.password} />
                  {errors.password && <FormText color="danger">{errors.password}</FormText>}
                </FormGroup>
              </Col>
              <Row md={12}>
                <Col md={12}>
                  <FormGroup>
                    <Label for="address">Address*</Label>
                    <Input type="text" id="address" value={franchisee.address} onChange={handleFranchiseeChange} invalid={!!errors.address} />
                    {errors.address && <FormText color="danger">{errors.address}</FormText>}
                  </FormGroup>
                </Col>
                <Col md={12}>
                  <FormGroup>
                    <Label for="landmark">Landmark</Label>
                    <Input type="text" id="landmark" value={franchisee.landmark} onChange={handleFranchiseeChange} invalid={!!errors.landmark} />
                    {errors.landmark && <FormText color="danger">{errors.landmark}</FormText>}
                  </FormGroup>
                </Col>
              </Row>
              <Col md={4}>
                <FormGroup>
                  <Label for="state">State*</Label>
                  <div>
                    <Select options={states} onChange={(value) => {
                      setFranchisee({
                        ...franchisee,
                        state: value?.name
                      })
                      // isoCode
                      setSelectedStateCode(value?.isoCode)
                    }}
                      styles={customStyles}
                    />
                  </div>
                  {errors.state && <FormText color="danger">{errors.state}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="city">City*</Label>
                  <Select options={cities} onChange={(value) => {
                    setFranchisee({
                      ...franchisee,
                      city: value?.name
                    })
                  }}
                    styles={customStyles}

                  />
                  {/* <Select options={ } /> */}
                  {errors.city && <FormText color="danger">{errors.city}</FormText>}
                </FormGroup>
              </Col>

              {/* Pincode */}
              <Col md={4}>
                <FormGroup>
                  <Label for="pincode">Pincode*</Label>
                  <Input type="text" id="pincode" value={franchisee.pincode} onChange={(e) => validateNumber(e.target.value) && handleFranchiseeChange(e)} invalid={!!errors.pincode} />
                  {errors.pincode && <FormText color="danger">{errors.pincode}</FormText>}
                </FormGroup>
              </Col>
            </Row>

            <h4 className='mt-4 fw-bold'>Bank Details</h4>
            <Row form className=''>
              <Col md={4}>
                <FormGroup>
                  <Label for="bankAD">Bank AD</Label>
                  <Input type="text" id="bankAD" value={franchisee.bankAD} onChange={(e) => validateNumber(e.target.value) && handleFranchiseeChange(e)} invalid={!!errors.bankAD} />
                  {errors.bankAD && <FormText color="danger">{errors.bankAD}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="bankAccount">Bank Account</Label>
                  <Input type="text" id="bankAccount" value={franchisee.bankAccount} onChange={(e) => validateNumber(e.target.value) && handleFranchiseeChange(e)} invalid={!!errors.bankAccount} />
                  {errors.bankAccount && <FormText color="danger">{errors.bankAccount}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="pancardNo">Pancard No.</Label>
                  <Input type="text" id="pancardNo" value={franchisee.pancardNo} onChange={handleFranchiseeChange} invalid={!!errors.pancardNo} />
                  {errors.pancardNo && <FormText color="danger">{errors.pancardNo}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="gstinNo">GSTIN No.</Label>
                  <Input type="text" id="gstinNo" value={franchisee.gstinNo} onChange={handleFranchiseeChange} invalid={!!errors.gstinNo} />
                  {errors.gstinNo && <FormText color="danger">{errors.gstinNo}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="bankIFSC">Bank IFSC</Label>
                  <Input type="text" id="bankIFSC" value={franchisee.bankIFSC} onChange={handleFranchiseeChange} invalid={!!errors.bankIFSC} />
                  {errors.bankIFSC && <FormText color="danger">{errors.bankIFSC}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="tanNo">Tan No.</Label>
                  <Input type="text" id="tanNo" value={franchisee.tanNo} onChange={handleFranchiseeChange} invalid={!!errors.tanNo} />
                  {errors.tanNo && <FormText color="danger">{errors.tanNo}</FormText>}
                </FormGroup>
              </Col>
              <Col md={4}>
                <FormGroup>
                  <Label for="gstUpload">Upload GST</Label>
                  <Input type="file" id="gstUpload" onChange={handleFranchiseeChange} invalid={!!errors.gstUpload} />
                  <FormText color="muted">Upload GST file if available</FormText>
                  <br />
                  {errors.gstUpload && <FormText color="danger">{errors.gstUpload}</FormText>}
                </FormGroup>
              </Col>
            </Row>

            <Button color="primary" onClick={handleSubmit} className='mt-4' style={{ marginLeft: "-12px", width: "10rem" }}>Submit</Button>
          </div>
        </Form>
      </div>
    </div>
  );
};

export default AddFranchisee;
