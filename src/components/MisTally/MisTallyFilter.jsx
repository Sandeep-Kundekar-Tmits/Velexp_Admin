import { Button, Col, Label, Row } from "reactstrap";
import Select from 'react-select';
import { useEffect, useState } from 'react';
import { customStyles } from "../../helpers/CustomStyle";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_COST_CENTERS_AND_REGIONS } from "../../api";

const MisTallyFilter = ({ FilterData, Removefilter, RecallInfo }) => {
    // State for options
    const [yearOptions, setYearOptions] = useState([]);
    const [monthOptions, setMonthOptions] = useState([]);
    const [costCenterOptions, setCostCenterOptions] = useState([]);
    const [regionOptions, setRegionOptions] = useState([]);

    // State for selected values
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(null);
    const [selectedCostCenter, setSelectedCostCenter] = useState(null);
    const [selectedRegion, setSelectedRegion] = useState(null);

    // definging the get MIS get api
    const { apifunc: GetMisRegionsAndCostCenters, data: RegionsAndCostCenters, loading: RegionsAndCostCentersLoading } = useGetApiCall()

    // Initialize year and month options
    useEffect(() => {
        // Generate year options (from 2020 to current year)
        const currentYear = new Date().getFullYear();
        const years = [];
        for (let year = 2020; year <= currentYear; year++) {
            years.push({ value: year, label: year.toString() });
        }
        setYearOptions(years);

        // Generate month options (1-12 with names)
        const months = [
            { value: 1, label: 'January' },
            { value: 2, label: 'February' },
            { value: 3, label: 'March' },
            { value: 4, label: 'April' },
            { value: 5, label: 'May' },
            { value: 6, label: 'June' },
            { value: 7, label: 'July' },
            { value: 8, label: 'August' },
            { value: 9, label: 'September' },
            { value: 10, label: 'October' },
            { value: 11, label: 'November' },
            { value: 12, label: 'December' }
        ];
        setMonthOptions(months);

        //  calling the get regions and cost center apis
        GetMisRegionsAndCostCenters(GET_ALL_COST_CENTERS_AND_REGIONS)
    }, [RecallInfo]);

    useEffect(() => {
        if (RegionsAndCostCenters) {
            let regions = RegionsAndCostCenters?.regions.map((ele) => {
                return {
                    value: ele,
                    label: ele
                }
            })

            setRegionOptions(regions)

            // cost centers
            let cost_centers = RegionsAndCostCenters?.cost_service_centers.map((ele) => {
                return {
                    value: ele,
                    label: ele
                }
            })
            setCostCenterOptions(cost_centers)
        }
    }, [RegionsAndCostCenters])

    // filter on Click
    const OnFilterClick = () => {
        let payload = {
            "month": selectedMonth.value,
            "year": selectedYear.value,
            "region": selectedRegion?.value ? selectedRegion?.value : "All",
            "cost_service_center": selectedCostCenter?.value ? selectedCostCenter?.value : "All"
        }
        // // call back function
        FilterData(payload)
    }

    // Clear all filters
    const onClearFilters = () => {
        setSelectedYear(null);
        setSelectedMonth(null);
        setSelectedCostCenter(null);
        setSelectedRegion(null);
        // calling the callback function
        Removefilter()

    }

    return (
        <div className="" >
            <Row className="">
                <Col md={2}>
                    <Select
                        id="Year"
                        options={yearOptions}
                        value={selectedYear}
                        onChange={setSelectedYear}
                        isClearable={true}
                        styles={customStyles}
                        placeholder="Select Year"
                    />
                </Col>
                <Col md={2}>
                    <Select
                        id="months"
                        options={monthOptions}
                        value={selectedMonth}
                        onChange={setSelectedMonth}
                        isClearable={true}
                        styles={customStyles}
                        placeholder="Select Month"
                    />
                </Col>
                <Col md={3}>

                    <Select
                        id="Cost_center"
                        options={costCenterOptions}
                        value={selectedCostCenter}
                        isClearable={true}
                        onChange={setSelectedCostCenter}
                        placeholder={RegionsAndCostCentersLoading ? "Loading..." : "Cost Center"}
                        isLoading={RegionsAndCostCentersLoading}
                        isDisabled={RegionsAndCostCentersLoading}
                        styles={customStyles}
                    />
                </Col>
                <Col md={2}>

                    <Select
                        id="reigon"
                        options={regionOptions}
                        value={selectedRegion}
                        isClearable={true}
                        onChange={setSelectedRegion}
                        placeholder={RegionsAndCostCentersLoading ? "Loading..." : "Select Region"}
                        isLoading={RegionsAndCostCentersLoading}
                        isDisabled={RegionsAndCostCentersLoading}
                        styles={customStyles}
                    />
                </Col>
                <Col md={3} className="d-flex justify-content-center align-items-end gap-2">


                    <Button disabled={!selectedYear && !selectedMonth} style={{ width: "220px" }} color="primary" className="" onClick={OnFilterClick}>
                        Filter
                    </Button>


                    <Button
                        style={{ width: "220px" }}
                        color="danger"
                        className=""
                        onClick={onClearFilters}
                        disabled={!selectedYear && !selectedMonth && !selectedCostCenter && !selectedRegion}
                    >
                        Clear
                    </Button>

                </Col>
            </Row>
        </div>
    );
};

export default MisTallyFilter;