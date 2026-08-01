import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row, FormFeedback } from "reactstrap"
import { Country, State, City } from "country-state-city";
import Select from "react-select";
import { customStyles } from "../../../helpers/CustomStyle";
const EditAddress = ({ formData, onInputChange ,onSelectChange }) => {

    const [StateOptions, setStatesOptions] = useState([])
    const [errors, setErrors] = useState({})
    const addressPattern = /^[a-zA-Z0-9\s,.\-/']*$/

    useEffect(() => {

        const states = State.getStatesOfCountry("IN").map((state) => ({
            value: state.isoCode,
            label: state.name,
        }));
        setStatesOptions(states)
    }, [])

    const handleAddressInputChange = (e) => {
        const { name, value } = e.target

        if ((name === 'address' || name === 'landmark') && value) {
            if (!addressPattern.test(value)) {
                const fieldLabel = name === 'address' ? 'Address' : 'Landmark'
                setErrors(prev => ({
                    ...prev,
                    [name]: `${fieldLabel}: Special characters not allowed. Use only letters, numbers, spaces, commas, periods, hyphens, slashes, and apostrophes`
                }))
                return
            }
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }))
        }

        onInputChange(e)
    }

    const [CityOptions, setCityOptions] = useState([])

    const handleAddressDropdownChange = (field, option) => {

        if (field === "state") {
            const cities = City.getCitiesOfState("IN", option.value).map((city) => ({
                value: city.name,
                label: city.name,
            }));
            setCityOptions(cities)
        }
    };

    return (
        <Card className="mb-4">
            <CardHeader className="d-flex justify-content-between">
                <p>Edit Address</p>
                {/* <Button color="primary">Update Address</Button> */}
            </CardHeader>
            <CardBody>


                <Row>
                    <Col md={12}>
                        <FormGroup>
                            <Label>Address</Label>
                            <Input
                                type="textarea"
                                name="address"
                                value={formData?.address}
                                onChange={handleAddressInputChange}
                                invalid={!!errors?.address}
                            />
                            {errors?.address && <FormFeedback className="d-block">{errors.address}</FormFeedback>}
                        </FormGroup>
                    </Col>

                    <Col md={6}>
                        <FormGroup>
                            <Label>Country</Label>
                            <Input
                                type="text"
                                name="country"
                                value={formData?.country}
                                onChange={onInputChange}
                            />

                            {/* <Select
                                options={CityOptions}
                                onChange={(option) => handleAddressDropdownChange("city", option)}
                                value={{
                                    value: addresses.city,
                                    label: addresses.city,
                                }}
                                placeholder="Select city"
                                styles={customStyles}
                            /> */}

                        </FormGroup>

                    </Col>

                    <Col md={6}>
                        <FormGroup>
                            <Label>State</Label>
                            <Select
                                options={StateOptions}
                                onChange={(option) => {
                                    handleAddressDropdownChange("state", option)
                                    onSelectChange("state",option)
                                }}
                                value={{
                                    value: formData?.state,
                                    label: formData?.state,
                                }}
                                placeholder="Select state"
                                styles={customStyles}
                            />

                        </FormGroup>
                    </Col>

                    <Col md={6}>
                        <FormGroup>


                            <Label>City</Label>
                            {/* <Input
                                type="text"
                                name="city"
                                value={formData?.city}
                                onChange={onInputChange}
                            /> */}

                            <Select
                                options={CityOptions}
                                onChange={(option) => {
                                    handleAddressDropdownChange("city", option)
                                    onSelectChange("city",option)
                                }}
                                value={{
                                    value: formData?.city,
                                    label: formData?.city,
                                }}
                                placeholder="Select city"
                                styles={customStyles}
                            />

                        </FormGroup>
                    </Col>

                    <Col md={6}>
                        <FormGroup>
                            <Label>Pincode</Label>
                            <Input
                                type="text"
                                name="pincode"
                                value={formData?.pincode}
                                onChange={onInputChange}

                            />

                        </FormGroup>
                    </Col>

                    <Col md={12}>
                        <FormGroup>
                            <Label>Landmark (optional)</Label>
                            <Input
                                type="text"
                                name="landmark"
                                value={formData?.landmark}
                                onChange={handleAddressInputChange}
                                invalid={!!errors?.landmark}
                            />
                            {errors?.landmark && <FormFeedback className="d-block">{errors.landmark}</FormFeedback>}
                        </FormGroup>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    )
}

export default EditAddress