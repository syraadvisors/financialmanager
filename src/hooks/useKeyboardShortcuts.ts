import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface KeyboardShortcutsHookOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  targetElement?: HTMLElement | null;
}

export const useKeyboardShortcuts = (
  shortcuts: KeyboardShortcut[],
  options: KeyboardShortcutsHookOptions = {}
) => {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true,
    targetElement
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    // Check if the target is an input element (to avoid interfering with form inputs)
    const target = event.target as HTMLElement;
    const isInputElement = target.tagName === 'INPUT' ||
                          target.tagName === 'TEXTAREA' ||
                          target.contentEditable === 'true';

    // Find matching shortcut
    const matchingShortcut = shortcuts.find(shortcut => {
      const keyMatch = shortcut.key.toLowerCase() === event.key.toLowerCase();
      const ctrlMatch = !shortcut.ctrlKey || event.ctrlKey;
      const shiftMatch = !shortcut.shiftKey || event.shiftKey;
      const altMatch = !shortcut.altKey || event.altKey;
      const metaMatch = !shortcut.metaKey || event.metaKey;

      // Ensure exact modifier match (no extra modifiers)
      const exactCtrlMatch = (shortcut.ctrlKey || false) === event.ctrlKey;
      const exactShiftMatch = (shortcut.shiftKey || false) === event.shiftKey;
      const exactAltMatch = (shortcut.altKey || false) === event.altKey;
      const exactMetaMatch = (shortcut.metaKey || false) === event.metaKey;

      return keyMatch && ctrlMatch && shiftMatch && altMatch && metaMatch &&
             exactCtrlMatch && exactShiftMatch && exactAltMatch && exactMetaMatch;
    });

    if (matchingShortcut) {
      // Special handling for search shortcuts - always allow them
      const isSearchShortcut = matchingShortcut.key.toLowerCase() === 'f' &&
                              matchingShortcut.ctrlKey;
      const isCommandShortcut = matchingShortcut.key.toLowerCase() === 'k' &&
                               matchingShortcut.ctrlKey;

      // Prevent action if in input field (unless it's a search shortcut)
      if (isInputElement && !isSearchShortcut && !isCommandShortcut) {
        return;
      }

      if (matchingShortcut.preventDefault !== false && preventDefault) {
        event.preventDefault();
      }

      if (matchingShortcut.stopPropagation !== false && stopPropagation) {
        event.stopPropagation();
      }

      matchingShortcut.action();
    }
  }, [shortcuts, enabled, preventDefault, stopPropagation]);

  useEffect(() => {
    const element = targetElement || document;

    if (enabled) {
      element.addEventListener('keydown', handleKeyDown as EventListener);
    }

    return () => {
      element.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [handleKeyDown, enabled, targetElement]);

  return {
    shortcuts: shortcuts.map(shortcut => ({
      ...shortcut,
      displayKey: formatShortcutDisplay(shortcut)
    }))
  };
};

// Format shortcut for display (e.g., "Ctrl+F", "Shift+Ctrl+K")
export const formatShortcutDisplay = (shortcut: KeyboardShortcut): string => {
  const parts: string[] = [];

  if (shortcut.ctrlKey) parts.push('Ctrl');
  if (shortcut.altKey) parts.push('Alt');
  if (shortcut.shiftKey) parts.push('Shift');
  if (shortcut.metaKey) parts.push('Cmd');

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
};

// Global keyboard shortcuts hook for the financial manager app
export const useFinancialAppShortcuts = () => {
  const focusGlobalSearch = useCallback(() => {
    const searchInput = document.querySelector('[data-search="global"]') as HTMLInputElement;
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }, []);

  const openCommandPalette = useCallback(() => {
    // Dispatch custom event for command palette
    const event = new CustomEvent('openCommandPalette');
    document.dispatchEvent(event);
  }, []);

  const togglePerformanceDashboard = useCallback(() => {
    const event = new CustomEvent('togglePerformanceDashboard');
    document.dispatchEvent(event);
  }, []);

  const toggleSearchMonitor = useCallback(() => {
    const event = new CustomEvent('toggleSearchMonitor');
    document.dispatchEvent(event);
  }, []);

  const clearAllFilters = useCallback(() => {
    const event = new CustomEvent('clearAllFilters');
    document.dispatchEvent(event);
  }, []);

  const exportCurrentView = useCallback(() => {
    const event = new CustomEvent('exportCurrentView');
    document.dispatchEvent(event);
  }, []);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'f',
      ctrlKey: true,
      action: focusGlobalSearch,
      description: 'Focus global search'
    },
    {
      key: 'k',
      ctrlKey: true,
      action: openCommandPalette,
      description: 'Open command palette'
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      action: togglePerformanceDashboard,
      description: 'Toggle performance dashboard'
    },
    {
      key: 'm',
      ctrlKey: true,
      shiftKey: true,
      action: toggleSearchMonitor,
      description: 'Toggle search performance monitor'
    },
    {
      key: 'r',
      ctrlKey: true,
      shiftKey: true,
      action: clearAllFilters,
      description: 'Clear all filters'
    },
    {
      key: 'e',
      ctrlKey: true,
      shiftKey: true,
      action: exportCurrentView,
      description: 'Export current view'
    },
    {
      key: 'Escape',
      action: () => {
        // Close modals, clear search, etc.
        const event = new CustomEvent('globalEscape');
        document.dispatchEvent(event);
      },
      description: 'Close modals and clear search'
    },
    {
      key: 'F1',
      action: () => {
        const event = new CustomEvent('showHelp');
        document.dispatchEvent(event);
      },
      description: 'Show help and keyboard shortcuts'
    }
  ];

  return useKeyboardShortcuts(shortcuts);
};

// Hook for managing keyboard shortcut help display
export const useShortcutHelp = () => {
  const { shortcuts } = useFinancialAppShortcuts();

  // Dynamically categorize shortcuts based on their descriptions
  const categorizeShortcuts = () => {
    const categories: {
      search: Array<{ key: string; description: string }>;
      navigation: Array<{ key: string; description: string }>;
      development: Array<{ key: string; description: string }>;
      general: Array<{ key: string; description: string }>;
    } = {
      search: [],
      navigation: [],
      development: [],
      general: []
    };

    shortcuts.forEach((shortcut) => {
      const formattedKey = formatShortcutDisplay(shortcut);
      const entry = { key: formattedKey, description: shortcut.description };

      // Categorize based on description keywords
      const desc = shortcut.description.toLowerCase();

      if (desc.includes('search') || desc.includes('command') || desc.includes('filter')) {
        categories.search.push(entry);
      } else if (desc.includes('performance') || desc.includes('monitor') || desc.includes('dashboard')) {
        categories.development.push(entry);
      } else if (desc.includes('export') || desc.includes('clear')) {
        categories.navigation.push(entry);
      } else {
        categories.general.push(entry);
      }
    });

    return categories;
  };

  const shortcutCategories = categorizeShortcuts();

  return {
    shortcuts,
    shortcutCategories,
    formatShortcutDisplay
  };
};

// Command palette data structure
export interface Command {
  id: string;
  name: string;
  description: string;
  keywords: string[];
  action: () => void;
  shortcut?: string;
  category: 'navigation' | 'search' | 'export' | 'filter' | 'view' | 'development';
  icon?: string;
}

// Default commands for the command palette
export const getDefaultCommands = (): Command[] => [
  {
    id: 'help',
    name: 'Show Help',
    description: 'Show keyboard shortcuts and help guide',
    keywords: ['help', 'shortcuts', 'guide', 'documentation'],
    action: () => {
      const event = new CustomEvent('showHelp');
      document.dispatchEvent(event);
    },
    shortcut: 'F1',
    category: 'view'
  },
  {
    id: 'focus-search',
    name: 'Focus Global Search',
    description: 'Focus the global search input',
    keywords: ['search', 'find', 'focus'],
    action: () => {
      const searchInput = document.querySelector('[data-search="global"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    },
    shortcut: 'Ctrl+F',
    category: 'search'
  },
  {
    id: 'clear-filters',
    name: 'Clear All Filters',
    description: 'Remove all active filters',
    keywords: ['clear', 'reset', 'filters'],
    action: () => {
      const event = new CustomEvent('clearAllFilters');
      document.dispatchEvent(event);
    },
    shortcut: 'Ctrl+Shift+R',
    category: 'filter'
  },
  {
    id: 'export-csv',
    name: 'Export to CSV',
    description: 'Export current view to CSV format',
    keywords: ['export', 'csv', 'download'],
    action: () => {
      const event = new CustomEvent('exportCurrentView', { detail: { format: 'csv' } });
      document.dispatchEvent(event);
    },
    category: 'export'
  },
  {
    id: 'export-excel',
    name: 'Export to Excel',
    description: 'Export current view to Excel format',
    keywords: ['export', 'excel', 'xlsx', 'download'],
    action: () => {
      const event = new CustomEvent('exportCurrentView', { detail: { format: 'excel' } });
      document.dispatchEvent(event);
    },
    category: 'export'
  },
  {
    id: 'toggle-performance',
    name: 'Toggle Performance Dashboard',
    description: 'Show/hide the performance monitoring dashboard',
    keywords: ['performance', 'dashboard', 'monitor'],
    action: () => {
      const event = new CustomEvent('togglePerformanceDashboard');
      document.dispatchEvent(event);
    },
    shortcut: 'Ctrl+Shift+P',
    category: 'development'
  },
  {
    id: 'toggle-search-monitor',
    name: 'Toggle Search Monitor',
    description: 'Show/hide the search performance monitor',
    keywords: ['search', 'monitor', 'performance'],
    action: () => {
      const event = new CustomEvent('toggleSearchMonitor');
      document.dispatchEvent(event);
    },
    shortcut: 'Ctrl+Shift+M',
    category: 'development'
  },
  {
    id: 'navigate-overview',
    name: 'Go to Overview',
    description: 'Navigate to the overview page',
    keywords: ['overview', 'home', 'dashboard'],
    action: () => {
      const event = new CustomEvent('navigateToPage', { detail: { page: 'overview' } });
      document.dispatchEvent(event);
    },
    category: 'navigation'
  },
  {
    id: 'navigate-balance',
    name: 'Go to Balance Data',
    description: 'Navigate to the balance data page',
    keywords: ['balance', 'accounts', 'money'],
    action: () => {
      const event = new CustomEvent('navigateToPage', { detail: { page: 'balance' } });
      document.dispatchEvent(event);
    },
    category: 'navigation'
  },
  {
    id: 'navigate-positions',
    name: 'Go to Positions',
    description: 'Navigate to the positions data page',
    keywords: ['positions', 'securities', 'stocks'],
    action: () => {
      const event = new CustomEvent('navigateToPage', { detail: { page: 'positions' } });
      document.dispatchEvent(event);
    },
    category: 'navigation'
  },
  {
    id: 'navigate-analytics',
    name: 'Go to Analytics',
    description: 'Navigate to the analytics page',
    keywords: ['analytics', 'charts', 'analysis'],
    action: () => {
      const event = new CustomEvent('navigateToPage', { detail: { page: 'analytics' } });
      document.dispatchEvent(event);
    },
    category: 'navigation'
  }
];