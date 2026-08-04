import PropTypes from "prop-types";
import Select from "react-select";
import { Button, Col, FormGroup, Label, Row } from "@/components/ui";
import DateRangeInput from "@/components/Common/DateRangeInput";
import { customStyles } from "@/helpers/CustomStyle";
import { useReferenceList } from "./useReferenceList";

/**
 * Renders a report's filters from its descriptors.
 *
 * Replaces the per-screen block of useState calls, useEffect dropdown
 * hydration and {value,label} mapping that is copy-pasted across ~29 screens.
 * The controls themselves are unchanged (react-select + DateRangeInput), so
 * the rendered filter bar looks the same as before.
 */
function FilterField({ descriptor, value, onChange }) {
  const { options, isLoading } = useReferenceList(descriptor);

  if (descriptor.type === "dateRange") {
    return (
      <DateRangeInput
        value={value ?? { startDate: "", endDate: "" }}
        onChange={onChange}
        isBorder
      />
    );
  }

  if (descriptor.type === "text") {
    return (
      <input
        className="form-control"
        placeholder={descriptor.placeholder}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  const isMulti = descriptor.type === "multiSelect";
  return (
    <Select
      options={options}
      isMulti={isMulti}
      isClearable
      value={value ?? (isMulti ? [] : null)}
      onChange={onChange}
      placeholder={isLoading ? "Loading..." : descriptor.placeholder ?? "Search"}
      styles={customStyles}
      {...(isMulti
        ? { controlShouldRenderValue: false, hideSelectedOptions: false }
        : { menuPortalTarget: document.body, menuPosition: "fixed" })}
    />
  );
}

FilterField.propTypes = {
  descriptor: PropTypes.object.isRequired,
  value: PropTypes.any,
  onChange: PropTypes.func.isRequired,
};

export default function FilterBar({ filters, values, onChange, onSubmit, isLoading, submitLabel }) {
  return (
    <Row>
      {filters.map((descriptor) => (
        <Col key={descriptor.name} md={descriptor.span ?? 3}>
          <FormGroup className="mb-2">
            {descriptor.label && <Label>{descriptor.label}</Label>}
            <FilterField
              descriptor={descriptor}
              value={values[descriptor.name]}
              onChange={(v) => onChange(descriptor.name, v)}
            />
          </FormGroup>
        </Col>
      ))}
      <Col md={2} className="flex mb-4 content-center flex-wrap gap-2 mt-6">
        <Button
          color="primary"
          onClick={onSubmit}
          disabled={isLoading}
          style={{ height: "2.2rem", width: "100%" }}
        >
          {isLoading ? "Checking..." : (submitLabel ?? "Check")}
        </Button>
      </Col>
    </Row>
  );
}

FilterBar.propTypes = {
  filters: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
  submitLabel: PropTypes.string,
};
