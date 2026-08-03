import React from "react";
import { Row, Col, FormGroup, Label } from "@/components/ui";
import Select from "react-select";

export const FilterBar = ({ filterObj, setFilterObj, checkpointOptions, onApply, onClear, isFilterActive, customStyles }) => {
    return (
        <Row className="g-3 my-3 bg-light rounded-2">
            <Col md={3}>
                <FormGroup>
                    <Label for="checkpoint" className="fw-bold">Select Checkpoint</Label>
                    <Select
                        id="checkpoint"
                        value={filterObj.checkpt ? checkpointOptions.find(opt => opt.value === filterObj.checkpt) : null}
                        options={checkpointOptions}
                        className="bg-light"
                        onChange={(val) => setFilterObj({ ...filterObj, checkpt: val?.value })}
                        placeholder="Search Checkpoint"
                        isClearable
                        styles={customStyles}
                    />
                </FormGroup>
            </Col>

            <Col md={3} className="d-flex align-items-end mb-3">
                <button className="btn btn-primary w-full" onClick={onApply}>Apply Filters</button>
            </Col>

            <Col md={3} className="d-flex align-items-end mb-3">
                {isFilterActive && (
                    <button className="btn bg-danger text-white w-full" onClick={onClear}>
                        Clear Filters
                    </button>
                )}
            </Col>
        </Row>
    );
};
