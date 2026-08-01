import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Form,
  FormGroup,
  Label,
  Input,
  Button,
  Row,
  Col,
  FormFeedback,
} from 'reactstrap';
import locations from "../../data/locations.json"
import Select from "react-select";
import { customStyles } from '../../helpers/CustomStyle';

const MultipleAddressForm = ({ addresses, setAddresses, onNextButtonClick, onPreButtonClick, cust_type, SubmiteForm }) => {


  const [selectedStates, setSelectedStates] = useState("")
  const [selectedCity, setSelectedCity] = useState("")

  const [AddressCount, setAddressCount] = useState(0)
  // get all States
  const AllStates = useMemo(() => {
    return locations.map((ele) => ({
      value: ele.state,
      label: ele?.state
    }))
  }, [])



  // get all filtered  Cities
  const AllCities = useMemo(() => {

    if (!selectedStates) return []
    return locations.filter((ele) => ele.state === selectedStates)
      .flatMap(state => state.cities)
      .map(obj => ({
        value: obj.name,
        label: obj.name
      }));
  }, [selectedStates])


  // get all filtered Pincode
  const GetAllPinCodes = useMemo(() => {
    if (!selectedCity) return [];

    return locations
      .flatMap(state => state.cities)
      .filter(city => city.name === selectedCity)
      .map(city => ({
        value: city.pincode,
        label: city.pincode,
      }));
  }, [selectedCity]);

  // errors
  const [addressErrors, setAddressErrors] = useState([]);



  const handleAddressChange = (e) => {
    const { name, value } = e.target
    const error = {}
    const addressPattern = /^[a-zA-Z0-9\s,.\-/']*$/

    if (name === "address") {
      if (!addressPattern.test(value)) {
        error.address = "Special characters not allowed. Use only letters, numbers, spaces, commas, periods, hyphens, slashes, and apostrophes"
        setAddressErrors(error)
        return
      }
      let count = value.trim().length
      setAddressCount(count)
      if (count < 200) {
        setAddresses({
          ...addresses,
          [name]: value
        })
      }
      else {
        setAddressCount(200)
        setAddresses({
          ...addresses,
          [name]: value.trim().substring(0, 200)
        })
        error.address = "Not allowed to enter more then 200 characters"
      }
      setAddressErrors(error)
    }
    else if (name === "landmark") {
      if (!addressPattern.test(value)) {
        error.landmark = "Special characters not allowed. Use only letters, numbers, spaces, commas, periods, hyphens, slashes, and apostrophes"
        setAddressErrors(error)
        return
      }
      setAddresses({
        ...addresses,
        [name]: value
      })
      setAddressErrors({})
    }
    else {
      setAddresses({
        ...addresses,
        [name !== "address" && name]: value
      })
    }

  };

  // only for the select dropdown
  const handleAddressDropdownChange = (field, option) => {

    if (field === "state") {
      setAddresses(prevAddresses => ({
        ...prevAddresses,
        city: null,
        pincode: null
      }));
    }

    if (field === "city") {
      setAddresses(prevAddresses => ({
        ...prevAddresses,
        pincode: null
      }));
    }


    setAddresses(prevAddresses => ({
      ...prevAddresses,
      [field]: option?.label
    }));



  };


  const validateAddresses = (address) => {
    const errors = {};

    if (!address.address) {
      errors.address = 'Address is required';
    }

    if (!address.city) {
      errors.city = 'City is required';
    }

    if (!address.state) {
      errors.state = 'State is required';
    }

    if (!address.country) {
      errors.country = 'Country is required';
    }

    if (!address.pincode) {
      errors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(addresses.pincode)) {
      errors.pincode = 'Pincode must be 6 digits';
    }

    return errors

  };



  //  this function check all the error if their are no error then will go to next step
  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validateAddresses(addresses);
    setAddressErrors(errors);
    if (Object.keys(errors).length === 0) {
      // form 2

      console.log(addresses, "go next step")
      onNextButtonClick(3)
    } else {
      console.log('Form has errors', addresses);
    }
  };


  const SubmitwholeForm = () => {
    const errors = validateAddresses(addresses);
    setAddressErrors(errors);
    if (Object.keys(errors).length === 0) {
      {
        console.log("submiting form")
        SubmiteForm()
      }
    }
  }

  return (
    <div className="mt-4">
      <h4>Add Address</h4>
      <div>
        <div className="  mb-4 rounded">
          <Row>
            <Col md={12}>
              <FormGroup>
                <Label>Address</Label>
                <Input
                  type="textarea"
                  name="address"
                  value={addresses.address}
                  onChange={(e) => handleAddressChange(e)}
                  invalid={!!addressErrors?.address}
                />
                <small>{AddressCount}/200</small>
                <FormFeedback>{addressErrors?.address}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={6}>
              <FormGroup>
                <Label>Country</Label>
                <Input
                  style={{ cursor: "not-allowed" }}
                  disabled
                  type="text"
                  name="country"
                  value={addresses.country}
                  // onChange={(e) => handleAddressChange(e)}
                  invalid={!!addressErrors?.country}
                />
                <small className='text-danger'>{addressErrors?.country}</small>
              </FormGroup>
            </Col>


            <Col md={6}>
              <FormGroup>
                <Label>State</Label>

                <Select
                  options={AllStates}
                  onChange={(option) => {
                    handleAddressDropdownChange("state", option)
                    setSelectedStates(option.value)
                  }}
                  value={{
                    value: addresses.state,
                    label: addresses.state,
                  }}
                  placeholder="Select state"
                  styles={customStyles}
                />
                {/* <Input
                  type="text"
                  name="state"
                  value={addresses.state}
                  onChange={(e) => handleAddressChange(e)}
                  invalid={!!addressErrors?.state}
                /> */}
                <small className='text-danger'>{addressErrors?.state}</small>
              </FormGroup>
            </Col>

            <Col md={6}>
              <FormGroup>
                <Label>City</Label>

                <Select
                  options={AllCities}
                  onChange={(option) => {
                    setSelectedCity(option.value)
                    handleAddressDropdownChange("city", option)
                  }}
                  value={{
                    value: addresses.city,
                    label: addresses.city,
                  }}
                  placeholder="Select city"
                  styles={customStyles}
                />
                {/* <Input
                  type="text"
                  name="city"
                  value={addresses.city}
                  onChange={(e) => handleAddressChange(e)}
                  invalid={!!addressErrors?.city}
                /> */}
                <small className='text-danger'>{addressErrors?.city}</small>
              </FormGroup>
            </Col>


            <Col md={6}>
              <FormGroup>
                <Label>Pincode</Label>

                <Input
                  type="text"
                  name="pincode"
                  value={addresses.pincode}
                  onChange={(e) => handleAddressChange(e)}
                  invalid={!!addressErrors?.pincode}
                />

                {/* <Select
                  options={GetAllPinCodes}
                  onChange={(option) => {
                    handleAddressDropdownChange("pincode", option)
                  }}
                  value={{
                    value: addresses.pincode,
                    label: addresses.pincode,
                  }}
                  placeholder="Select pincode"
                  styles={customStyles}
                /> */}
                <FormFeedback>{addressErrors?.pincode}</FormFeedback>
              </FormGroup>
            </Col>

            <Col md={12}>
              <FormGroup>
                <Label>Landmark (optional)</Label>
                <Input
                  type="text"
                  name="landmark"
                  value={addresses.landmark || ''}
                  onChange={(e) => handleAddressChange(e)}
                />

              </FormGroup>
            </Col>
          </Row>


        </div>




        {
          cust_type === "3" ? <div className='d-flex gap-3 mt-5 justify-content-end'>
            <Button color="primary" className='px-4 py-2' onClick={() => {
              onPreButtonClick(1)
            }}>Prev</Button>
            <Button color="primary" className='px-4 py-2' onClick={handleSubmit}>Next</Button>
          </div> : <div className='d-flex gap-3 mt-5 justify-content-end'>
            <Button color="primary" className='px-4 py-2' onClick={() => {
              onPreButtonClick(1)
            }}>Prev</Button>
            <Button color="primary" className='px-4 py-2' onClick={SubmitwholeForm}>Submit</Button>
          </div>
        }

      </div>
    </div>
  );
};

export default MultipleAddressForm;
