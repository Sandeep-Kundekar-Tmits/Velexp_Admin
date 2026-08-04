import ReportPage from "@/features/reports/engine/ReportPage";
import { pickupPerformance } from "@/features/reports/configs/pickupPerformance";

/**
 * Pickup Performance.
 *
 * Was 550 lines — the canonical instance of the report template, with 11
 * useState calls, four useEffect dropdown hydrations, a payload builder
 * duplicated for the Excel export, and a hand-typed 25-column export mapping.
 * All of it is now features/reports/configs/pickupPerformance.js, verified
 * against the pre-migration baseline by tests/pickupPerformanceConfig.test.js.
 */
const PickupPeformance = () => <ReportPage config={pickupPerformance} />;

export default PickupPeformance;
