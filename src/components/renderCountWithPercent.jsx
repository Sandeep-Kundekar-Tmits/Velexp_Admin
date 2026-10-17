// Used across ~8 report tables -- color was hardcoded (#111/#333333), fine
// against a white cell but nearly invisible on the dark theme's own dark
// surface. text-ink/text-ink-muted adapt to whichever theme is active.
const renderCountWithPercent = (getValue) => {
  const { count = 0, percent = 0 } = getValue() || {};

  return (
    <div className="flex items-center gap-1">
      <div
        className="text-ink"
        style={{
          fontSize: '15px',
          fontWeight: 700,
        }}
      >
        {count}
      </div>
      <div
        className="text-ink-muted"
        style={{
          fontSize: '12px',
        }}
      >
        ({percent}%)
      </div>
    </div>
  );
};

export default renderCountWithPercent;
