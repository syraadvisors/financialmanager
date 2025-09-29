// Navigation and page types for the application

export enum PageType {
  IMPORT = 'import',
  OVERVIEW = 'overview',
  BALANCE_DATA = 'balance-data',
  POSITIONS_DATA = 'positions-data',
  ANALYTICS = 'analytics',
  HISTORY = 'history',
  SETTINGS = 'settings'
}

export interface NavigationItem {
  id: PageType;
  title: string;
  description: string;
  icon: string;
  requiresData?: 'balance' | 'positions' | 'both' | 'none';
  badge?: string | number;
}

export interface AppState {
  currentPage: PageType;
  balanceData: any[];
  positionsData: any[];
  fileHistory: FileHistoryEntry[];
  isLoading: boolean;
  lastImport: {
    type: string | null;
    summary: any;
    timestamp: string;
  };
}

export interface FileHistoryEntry {
  id: string;
  fileName: string;
  fileType: string;
  importDate: string;
  recordCount: number;
  summary: any;
}