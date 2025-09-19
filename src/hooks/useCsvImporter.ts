import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { FileType } from '../types/DataTypes';
import { detectFileTypeByColumnCount, validateFileData, extractRequiredColumnsFromArray } from '../utils/validation';
import { APP_CONFIG } from '../config/constants';

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

interface CsvImporterState {
  preview: any[];
  fileName: string;
  error: string;
  fileType: FileType | null;
  validationResult: ValidationResult | null;
  processedData: any[];
  isProcessing: boolean;
}

interface UseCsvImporterReturn extends CsvImporterState {
  processFile: (file: File) => void;
  clearState: () => void;
  proceedWithWarnings: () => any[] | null;
}

const initialState: CsvImporterState = {
  preview: [],
  fileName: '',
  error: '',
  fileType: null,
  validationResult: null,
  processedData: [],
  isProcessing: false,
};

export const useCsvImporter = (onDataImported: (data: any[], fileType: FileType, summary: any) => void): UseCsvImporterReturn => {
  const [state, setState] = useState<CsvImporterState>(initialState);

  const clearState = useCallback(() => {
    setState(initialState);
  }, []);

  const processFile = useCallback((file: File) => {
    setState(prev => ({
      ...prev,
      fileName: file.name,
      error: '',
      validationResult: null,
      fileType: null,
      isProcessing: true,
    }));

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

          // Get the number of columns from the first row
          const columnCount = results.data[0].length;
          console.log(`File has ${columnCount} columns`);
          console.log('First row sample:', results.data[0].slice(0, 10));

          // Detect file type based on column count
          const detectedType = detectFileTypeByColumnCount(columnCount);

          if (detectedType === FileType.UNKNOWN) {
            setState(prev => ({
              ...prev,
              error: `Unable to determine file type. File has ${columnCount} columns. Expected ${APP_CONFIG.FILE.BALANCE_FILE_COLUMNS} columns for Balance file or ${APP_CONFIG.FILE.POSITIONS_FILE_COLUMNS} columns for Positions file.`,
              isProcessing: false,
            }));
            return;
          }

          // Validate data
          const validation = validateFileData(results.data, detectedType);

          // Extract only required columns by position
          const extracted = extractRequiredColumnsFromArray(results.data, detectedType);

          setState(prev => ({
            ...prev,
            fileType: detectedType,
            validationResult: validation,
            processedData: extracted,
            preview: extracted.slice(0, APP_CONFIG.FILE.PREVIEW_ROWS),
            isProcessing: false,
          }));

          // Pass data to parent if validation is successful
          if (validation.valid) {
            onDataImported(extracted, detectedType, validation.summary);
          }

        } catch (parseError) {
          setState(prev => ({
            ...prev,
            error: `Error processing file: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`,
            isProcessing: false,
          }));
        }
      },
      header: false, // No headers since we're working with position-based data
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

  const proceedWithWarnings = useCallback(() => {
    if (state.processedData.length > 0 && state.fileType && state.validationResult) {
      onDataImported(state.processedData, state.fileType, state.validationResult.summary);
      return state.processedData;
    }
    return null;
  }, [state.processedData, state.fileType, state.validationResult, onDataImported]);

  return {
    ...state,
    processFile,
    clearState,
    proceedWithWarnings,
  };
};