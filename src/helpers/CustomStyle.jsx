import PropTypes from "prop-types";
import { components } from "react-select";
import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * react-select styling, shared by 57 screens.
 *
 * Colours resolve from the design tokens rather than literals so the control
 * follows the theme. That also makes it correct inside [data-print-surface]
 * roots for free: those redeclare the same variables locally, so a select
 * rendered on an AWB label still comes out light.
 */
export const customStyles = {
  menu: (provided) => ({
    ...provided,
    backgroundColor: 'var(--color-surface)', // fixes transparent dropdown
    border: '1px solid var(--color-line)',
    zIndex: 9999,
  }),
  menuPortal: (base) => ({
    ...base,
    zIndex: 99999,
  }),
  // The menu is portalled to <body>, outside .main-content, so options need
  // their colours stated here rather than inherited.
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? 'var(--color-brand-500)'
      : state.isFocused
        ? 'color-mix(in srgb, var(--color-ink) 10%, transparent)'
        : 'transparent',
    color: state.isSelected ? '#fff' : 'var(--color-ink)',
  }),
  control: (provided) => ({
    ...provided,
    backgroundColor: 'var(--color-surface)', // fixes transparent control box
    borderColor: 'var(--color-line)',
    minHeight: '38px',        // Bootstrap default input height
    boxShadow: 'none',
  }),
  input: (provided) => ({
    ...provided,
    color: 'var(--color-ink)',
  }),
  placeholder: (provided) => ({
    ...provided,
    color: 'var(--color-ink-muted)',
  }),
  singleValue: (provided) => ({
    ...provided,
    color: 'var(--color-ink)',
  }),
  multiValue: (provided) => ({
    ...provided,
    backgroundColor: 'color-mix(in srgb, var(--color-ink) 12%, transparent)',
  }),
  multiValueLabel: (provided) => ({
    ...provided,
    color: 'var(--color-ink)',
  }),
};

/**
 * Checkbox-style multi-select: pass as `components={{ Option: CheckboxOption,
 * ValueContainer: SelectedCountValue }}` on an `isMulti` react-select.
 *
 * Together with `hideSelectedOptions={false}` and `closeMenuOnSelect={false}`
 * on the call site, this replaces the older pattern of hiding a selected
 * option from the list and showing it as a removable chip in a strip of its
 * own beside the control (SelectedItemsDisplay). That strip had no width limit
 * of its own, so on a screen with several long labels selected it ran wider
 * than the column that held it and pushed content past the edge of the card.
 * A checkbox in the menu carries the same information -- what is selected --
 * without adding anything that can grow past the control's own width.
 */
export const CheckboxOption = (props) => {
  const { isSelected, label } = props;
  return (
    <components.Option {...props}>
      <span className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-sm border transition-colors",
            isSelected ? "border-white bg-white" : "border-current/40"
          )}
        >
          {isSelected && (
            <Check
              className="size-3"
              strokeWidth={3}
              style={{ color: "var(--color-brand-500)" }}
            />
          )}
        </span>
        <span className="truncate">{label}</span>
      </span>
    </components.Option>
  );
};

/**
 * Shows a count ("3 Selected") in the control instead of one chip per value.
 * Pairs with CheckboxOption -- the chips were the only place selection state
 * was visible once picking an option removed it from view via
 * `hideSelectedOptions`; the checkbox in the menu now does that job instead,
 * so the control itself only needs to say how many.
 *
 * `getValue`/`children` are supplied by react-select's ValueContainer contract
 * (see its own "replacing components" docs): `children` is always
 * `[renderedValueOrPlaceholder, <Input/>]`, so swapping the first element for
 * a count and passing the second through keeps typing-to-filter working.
 */
export const SelectedCountValue = ({ children, ...props }) => {
  const [valueOrPlaceholder, input] = children;
  const count = props.getValue().length;

  return (
    <components.ValueContainer {...props}>
      {count > 0 ? (
        <span className="text-[13px] text-ink">{count} Selected</span>
      ) : (
        valueOrPlaceholder
      )}
      {input}
    </components.ValueContainer>
  );
};

CheckboxOption.propTypes = {
  isSelected: PropTypes.bool,
  label: PropTypes.node,
};

SelectedCountValue.propTypes = {
  children: PropTypes.node,
  getValue: PropTypes.func,
};
