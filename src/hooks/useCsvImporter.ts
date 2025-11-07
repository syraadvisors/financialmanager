import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { FileType } from '../types/DataTypes';
import { detectFileTypeByColumnCount, smartDetectFileType, validateFileData, extractRequiredColumnsFromArray } from '../utils/validation';
import { EnhancedFileValidator, EnhancedValidationResult } from '../utils/enhancedValidation';
import { DataRecoveryEngine, RecoveryResult } from '../utils/dataRecovery';
import { APP_CONFIG } from '../config/constants';
import { useCsvWorker } from './useWebWorker';

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  validRowCount: number;
  summary: {
    totalRows: number;
    uniqueAccounts: number;
    dateRange?: string;
  };
}

interface EnhancedImporterState {
  enhancedValidation?: EnhancedValidationResult;
  recoveryResult?: RecoveryResult<any>;
  showRecoveryOptions: boolean;
}

interface CsvImporterState extends EnhancedImporterState {
  preview: any[];
  fileName: string;
  error: string;
  fileType: FileType | null;
  validationResult: ValidationResult | null;
  processedData: any[];
  isProcessing: boolean;
  useWebWorker: boolean;
  workerProgress: number;
}

interface UseCsvImporterReturn extends CsvImporterState {
  processFile: (file: File) => void;
  clearState: () => void;
  proceedWithWarnings: () => any[] | null;
  attemptRecovery: () => Promise<void>;
  acceptRecoveredData: () => void;
  toggleWebWorker: () => void;
  workerState: any;
}

const initialState: CsvImporterState = {
  preview: [],
  fileName: '',
  error: '',
  fileType: null,
  validationResult: null,
  processedData: [],
  isProcessing: false,
  enhancedValidation: undefined,
  recoveryResult: undefined,
  showRecoveryOptions: false,
  useWebWorker: true,
  workerProgress: 0,
};

export const useCsvImporter = (onDataImported: (data: any[], fileType: FileType, summary: any) => void): UseCsvImporterReturn => {
  const [state, setState] = useState<CsvImporterState>(initialState);

  // Web Worker setup
  const csvWorker = useCsvWorker(
    // onParsingComplete
    (result) => {
      const { data, fileType: detectedType, rowCount } = result;
      processWorkerParsingResult(data, detectedType, rowCount);
    },
    // onValidationComplete
    (result) => {
      console.log('Worker validation complete:', result);
      setState(prev => ({ ...prev, workerProgress: 100 }));
    },
    // onExtractionComplete
    (result) => {
      const { extractedData, preview } = result;
      finalizeWorkerProcessing(extractedData, preview);
    },
    // onError
    (error) => {
      setState(prev => ({
        ...prev,
        error: `Worker error: ${error}`,
        isProcessing: false,
        workerProgress: 0,
      }));
    }
  );

  const processWorkerParsingResult = useCallback(async (data: any[], detectedType: FileType, rowCount: number) => {
    if (!data || data.length === 0) {
      setState(prev => ({
        ...prev,
        error: 'No data found in file',
        isProcessing: false,
        workerProgress: 0,
      }));
      return;
    }

    setState(prev => ({
      ...prev,
      fileType: detectedType,
      workerProgress: 50, // Parsing done, validation starting
    }));

    // Start extraction
    csvWorker.extractColumns(data, detectedType === FileType.ACCOUNT_BALANCE ? 'ACCOUNT_BALANCE' : 'POSITIONS');
  }, [csvWorker]);

  const finalizeWorkerProcessing = useCallback(async (extractedData: any[], previewData: any[]) => {
    const enhancedValidator = new EnhancedFileValidator();
    const enhancedValidation = enhancedValidator.validateCsvData(extractedData, state.fileType!);
    const legacyValidation = validateFileData(extractedData, state.fileType!);

    setState(prev => ({
      ...prev,
      validationResult: legacyValidation,
      enhancedValidation,
      processedData: extractedData,
      preview: previewData,
      showRecoveryOptions: !enhancedValidation.valid && enhancedValidation.recoverable,
      isProcessing: false,
      workerProgress: 100,
    }));

    // Pass data to parent if validation is successful
    if (enhancedValidation.valid) {
      onDataImported(extractedData, state.fileType!, enhancedValidation.summary);
    }
  }, [state.fileType, onDataImported]);

  const processFileWithWebWorker = useCallback(async (file: File) => {
    setState(prev => ({
      ...prev,
      fileName: file.name,
      error: '',
      validationResult: null,
      enhancedValidation: undefined,
      recoveryResult: undefined,
      showRecoveryOptions: false,
      fileType: null,
      isProcessing: true,
      workerProgress: 0,
    }));

    // Check if worker is ready
    if (!csvWorker.state.isReady) {
      setState(prev => ({
        ...prev,
        error: 'CSV Worker is not ready. Please try again.',
        isProcessing: false,
      }));
      return;
    }

    try {
      const fileContent = await file.text();
      csvWorker.parseCSV(fileContent, file.name);
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isProcessing: false,
        workerProgress: 0,
      }));
    }
  }, [csvWorker]);

  const processFileWithPapa = useCallback(async (file: File) => {
    Papa.parse(file, {
      complete: (results: Papa.ParseResult<any>) => {
        try {
          if (!results.data || results.data.length === 0) {
            setState(prev => ({
              ...prev,
              error: 'No data found in file',
              isProcessing: false,
            }));
            return;
          }

          let processedData = results.data;
          const columnCount = results.data[0].length;

          // Smart file type detection using both column count and content analysis
          const detectedType = smartDetectFileType(results.data);
          console.log(`Smart detection: ${detectedType} (${columnCount} columns)`);

          // Also log the basic detection for comparison
          const basicDetection = detectFileTypeByColumnCount(columnCount);
          console.log(`Basic detection: ${basicDetection}`);

          if (detectedType === FileType.UNKNOWN) {
            setState(prev => ({
              ...prev,
              error: `Unable to determine file type. File has ${columnCount} columns. \n\n` +
                     `Expected:\n` +
                     `• Balance files: 7-${APP_CONFIG.FILE.BALANCE_FILE_COLUMNS} columns\n` +
                     `• Positions files: 5-${APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS} columns\n\n` +
                     `Tips:\n` +
                     `• Files with missing columns will still work if they contain the essential data\n` +
                     `• Make sure your file has account numbers in the second column\n` +
                     `• Balance files should have portfolio values, positions files should have symbols`,
              isProcessing: false,
            }));
            return;
          }

          // Check if first row is a header (contains text in columns that should be numeric)
          if (processedData.length > 0) {
            const firstRow = processedData[0];
            let isHeaderRow = false;

            if (detectedType === FileType.ACCOUNT_BALANCE) {
              // Check if portfolio value column (index 4) or total cash column (index 6) contains non-numeric text
              const portfolioValueCell = (firstRow[4] || '').toString().trim();
              const totalCashCell = (firstRow[6] || '').toString().trim();

              // If these cells contain text that doesn't parse to a number, it's likely a header row
              isHeaderRow = (
                (portfolioValueCell && isNaN(parseFloat(portfolioValueCell.replace(/[,$]/g, '')))) ||
                (totalCashCell && isNaN(parseFloat(totalCashCell.replace(/[,$]/g, ''))))
              );
            } else if (detectedType === FileType.POSITIONS) {
              // Check if numeric columns contain non-numeric text (header keywords)
              const sharesCell = (firstRow[7] || '').toString().trim().toUpperCase();
              const marketValueCell = (firstRow[11] || '').toString().trim().toUpperCase();

              // Check for header keywords or non-numeric values
              const headerKeywords = ['SHARES', 'MARKET', 'VALUE', 'DEBT', 'EQUITY', 'CASH', 'SYMBOL', 'SECURITY', 'PRICE', 'QUANTITY'];
              const hasHeaderKeywords = headerKeywords.some(keyword =>
                sharesCell.includes(keyword) || marketValueCell.includes(keyword)
              );

              const sharesIsNonNumeric = sharesCell && isNaN(parseFloat(sharesCell.replace(/[,]/g, '')));
              const marketValueIsNonNumeric = marketValueCell && isNaN(parseFloat(marketValueCell.replace(/[,$]/g, '')));

              isHeaderRow = hasHeaderKeywords || sharesIsNonNumeric || marketValueIsNonNumeric;
            }

            if (isHeaderRow) {
              console.log(`Detected header row in ${detectedType} file - skipping first row`);
              console.log('First row content:', firstRow.slice(0, 12));
              processedData = processedData.slice(1); // Skip the header row
            }
          }

          const enhancedValidator = new EnhancedFileValidator();
          const enhancedValidation = enhancedValidator.validateCsvData(processedData, detectedType);
          const legacyValidation = validateFileData(processedData, detectedType);
          const extracted = extractRequiredColumnsFromArray(processedData, detectedType);

          setState(prev => ({
            ...prev,
            fileType: detectedType,
            validationResult: legacyValidation,
            enhancedValidation,
            processedData: extracted,
            preview: extracted.slice(0, APP_CONFIG.FILE.PREVIEW_ROWS),
            showRecoveryOptions: !enhancedValidation.valid && enhancedValidation.recoverable,
            isProcessing: false,
          }));

          if (enhancedValidation.valid) {
            onDataImported(extracted, detectedType, enhancedValidation.summary);
          }
        } catch (parseError) {
          setState(prev => ({
            ...prev,
            error: `Error processing file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            isProcessing: false,
          }));
        }
      },
      header: false,
      skipEmptyLines: true,
      error: (error: Error) => {
        setState(prev => ({
          ...prev,
          error: `Error parsing CSV: ${error.message}`,
          isProcessing: false,
        }));
      }
    });
  }, [onDataImported]);

  const clearState = useCallback(() => {
    setState(initialState);
  }, []);

  const processFile = useCallback(async (file: File) => {
    const enhancedValidator = new EnhancedFileValidator();

    // Enhanced file validation
    const fileValidation = await enhancedValidator.validateFile(file);
    if (!fileValidation.valid) {
      setState(prev => ({
        ...prev,
        error: fileValidation.errors.map(e => e.message).join('; '),
        isProcessing: false,
      }));
      return;
    }

    // Validate file size
    const maxSizeBytes = APP_CONFIG.FILE.MAX_FILE_SIZE_MB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setState(prev => ({
        ...prev,
        error: `File size exceeds ${APP_CONFIG.FILE.MAX_FILE_SIZE_MB}MB limit`,
        isProcessing: false,
      }));
      return;
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const supportedTypes: string[] = [...APP_CONFIG.FILE.SUPPORTED_FILE_TYPES];
    if (!supportedTypes.includes(fileExtension)) {
      setState(prev => ({
        ...prev,
        error: `Unsupported file type. Supported types: ${APP_CONFIG.FILE.SUPPORTED_FILE_TYPES.join(', ')}`,
        isProcessing: false,
      }));
      return;
    }

    // Use Web Worker for large files or when enabled
    const shouldUseWorker = state.useWebWorker && file.size > 50000; // Use worker for files > 50KB

    if (shouldUseWorker) {
      await processFileWithWebWorker(file);
    } else {
      await processFileWithPapa(file);
    }
  }, [state.useWebWorker, processFileWithWebWorker, processFileWithPapa]);

  const toggleWebWorker = useCallback(() => {
    setState(prev => ({
      ...prev,
      useWebWorker: !prev.useWebWorker,
    }));
  }, []);

  const proceedWithWarnings = useCallback(() => {
    if (state.processedData.length > 0 && state.fileType && state.validationResult) {
      onDataImported(state.processedData, state.fileType, state.validationResult.summary);
      return state.processedData;
    }
    return null;
  }, [state.processedData, state.fileType, state.validationResult, onDataImported]);

  const attemptRecovery = useCallback(async () => {
    if (!state.enhancedValidation || !state.fileType || !state.processedData) {
      return;
    }

    setState(prev => ({ ...prev, isProcessing: true }));

    try {
      const recoveryEngine = new DataRecoveryEngine();
      const recoveryResult = await recoveryEngine.attemptRecovery(
        state.processedData,
        state.fileType,
        state.enhancedValidation,
        {
          allowPartialData: true,
          minValidRowsPercent: 60,
          maxErrorsPercent: 40,
          autoFix: true,
          preserveStructure: true
        }
      );

      setState(prev => ({
        ...prev,
        recoveryResult,
        isProcessing: false,
        showRecoveryOptions: recoveryResult.success,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: `Recovery failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isProcessing: false,
      }));
    }
  }, [state.enhancedValidation, state.fileType, state.processedData]);

  const acceptRecoveredData = useCallback(() => {
    if (state.recoveryResult?.success && state.fileType && state.recoveryResult.recoveredData.length > 0) {
      const summary = {
        totalRows: state.recoveryResult.recoveredData.length,
        uniqueAccounts: new Set(state.recoveryResult.recoveredData.map((row: any) => row.accountNumber)).size,
        qualityScore: state.recoveryResult.qualityScore,
        recoveryActions: state.recoveryResult.recoveryActions.length,
        discardedRows: state.recoveryResult.discardedRows
      };

      onDataImported(state.recoveryResult.recoveredData, state.fileType, summary);

      setState(prev => ({
        ...prev,
        processedData: state.recoveryResult!.recoveredData,
        showRecoveryOptions: false,
      }));
    }
  }, [state.recoveryResult, state.fileType, onDataImported]);

  return {
    ...state,
    processFile,
    clearState,
    proceedWithWarnings,
    attemptRecovery,
    acceptRecoveredData,
    toggleWebWorker,
    workerState: csvWorker.state,
  };
};