import React from 'react';
import { X, Keyboard, Search, Navigation, Zap, Code } from 'lucide-react';
import { useShortcutHelp } from '../hooks/useKeyboardShortcuts';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const { shortcutCategories } = useShortcutHelp();

  if (!isOpen) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'search':
        return <Search size={16} color="#4caf50" />;
      case 'navigation':
        return <Navigation size={16} color="#2196f3" />;
      case 'development':
        return <Code size={16} color="#9c27b0" />;
      default:
        return <Zap size={16} color="#666" />;
    }
  };

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'search':
        return 'Search & Filtering';
      case 'navigation':
        return 'Navigation';
      case 'development':
        return 'Development Tools';
      default:
        return category;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}
        onClick={onClose}
      />

      {/* Help Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90%',
          maxWidth: '700px',
          maxHeight: '80vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          zIndex: 1001,
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 24px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Keyboard size={24} color="#2196f3" />
            <div>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#333' }}>
                Financial Manager Help
              </h2>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666' }}>
                Keyboard shortcuts and features guide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              cursor: 'pointer',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#e0e0e0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <X size={20} color="#666" />
          </button>
        </div>

        {/* Content */}
        <div style={{
          padding: '24px',
          maxHeight: 'calc(80vh - 120px)',
          overflowY: 'auto'
        }}>
          {/* Quick Start */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
              🚀 Quick Start
            </h3>
            <div style={{
              padding: '16px',
              backgroundColor: '#f0f7ff',
              borderRadius: '8px',
              border: '1px solid #2196f3',
              marginBottom: '16px'
            }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#333', lineHeight: 1.6 }}>
                <li><strong>Search:</strong> Press <kbd>Ctrl+F</kbd> to focus the search bar</li>
                <li><strong>Command Palette:</strong> Press <kbd>Ctrl+K</kbd> for quick actions</li>
                <li><strong>Quick Filters:</strong> Click any filter button below the search bar</li>
                <li><strong>Navigation:</strong> Use the sidebar to switch between views</li>
              </ul>
            </div>
          </div>

          {/* Keyboard Shortcuts */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
              ⌨️ Keyboard Shortcuts
            </h3>

            {Object.entries(shortcutCategories).map(([category, shortcuts]) => (
              <div key={category} style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  {getCategoryIcon(category)}
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#555', margin: 0 }}>
                    {getCategoryTitle(category)}
                  </h4>
                </div>

                <div style={{ paddingLeft: '24px' }}>
                  {shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: index < shortcuts.length - 1 ? '1px solid #f0f0f0' : 'none'
                      }}
                    >
                      <span style={{ color: '#666', fontSize: '14px' }}>
                        {shortcut.description}
                      </span>
                      <kbd style={{
                        padding: '4px 8px',
                        backgroundColor: '#f5f5f5',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: '#333'
                      }}>
                        {shortcut.key}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Search Features */}
          <div style={{ marginBottom: '32px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
              🔍 Search Features
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '16px'
            }}>
              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0' }}>
                  Smart Suggestions
                </h5>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.4 }}>
                  Search suggestions based on your data, recent searches, and popular queries.
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0' }}>
                  Fuzzy Matching
                </h5>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.4 }}>
                  Find results even with typos or partial matches. Try searching "APPL" to find "AAPL".
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0' }}>
                  Result Highlighting
                </h5>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.4 }}>
                  Search terms are highlighted in results with different colors for exact, fuzzy, and partial matches.
                </p>
              </div>

              <div style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <h5 style={{ fontSize: '14px', fontWeight: '600', color: '#333', margin: '0 0 8px 0' }}>
                  Quick Filters
                </h5>
                <p style={{ fontSize: '13px', color: '#666', margin: 0, lineHeight: 1.4 }}>
                  One-click filters for common searches like "High Value Accounts" or "Stock Positions".
                </p>
              </div>
            </div>
          </div>

          {/* Performance Tools */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
                🔧 Development Tools
              </h3>
              <div style={{
                padding: '16px',
                backgroundColor: '#fff3e0',
                borderRadius: '8px',
                border: '1px solid #ff9800'
              }}>
                <p style={{ fontSize: '14px', color: '#e65100', margin: '0 0 8px 0' }}>
                  <strong>Development Mode Active</strong>
                </p>
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#ef6c00', fontSize: '13px' }}>
                  <li>Performance Dashboard (bottom-right toggle)</li>
                  <li>Search Performance Monitor (bottom-left toggle)</li>
                  <li>Benchmark Dashboard (top-right toggle)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Tips */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#333', marginBottom: '16px' }}>
              💡 Pro Tips
            </h3>
            <div style={{
              padding: '16px',
              backgroundColor: '#e8f5e8',
              borderRadius: '8px',
              border: '1px solid #4caf50'
            }}>
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#2e7d32', fontSize: '14px', lineHeight: 1.6 }}>
                <li>Use the search suggestions dropdown for faster navigation</li>
                <li>Combine search terms with spaces for more specific results</li>
                <li>Click on search suggestions to apply them instantly</li>
                <li>Use Escape key to close any open dialogs or suggestions</li>
                <li>The command palette remembers your most-used actions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
            Press <kbd style={{
              padding: '2px 6px',
              backgroundColor: '#e0e0e0',
              borderRadius: '3px',
              fontSize: '11px',
              fontFamily: 'monospace'
            }}>Esc</kbd> or click outside to close this help dialog
          </p>
        </div>
      </div>
    </>
  );
};

export default HelpModal;