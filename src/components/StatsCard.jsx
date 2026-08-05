import PropTypes from "prop-types";
import { Card, CardBody } from "@/components/ui";

/*
 * Was hardcoded to near-black text (#2b2b2b / #8c8c8c) on whatever `Card`
 * resolves to -- the dark surface token everywhere this theme has landed --
 * which made every one of the 12 screens that render this unreadable. Token
 * colours fix that and keep it correct if the surface changes again.
 *
 * width/height were also fixed pixels, so a row of these wrapped in
 * `flex-wrap` still could not shrink below 220px each -- on a narrow window,
 * or a screen with many status keys, the row ran past its container instead
 * of wrapping cleanly. min-width plus intrinsic height lets each tile shrink
 * with the row instead of forcing it wider than the space available.
 */
const StatsCard = ({ value, label }) => {
  return (
    <Card className="min-w-[140px] flex-1 rounded-xl border-line shadow-none sm:flex-none">
      <CardBody className="flex flex-col items-center justify-center py-3">
        <div className="text-[16px] font-semibold leading-none text-ink">
          {value}
        </div>
        <div className="mt-1.5 text-[13px] font-medium capitalize text-ink-muted">
          {label}
        </div>
      </CardBody>
    </Card>
  );
};

StatsCard.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  label: PropTypes.string,
};

export default StatsCard;
