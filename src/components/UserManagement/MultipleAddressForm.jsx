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
} from "@/components/ui";
import locations from "../../data/locations.json"
import Select from "react-select";
import { customStyles } from '../../helpers/CustomStyle';

const MultipleAddressForm = ({ addresses, setAddresses, onNextButtonClick, onPreButtonClick, cust_type, SubmiteForm, embedded = false, validateRef }) => {


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

    // follows the saved state, so a state filled in by the GST verification also lists its cities
    const stateName = addresses.state || selectedStates
    if (!stateName) return []
    return locations.filter((ele) => ele.state === stateName)
      .flatMap(state => state.cities)
      .map(obj => ({
        value: obj.name,
        label: obj.name
      }));
  }, [selectedStates, addresses.state])

  // keep the 0/200 counter right when the address is filled in from outside (GST verification)
  useEffect(() => { setAddressCount((addresses.address || '').trim().length) }, [addresses.address])


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
      setAddressErrors((prev) => ({ ...(prev || {}), [name]: undefined }))
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
    setAddressErrors((prev) => ({ ...(prev || {}), [field]: undefined }))



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
  // for a single-page host: true when the address is valid, shows the errors otherwise
  if (validateRef) {
    validateRef.current = () => {
      const errors = validateAddresses(addresses);
      setAddressErrors(errors);
      return Object.keys(errors).length === 0;
    };
  }

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
    <div className={embedded ? "" : "mt-6"}>
      {embedded ? (
        <>
          <div role="separator" className="my-3 h-px w-full bg-[rgb(var(--overlay-rgb)/0.15)]" />
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Address details</div>
        </>
      ) : <h4>Add Address</h4>}
      <div>
        <div className={embedded ? "rounded" : "mb-6 rounded"}>
          <Row>
            <Col md={6}>
              <FormGroup>
                <Label className="flex items-center justify-between">
                  <span>Address<span className="text-danger-500"> *</span></span>
                  <small className="text-ink-muted">{AddressCount}/200</small>
                </Label>
                <Input
                  type="textarea"
                  rows={2}
                  name="address"
                  value={addresses.address}
                  onChange={(e) => handleAddressChange(e)}
                  invalid={!!addressErrors?.address}
                />
                <FormFeedback>{addressErrors?.address}</FormFeedback>
              </FormGroup>
            </Col>
            <Col md={6} className={embedded ? "order-last" : ""}>
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
            <Col sm={6} md={3}>
              <FormGroup>
                <Label>Country<span className="text-danger-500"> *</span></Label>
                <Input
                  style={{ cursor: "not-allowed" }}
                  disabled
                  type="text"
                  name="country"
                  value={addresses.country}
                  // onChange={(e) => handleAddressChange(e)}
                  invalid={!!addressErrors?.country}
                />
                <small className='text-danger-500'>{addressErrors?.country}</small>
              </FormGroup>
            </Col>


            <Col sm={6} md={3}>
              <FormGroup>
                <Label>State<span className="text-danger-500"> *</span></Label>

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
                <small className='text-danger-500'>{addressErrors?.state}</small>
              </FormGroup>
            </Col>

            <Col sm={6} md={3}>
              <FormGroup>
                <Label>City<span className="text-danger-500"> *</span></Label>

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
                <small className='text-danger-500'>{addressErrors?.city}</small>
              </FormGroup>
            </Col>


            <Col sm={6} md={3}>
              <FormGroup>
                <Label>Pincode<span className="text-danger-500"> *</span></Label>

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
          </Row>
        </div>




        {embedded ? null : cust_type === "3" ? <div className='flex gap-4 mt-12 justify-end'>
            <Button color="primary" className='px-6 py-2' onClick={() => {
              onPreButtonClick(1)
            }}>Prev</Button>
            <Button color="primary" className='px-6 py-2' onClick={handleSubmit}>Next</Button>
          </div> : <div className='flex gap-4 mt-12 justify-end'>
            <Button color="primary" className='px-6 py-2' onClick={() => {
              onPreButtonClick(1)
            }}>Prev</Button>
            <Button color="primary" className='px-6 py-2' onClick={SubmitwholeForm}>Submit</Button>
          </div>
        }

      </div>
    </div>
  );
};

export default MultipleAddressForm;
