import { useState } from 'react';
import * as XLSX from 'xlsx';

const useExcelParser = () => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const parseExcel = async (file, expectedHeaders, options = {}) => {
        const {
            titleCell = 'A1',
            dataStartRow = 2, // 0-indexed
            caseSensitiveHeaders = false
        } = options;

        setIsLoading(true);
        setError(null);
        setData(null); // Clear previous data

        try {
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];

            // Get title
            const title = worksheet[titleCell]?.v || 'Untitled';

            // Extract actual headers from the worksheet
            const headerRow = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[dataStartRow - 1] || [];

            // Normalize headers for comparison
            const normalizeHeader = h => caseSensitiveHeaders
                ? String(h).trim()
                : String(h).trim().toLowerCase();

            // Validate headers if expectedHeaders provided
            if (expectedHeaders && expectedHeaders.length > 0) {
                const normalizedExpected = expectedHeaders.map(normalizeHeader);
                const normalizedActual = headerRow.map(normalizeHeader);

                const missingHeaders = expectedHeaders.filter(
                    (header, index) => !normalizedActual.includes(normalizeHeader(header))
                );

                console.log(headerRow,"headerRow")

                if (missingHeaders.length > 0) {
                    return {
                        message: `Missing headers: ${missingHeaders.join(', ')}\n`
                    }
                }
            }

            // Parse data
            const rawJsonData = XLSX.utils.sheet_to_json(worksheet, {
                header: headerRow,
                range: dataStartRow
            });

            // Clean up numeric values to avoid floating point precision issues (e.g. 6.001 -> 6.0009999999999994)
            const jsonData = rawJsonData.map(row => {
                const cleanRow = {};
                for (const key in row) {
                    const value = row[key];
                    if (typeof value === 'number') {
                        // Round to 10 decimal places to eliminate floating point noise
                        cleanRow[key] = Number(value.toFixed(10));
                    } else {
                        cleanRow[key] = value;
                    }
                }
                return cleanRow;
            });

            const result = {
                title,
                data: jsonData,
                actualHeaders: headerRow
            };

            setData(result);
            return result;

        } catch (err) {
            setError(err.message);
            throw err; // Re-throw to allow handling in calling code
        } finally {
            setIsLoading(false);
        }
    };

    return { data, error, isLoading, parseExcel };
};

export default useExcelParser;


// use

        // let file = e.target.files[0]
        // let requiredFields = [
        //     'Invoice_No',
        //     'AWB Nos'
        // ]
        // // let requiredFields=[]
        // let option = {
        //     titleCell: 'A1',
        //     dataStartRow: 1, // 0-indexed
        //     caseSensitiveHeaders: false
        // }
        // let JsonData = await ConvertExcleToJson(file, requiredFields, option)