import PropTypes from "prop-types";
import Select from "react-select";
import { Button, Col, FormGroup, Label, Row } from "@/components/ui";
import DateRangeInput from "@/components/Common/DateRangeInput";
import { customStyles, CheckboxOption, SelectedCountValue } from "@/helpers/CustomStyle";
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
      menuPortalTarget={document.body}
      menuPosition="fixed"
      {...(isMulti && {
        /* A checkbox per option, and a "N Selected" count in the control
           instead of one chip per value -- controlShouldRenderValue was false
           with nothing else standing in for it, so a multi-select here gave
           no indication of what was picked once the menu closed.
           hideSelectedOptions/closeMenuOnSelect false so a picked option stays
           visible and checked rather than vanishing from the list. */
        hideSelectedOptions: false,
        closeMenuOnSelect: false,
        components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
      })}
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
        /* xs/sm as well as md: with only `md` set, a Col below that breakpoint
           has no width at all and falls back to shrink-to-content, so on a
           phone six filters queued up on one line squeezed to nothing. One per
           row on phones, two up on small tablets, the config's own span from
           md. */
        <Col key={descriptor.name} xs={12} sm={6} md={descriptor.span ?? 3}>
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
      {/* items-end rather than the old mt-6: the button has no label above it,
          so it was being nudged down by a hand-tuned margin that matched the
          label height at one font size and broke on a phone, where there is no
          label to clear. Aligning to the bottom of the row does it at every
          width. */}
      <Col xs={12} sm={6} md={2} className="mb-2 flex items-end">
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
