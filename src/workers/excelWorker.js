import * as XLSX from 'xlsx';

self.onmessage = async (e) => {
  const { data, fileName, sheetName: rawSheetName, mainHeading } = e.data;
  const sheetName = rawSheetName && String(rawSheetName).trim() ? String(rawSheetName).trim().slice(0, 31) : 'Sheet1';

  try {
    const workbook = XLSX.utils.book_new();

    // Flatten nested objects/arrays into a single row structure
    const flattenObject = (obj, prefix = '') => {
      let result = {};
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          // Recursively flatten nested objects
          const nested = flattenObject(obj[key], `${prefix}${key}_`);
          result = { ...result, ...nested };
        } else if (Array.isArray(obj[key])) {
          // Handle arrays (join with comma if needed)
          result[`${prefix}${key}`] = obj[key].join(', ');
        } else {
          // Simple key-value pair
          const value = obj[key];
          result[`${prefix}${key}`] = (value === "" || value === null || value === undefined) ? "--" : value;
        }
      }
      return result;
    };

    // Process data (single object or array)
    let excelData;
    if (Array.isArray(data)) {
      excelData = data.map(item => flattenObject(item));
    } else {
      excelData = [flattenObject(data)];
    }

    // Create worksheet from the data
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const numCols = range.e.c - range.s.c + 1;

    // Only modify if there's a main heading
    if (mainHeading) {
      // Get all the existing data from the worksheet
      const worksheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      console.log(mainHeading, "mainHeading")
      // Split mainHeading by commas and trim each part
      const headingLines = mainHeading.split(',').map(line => line.trim());

      // Create new data array with heading lines, column headers, and data
      const newData = [
        ...headingLines.map(line => [line]), // Each heading line in its own row
        Object.keys(excelData[0]),          // Column headers row
        ...worksheetData.slice(1)           // All existing data
      ];

      // Create a new worksheet with the new data structure
      const newWorksheet = XLSX.utils.aoa_to_sheet(newData);

      // Merge cells for each heading line (span across all columns)
      newWorksheet['!merges'] = headingLines.map((_, index) => ({
        s: { r: index, c: 0 },
        e: { r: index, c: numCols - 1 }
      }));

      // Style each heading line (bold, center-aligned)
      headingLines.forEach((_, index) => {
        const cellAddress = XLSX.utils.encode_cell({ r: index, c: 0 });
        newWorksheet[cellAddress] = newWorksheet[cellAddress] || {};
        newWorksheet[cellAddress].s = {
          font: { bold: true },
          alignment: { horizontal: 'center' }
        };
      });

      // Style the column headers (bold)
      Object.keys(excelData[0]).forEach((_, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({
          r: headingLines.length,  // Column headers are after all heading lines
          c: colIndex
        });
        newWorksheet[cellAddress] = newWorksheet[cellAddress] || {};
        newWorksheet[cellAddress].s = {
          font: { bold: true }
        };
      });

      // Replace the original worksheet with the new one
      workbook.SheetNames.push(sheetName);
      workbook.Sheets[sheetName] = newWorksheet;
    } else {
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    }

    // Auto-adjust column widths
    const columnWidths = Object.keys(excelData[0]).map(key => ({
      wch: Math.max(10, key.length, ...excelData.map(row => String(row[key]).length)) + 2
    }));
    if (mainHeading) {
      workbook.Sheets[sheetName]['!cols'] = columnWidths;
    } else {
      worksheet['!cols'] = columnWidths;
    }

    // Generate the Excel file
    const excelBuffer = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array',
      compression: true
    });

    self.postMessage({
      type: 'result',
      buffer: excelBuffer,
      fileName
    });

  } catch (error) {
    console.log(error, "errrr2")
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};