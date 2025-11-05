/* eslint-disable no-restricted-globals */
// CSV Processing Web Worker
// This worker handles heavy CSV parsing and validation operations

// Import Papa Parse from CDN for the worker
importScripts('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js');

// Configuration constants (mirrored from main app)
const FILE_CONFIG = {
  BALANCE_FILE_COLUMNS: 21,
  POSITIONS_FILE_COLUMNS: 12,
  PREVIEW_ROWS: 5,
  MAX_ERRORS_DISPLAYED: 10,
  MAX_WARNINGS_DISPLAYED: 10,
  // Minimum columns required for each file type
  MIN_BALANCE_COLUMNS: 7,
  MIN_POSITIONS_COLUMNS: 5,
};

const COLUMN_MAPPINGS = {
  BALANCE_FILE: {
    0: 'asOfBusinessDate',
    1: 'accountNumber',
    2: 'accountName',
    4: 'portfolioValue',
    6: 'totalCash',
  },
  POSITIONS_FILE: {
    0: 'asOfBusinessDate',
    1: 'accountNumber',
    2: 'accountName',
    3: 'symbol',
    4: 'securityType',
    5: 'securityDescription',
    6: 'accountingRuleCode',
    7: 'numberOfShares',
    8: 'longShort',
    9: 'price',
    10: 'dateOfPrice',
    11: 'marketValue',
  },
};

// Utility functions - more flexible file type detection
function detectFileTypeByColumnCount(columnCount) {
  // Positions files typically have exactly 12 columns
  // Balance files typically have 21 columns
  // Check for positions first since it's more specific

  if (columnCount === FILE_CONFIG.POSITIONS_FILE_COLUMNS) {
    // Exactly 12 columns = positions file
    return 'POSITIONS';
  }
  else if (columnCount >= FILE_CONFIG.MIN_BALANCE_COLUMNS && columnCount <= FILE_CONFIG.BALANCE_FILE_COLUMNS && columnCount > FILE_CONFIG.POSITIONS_FILE_COLUMNS) {
    // 13-21 columns = balance file
    return 'ACCOUNT_BALANCE';
  }
  else if (columnCount >= FILE_CONFIG.MIN_POSITIONS_COLUMNS && columnCount < FILE_CONFIG.POSITIONS_FILE_COLUMNS) {
    // 5-11 columns = positions file (partial/missing columns)
    return 'POSITIONS';
  }

  // If still ambiguous, use the old fallback logic
  // Positions files usually have fewer columns than balance files
  if (columnCount <= 12) {
    return 'POSITIONS';
  } else if (columnCount > 12) {
    return 'ACCOUNT_BALANCE';
  }

  return 'UNKNOWN';
}

function extractRequiredColumns(data, fileType) {
  const columnMapping = fileType === 'ACCOUNT_BALANCE'
    ? COLUMN_MAPPINGS.BALANCE_FILE
    : COLUMN_MAPPINGS.POSITIONS_FILE;

  return data.map(row => {
    // Work with the actual row length - don't force padding
    const safeRow = [...row];

    const extracted = {};
    Object.entries(columnMapping).forEach(([position, fieldName]) => {
      const pos = parseInt(position);
      // Safely access column, even if it doesn't exist
      const value = (safeRow[pos] || '').toString().trim();

      // Convert numeric fields with better error handling
      if (fileType === 'ACCOUNT_BALANCE' && (fieldName === 'portfolioValue' || fieldName === 'totalCash')) {
        const numericValue = value === '' ? 0 : parseFloat(value.replace(/[,$]/g, ''));
        extracted[fieldName] = isNaN(numericValue) ? 0 : numericValue;
      } else if (fileType === 'POSITIONS' && ['numberOfShares', 'price', 'marketValue'].includes(fieldName)) {
        const numericValue = value === '' ? 0 : parseFloat(value.replace(/[,$]/g, ''));
        extracted[fieldName] = isNaN(numericValue) ? 0 : numericValue;
      } else {
        extracted[fieldName] = value;
      }
    });

    return extracted;
  });
}

function validateData(data, fileType) {
  const errors = [];
  const warnings = [];
  let validRowCount = 0;
  const uniqueAccounts = new Set();
  const dates = new Set();

  if (!data || data.length === 0) {
    errors.push('No data found in file');
    return {
      valid: false,
      errors,
      warnings,
      validRowCount: 0,
      summary: { totalRows: 0, uniqueAccounts: 0 }
    };
  }

  // Process each row in chunks to avoid blocking
  const processChunk = (startIndex, chunkSize) => {
    const endIndex = Math.min(startIndex + chunkSize, data.length);

    for (let i = startIndex; i < endIndex; i++) {
      const row = data[i];
      const rowNum = i + 1;

      // Work with actual row length - no need to pad to exact column count
      const actualColumns = row.length;

      // Validate account number
      const accountNumber = (row[1] || '').toString().trim();
      if (!accountNumber) {
        warnings.push(`Row ${rowNum}: Empty account number`);
        continue;
      }

      // Basic account number validation - more lenient to accept various formats
      const cleaned = accountNumber.replace(/\s/g, '');
      // Accept account numbers that are 6-15 digits (covers various custodian formats)
      // Allow numbers starting with 0 (some custodians use leading zeros)
      if (!/^\d{6,15}$/.test(cleaned)) {
        if (errors.length < FILE_CONFIG.MAX_ERRORS_DISPLAYED) {
          errors.push(`Row ${rowNum}: Invalid account number format (${accountNumber}) - must be 6-15 digits`);
        }
        continue;
      }

      uniqueAccounts.add(accountNumber);

      // Collect dates
      const dateValue = (row[0] || '').toString().trim();
      if (dateValue) {
        dates.add(dateValue);
      }

      // Type-specific validation
      if (fileType === 'ACCOUNT_BALANCE') {
        const portfolioValue = parseFloat((row[4] || '0').toString().replace(/[,$]/g, '')) || 0;
        const totalCash = parseFloat((row[6] || '0').toString().replace(/[,$]/g, '')) || 0;

        if (portfolioValue === 0 && totalCash === 0) {
          if (warnings.length < FILE_CONFIG.MAX_WARNINGS_DISPLAYED) {
            warnings.push(`Row ${rowNum}: No balance values found`);
          }
          continue;
        }
      } else if (fileType === 'POSITIONS') {
        const shares = parseFloat((row[7] || '0').toString().replace(/[,]/g, '')) || 0;
        const marketValue = parseFloat((row[11] || '0').toString().replace(/[,$]/g, '')) || 0;

        if (shares === 0 && marketValue === 0) {
          if (warnings.length < FILE_CONFIG.MAX_WARNINGS_DISPLAYED) {
            warnings.push(`Row ${rowNum}: Invalid position data`);
          }
          continue;
        }
      }

      validRowCount++;
    }

    return endIndex < data.length;
  };

  // Process data in chunks to prevent blocking
  const chunkSize = 1000;
  let currentIndex = 0;

  const processNextChunk = () => {
    if (processChunk(currentIndex, chunkSize)) {
      currentIndex += chunkSize;
      // Post progress update
      self.postMessage({
        type: 'progress',
        progress: (currentIndex / data.length) * 100,
        processed: currentIndex,
        total: data.length
      });
      // Schedule next chunk
      setTimeout(processNextChunk, 0);
    } else {
      // Validation complete
      const dateArray = Array.from(dates).sort();
      const dateRange = dateArray.length > 0
        ? (dateArray.length === 1 ? dateArray[0] : `${dateArray[0]} to ${dateArray[dateArray.length - 1]}`)
        : undefined;

      const result = {
        valid: errors.length === 0,
        errors: errors.slice(0, FILE_CONFIG.MAX_ERRORS_DISPLAYED),
        warnings: warnings.slice(0, FILE_CONFIG.MAX_WARNINGS_DISPLAYED),
        validRowCount,
        summary: {
          totalRows: data.length,
          uniqueAccounts: uniqueAccounts.size,
          dateRange
        }
      };

      self.postMessage({
        type: 'validation_complete',
        result
      });
    }
  };

  processNextChunk();
}

// Main message handler
self.onmessage = function(e) {
  const { type, data: messageData } = e.data;

  try {
    switch (type) {
      case 'parse_csv':
        const { fileContent, fileName } = messageData;

        self.postMessage({
          type: 'parsing_started',
          fileName
        });

        // Parse CSV with Papa Parse
        Papa.parse(fileContent, {
          complete: function(results) {
            if (!results.data || results.data.length === 0) {
              self.postMessage({
                type: 'error',
                error: 'No data found in file'
              });
              return;
            }

            let processedData = results.data;

            // Get the actual column count, ignoring trailing empty columns
            // This handles CSV files with trailing commas
            // Check all rows to find columns that are COMPLETELY empty (no data in any row)
            const rawColumnCount = results.data[0].length;
            let actualColumnCount = rawColumnCount;

            // For each column from right to left, check if it's empty in ALL rows
            for (let colIndex = rawColumnCount - 1; colIndex >= 0; colIndex--) {
              let hasAnyData = false;

              // Check this column across all rows (or first 100 rows for performance)
              const rowsToCheck = Math.min(100, results.data.length);
              for (let rowIndex = 0; rowIndex < rowsToCheck; rowIndex++) {
                const row = results.data[rowIndex];
                const value = (row[colIndex] || '').toString().trim();

                if (value !== '') {
                  hasAnyData = true;
                  break;
                }
              }

              // If this column has any data, stop here - this is our actual column count
              if (hasAnyData) {
                actualColumnCount = colIndex + 1;
                break;
              }
            }

            // Strip trailing empty columns from all rows to ensure consistency
            processedData = processedData.map(row => {
              // If row has more columns than actualColumnCount, trim it
              if (row.length > actualColumnCount) {
                return row.slice(0, actualColumnCount);
              }
              return row;
            });

            const columnCount = actualColumnCount;
            const fileType = detectFileTypeByColumnCount(columnCount);

            console.log('CSV Worker - Raw column count:', results.data[0].length);
            console.log('CSV Worker - Actual column count (excluding trailing empty):', columnCount);
            console.log('CSV Worker - Detected file type:', fileType);
            console.log('CSV Worker - First row sample:', results.data[0].slice(0, 5));

            if (fileType === 'UNKNOWN') {
              self.postMessage({
                type: 'error',
                error: `Unable to determine file type. File has ${columnCount} columns.`
              });
              return;
            }

            // Check if first row is a header (contains text in columns that should be numeric)
            if (processedData.length > 0) {
              const firstRow = processedData[0];
              let isHeaderRow = false;

              if (fileType === 'ACCOUNT_BALANCE') {
                // Check if portfolio value column (index 4) or total cash column (index 6) contains non-numeric text
                const portfolioValueCell = (firstRow[4] || '').toString().trim();
                const totalCashCell = (firstRow[6] || '').toString().trim();

                // If these cells contain text that doesn't parse to a number, it's likely a header row
                isHeaderRow = (
                  (portfolioValueCell && isNaN(parseFloat(portfolioValueCell.replace(/[,$]/g, '')))) ||
                  (totalCashCell && isNaN(parseFloat(totalCashCell.replace(/[,$]/g, ''))))
                );

                if (isHeaderRow) {
                  console.log('Worker: Detected header row in Balance file - skipping first row');
                }
              } else if (fileType === 'POSITIONS') {
                // Check if number of shares column (index 7) or market value column (index 11) contains non-numeric text
                const sharesCell = (firstRow[7] || '').toString().trim();
                const marketValueCell = (firstRow[11] || '').toString().trim();

                // If these cells contain text that doesn't parse to a number, it's likely a header row
                isHeaderRow = (
                  (sharesCell && isNaN(parseFloat(sharesCell.replace(/[,]/g, '')))) ||
                  (marketValueCell && isNaN(parseFloat(marketValueCell.replace(/[,$]/g, ''))))
                );

                if (isHeaderRow) {
                  console.log('Worker: Detected header row in Positions file - skipping first row');
                }
              }

              if (isHeaderRow) {
                processedData = processedData.slice(1); // Skip the header row
              }
            }

            self.postMessage({
              type: 'parsing_complete',
              result: {
                data: processedData,
                fileType,
                columnCount,
                rowCount: processedData.length
              }
            });

            // Start validation
            validateData(processedData, fileType);
          },
          header: false,
          skipEmptyLines: true,
          error: function(error) {
            self.postMessage({
              type: 'error',
              error: `CSV parsing error: ${error.message}`
            });
          }
        });
        break;

      case 'extract_columns':
        const { rawData, fileType } = messageData;

        self.postMessage({
          type: 'extraction_started'
        });

        // Extract columns in chunks to avoid blocking
        const extractInChunks = (data, type, chunkSize = 1000) => {
          let processed = 0;
          const results = [];

          const processChunk = () => {
            const end = Math.min(processed + chunkSize, data.length);
            const chunk = data.slice(processed, end);
            const extractedChunk = extractRequiredColumns(chunk, type);

            results.push(...extractedChunk);
            processed = end;

            if (processed < data.length) {
              self.postMessage({
                type: 'extraction_progress',
                progress: (processed / data.length) * 100,
                processed,
                total: data.length
              });
              setTimeout(processChunk, 0);
            } else {
              self.postMessage({
                type: 'extraction_complete',
                result: {
                  extractedData: results,
                  preview: results.slice(0, FILE_CONFIG.PREVIEW_ROWS)
                }
              });
            }
          };

          processChunk();
        };

        extractInChunks(rawData, fileType);
        break;

      case 'sort_data':
        const { data: sortData, field, direction } = messageData;

        self.postMessage({
          type: 'sorting_started'
        });

        // Sort in chunks for large datasets
        const sortedData = [...sortData].sort((a, b) => {
          const aValue = a[field];
          const bValue = b[field];

          if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
          }

          const aStr = String(aValue || '').toLowerCase();
          const bStr = String(bValue || '').toLowerCase();

          return direction === 'asc'
            ? aStr.localeCompare(bStr)
            : bStr.localeCompare(aStr);
        });

        self.postMessage({
          type: 'sorting_complete',
          result: sortedData
        });
        break;

      case 'filter_data':
        const { data: filterData, filters } = messageData;

        self.postMessage({
          type: 'filtering_started'
        });

        const filteredData = filterData.filter(item => {
          return Object.entries(filters).every(([key, value]) => {
            if (!value) return true;

            const itemValue = item[key];
            if (typeof itemValue === 'string' && typeof value === 'string') {
              return itemValue.toLowerCase().includes(value.toLowerCase());
            }

            return itemValue === value;
          });
        });

        self.postMessage({
          type: 'filtering_complete',
          result: filteredData
        });
        break;

      default:
        self.postMessage({
          type: 'error',
          error: `Unknown message type: ${type}`
        });
    }
  } catch (error) {
    self.postMessage({
      type: 'error',
      error: `Worker error: ${error.message}`
    });
  }
};

// Handle worker initialization
self.postMessage({
  type: 'worker_ready'
});