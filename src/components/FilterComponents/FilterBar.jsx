import React from "react";
import { Row, Col, FormGroup, Label } from "@/components/ui";
import Select from "react-select";

export const FilterBar = ({ filterObj, setFilterObj, checkpointOptions, onApply, onClear, isFilterActive, customStyles }) => {
    return (
        <Row className="gap-4 my-4 bg-canvas rounded-2">
            <Col md={3}>
                <FormGroup>
                    <Label for="checkpoint" className="font-bold">Select Checkpoint</Label>
                    <Select
                        id="checkpoint"
                        value={filterObj.checkpt ? checkpointOptions.find(opt => opt.value === filterObj.checkpt) : null}
                        options={checkpointOptions}
                        className="bg-canvas"
                        onChange={(val) => setFilterObj({ ...filterObj, checkpt: val?.value })}
                        placeholder="Search Checkpoint"
                        isClearable
                        styles={customStyles}
                    />
                </FormGroup>
            </Col>

            <Col md={3} className="flex items-end mb-4">
                <button className="btn btn-primary w-full" onClick={onApply}>Apply Filters</button>
            </Col>

            <Col md={3} className="flex items-end mb-4">
                {isFilterActive && (
                    <button className="btn bg-danger-500 text-white w-full" onClick={onClear}>
                        Clear Filters
                    </button>
                )}
            </Col>
        </Row>
    );
};
