import ReportPage from "@/features/reports/engine/ReportPage";
import { codReport } from "@/features/reports/configs/codReport";

/**
 * COD Report.
 *
 * Was 305 lines of filter state, dropdown hydration, a duplicated payload
 * builder and a hand-typed Excel mapping. All of it now lives in
 * features/reports/configs/codReport.js, verified against the pre-migration
 * baseline by tests/codReportConfig.test.js.
 */
const CODReport = () => <ReportPage config={codReport} />;

export default CODReport;
