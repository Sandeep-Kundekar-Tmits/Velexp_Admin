import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row } from "reactstrap"
import { Country, State, City } from "country-state-city";
import Select from "react-select";
import { customStyles } from "../../../helpers/CustomStyle";
const EditAddress = ({ formData, onInputChange ,onSelectChange }) => {

    const [StateOptions, setStatesOptions] = useState([])
    useEffect(() => {

        const states = State.getStatesOfCountry("IN").map((state) => ({
            value: state.isoCode,
            label: state.name,
        }));
        setStatesOptions(states)
    }, [])

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
                                onChange={onInputChange}
                            />

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
                                onChange={onInputChange}
                            />

                        </FormGroup>
                    </Col>
                </Row>
            </CardBody>
        </Card>
    )
}

export default EditAddress