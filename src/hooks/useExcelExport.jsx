import { useState } from "react";
import { downloadExcel } from "../helpers/downloadExcel";

export const useExcelExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const exportToExcel = async (rawData, filenameBase = "ExportData", transformFn, rowdata2 = null) => {
    try {
      setIsExporting(true);
      setExportProgress(0);

      // Transform data if provided, otherwise return as-is
      const exportData = transformFn ? rawData.map(transformFn) : rawData;

      const CHUNK_SIZE = 50000;
      const totalChunks = Math.ceil(exportData.length / CHUNK_SIZE);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

      for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = start + CHUNK_SIZE;
        const chunk = exportData.slice(start, end);

        const filename = `${filenameBase}_part${i + 1}-of-${totalChunks}_${timestamp}.xlsx`;

        const progress = Math.round(((i + 1) / totalChunks) * 100);
        setExportProgress(progress);
        console.log(`Exporting ${filename} (${progress}%)`);
        // Handle if rowdata2 is missing or not an object
        const newData = rowdata2 && typeof rowdata2 === "object" && Object.keys(rowdata2).length > 0
          ? { ...rowdata2, "": "" }
          : null;

        // Build the payload string only if data exists
        const payloadString = newData
          ? Object.entries(newData)
            .map(([key, value]) => `${key.toUpperCase().trim()} - ${value || "--"}`)
            .join(', ')
          : "";

        // Pass it to downloadExcel safely
        await downloadExcel(chunk, filename, "", payloadString, () => { });


        if (i < totalChunks - 1) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setExportProgress(100);
      // alert(`Successfully exported ${exportData.length} records in ${totalChunks} files.`);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed: " + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  return { exportToExcel, isExporting, exportProgress };
};
