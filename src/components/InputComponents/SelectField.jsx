import React from "react";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { Form } from "react-bootstrap";

const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  onInputChange,
  isClearable = false,
  isAsync = false,
  loadOptions,
  isHighlight = false,
  width = "100%",
  placeholder = "Select...",
  noOptionsMessage = "No options found",
}) => {
  const renderLabel = (text) => {
    const parts = text.split("*");
    return (
      <>
        {parts[0]}
        {text.includes("*") && <span className="text-danger">*</span>}
      </>
    );
  };

  const SelectComponent = isAsync ? AsyncSelect : Select;

  const handleChange = (selected) => {
    onChange(name, selected);
  };

  return (
    <Form.Group className="mb-2" style={{ width }}>
      {label && (
        <Form.Label className="fw-bold">
          {renderLabel(label)}
        </Form.Label>
      )}

      <SelectComponent
        name={name}
        value={value || null}
        onChange={handleChange}
        options={!isAsync ? options : undefined}
        loadOptions={isAsync ? loadOptions : undefined}
        isClearable={isClearable}
        onInputChange={onInputChange}
        placeholder={placeholder}
        menuPortalTarget={document.body}
        noOptionsMessage={() => noOptionsMessage}
        defaultOptions={isAsync}
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            minHeight: "38px",
            borderColor: error
              ? "#dc3545"
              : isHighlight
                ? "#fd7e14"
                : state.isFocused
                  ? "#86b7fe"
                  : "#ced4da",
            boxShadow: "none",
            "&:hover": {
              borderColor: error ? "#dc3545" : "#86b7fe",
            },
          }),
          menuPortal: (base) => ({
            ...base,
            zIndex: 9999,
          }),
          menu: (base) => ({
            ...base,
            zIndex: 9999,
          }),
        }}
      />

      {error && (
        <Form.Text className="text-danger small">
          {error}
        </Form.Text>
      )}
    </Form.Group>
  );
};

export default SelectField;
