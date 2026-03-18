import * as XLSX from 'xlsx';

self.onmessage = async (e) => {
  const { data, fileName } = e.data;

  try {
    const workbook = XLSX.utils.book_new();

    const flattenObject = (obj, prefix = '') => {
      let result = {};
      for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          const nested = flattenObject(obj[key], `${prefix}${key}_`);
          result = { ...result, ...nested };
        } else if (Array.isArray(obj[key])) {
          result[`${prefix}${key}`] = obj[key].join(', ');
        } else {
          const value = obj[key];
          result[`${prefix}${key}`] = (value === "" || value === null || value === undefined) ? "--" : value;
        }
      }
      return result;
    };

    const processSheet = (sheetData, currentSheetName, currentMainHeading) => {
      let excelData;
      if (Array.isArray(sheetData)) {
        excelData = sheetData.map(item => flattenObject(item));
      } else {
        excelData = [flattenObject(sheetData)];
      }

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const range = XLSX.utils.decode_range(worksheet['!ref']);
      const numCols = range.e.c - range.s.c + 1;

      if (currentMainHeading) {
        const worksheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headingLines = currentMainHeading.split(',').map(line => line.trim());
        const newData = [
          ...headingLines.map(line => [line]),
          [], // Blank line after filters
          Object.keys(excelData[0]),
          ...worksheetData.slice(1)
        ];

        const newWorksheet = XLSX.utils.aoa_to_sheet(newData);
        newWorksheet['!merges'] = headingLines.map((_, index) => ({
          s: { r: index, c: 0 },
          e: { r: index, c: numCols - 1 }
        }));

        headingLines.forEach((_, index) => {
          const cellAddress = XLSX.utils.encode_cell({ r: index, c: 0 });
          newWorksheet[cellAddress] = newWorksheet[cellAddress] || {};
          newWorksheet[cellAddress].s = {
            font: { bold: true },
            alignment: { horizontal: 'center' }
          };
        });

        Object.keys(excelData[0]).forEach((_, colIndex) => {
          const cellAddress = XLSX.utils.encode_cell({
            r: headingLines.length + 1, // +1 for the blank line
            c: colIndex
          });
          newWorksheet[cellAddress] = newWorksheet[cellAddress] || {};
          newWorksheet[cellAddress].s = { font: { bold: true } };
        });

        XLSX.utils.book_append_sheet(workbook, newWorksheet, currentSheetName);
      } else {
        XLSX.utils.book_append_sheet(workbook, worksheet, currentSheetName);
      }

      const currentWs = workbook.Sheets[currentSheetName];
      const columnWidths = Object.keys(excelData[0]).map(key => ({
        wch: Math.max(10, key.length, ...excelData.map(row => String(row[key]).length)) + 2
      }));
      currentWs['!cols'] = columnWidths;
    };

    if (Array.isArray(data)) {
      data.forEach(sheetItem => {
        processSheet(sheetItem.data, sheetItem.sheetName || "Sheet", sheetItem.mainHeading || "");
      });
    }

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
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
};
