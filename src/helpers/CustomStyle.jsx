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
