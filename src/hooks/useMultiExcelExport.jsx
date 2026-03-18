import { useState } from "react";
import { multiDownloadExcel } from "../helpers/multiDownloadExcel";

/**
 * useMultiExcelExport
 * 
 * Provides a function to export data to an Excel file with multiple sheets.
 * 
 * Usage:
 * const { exportMultiToExcel, isExporting, exportProgress } = useMultiExcelExport();
 * 
 * const sheets = [
 *   {
 *     sheetName: "Sheet 1",
 *     data: Array,
 *     mainHeading: "Heading 1, Subheading 1" (optional)
 *   },
 *   {
 *     sheetName: "Sheet 2",
 *     data: Array,
 *     mainHeading: "Heading 2" (optional)
 *   }
 * ];
 * 
 * exportMultiToExcel(sheets, "MyReport");
 */
export const useMultiExcelExport = () => {
    const [isExporting, setIsExporting] = useState(false);
    const [exportProgress, setExportProgress] = useState(0);

    const exportMultiToExcel = async (sheets, filenameBase = "ExportData") => {
        try {
            setIsExporting(true);
            setExportProgress(0);

            const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = `${filenameBase}_${timestamp}.xlsx`;

            await multiDownloadExcel(sheets, fileName);

            setExportProgress(100);
        } catch (error) {
            console.error("Multi-sheet export failed:", error);
            alert("Export failed: " + error.message);
        } finally {
            setIsExporting(false);
        }
    };

    return { exportMultiToExcel, isExporting, exportProgress };
};
