import React from 'react';
import { Undo, Redo, Save, RotateCcw } from 'lucide-react';
import { useAppContext } from '../contexts/AppContext';

interface UndoRedoControlsProps {
  variant?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  className?: string;
}

const UndoRedoControls: React.FC<UndoRedoControlsProps> = ({
  variant = 'horizontal',
  size = 'medium',
  showLabels = true,
  className = ''
}) => {
  const { state, undo, redo, clearAllData, canUndo, canRedo } = useAppContext();

  const iconSizes = {
    small: 14,
    medium: 16,
    large: 18
  };

  const paddingSizes = {
    small: '4px 8px',
    medium: '6px 12px',
    large: '8px 16px'
  };

  const fontSizes = {
    small: '11px',
    medium: '12px',
    large: '14px'
  };

  const iconSize = iconSizes[size];
  const padding = paddingSizes[size];
  const fontSize = fontSizes[size];

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: showLabels ? '6px' : '0',
    padding: padding,
    border: '1px solid #ddd',
    borderRadius: '4px',
    background: 'white',
    cursor: 'pointer',
    fontSize: fontSize,
    color: '#333',
    transition: 'all 0.2s ease',
  };

  const disabledButtonStyle = {
    ...buttonStyle,
    cursor: 'not-allowed',
    opacity: 0.5,
    background: '#f5f5f5',
    color: '#999',
  };

  const containerStyle = {
    display: 'flex',
    flexDirection: variant === 'horizontal' ? 'row' : 'column' as 'row' | 'column',
    gap: '4px',
    alignItems: 'center',
  };

  const handleUndo = () => {
    if (canUndo) {
      undo();
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      redo();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
      clearAllData();
    }
  };

  return (
    <div style={containerStyle} className={className}>
      {/* Undo Button */}
      <button
        onClick={handleUndo}
        disabled={!canUndo}
        style={canUndo ? buttonStyle : disabledButtonStyle}
        title={`Undo (${state.undoStack.length} actions available)`}
        onMouseEnter={(e) => {
          if (canUndo) {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            e.currentTarget.style.borderColor = '#999';
          }
        }}
        onMouseLeave={(e) => {
          if (canUndo) {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#ddd';
          }
        }}
      >
        <Undo size={iconSize} />
        {showLabels && 'Undo'}
      </button>

      {/* Redo Button */}
      <button
        onClick={handleRedo}
        disabled={!canRedo}
        style={canRedo ? buttonStyle : disabledButtonStyle}
        title={`Redo (${state.redoStack.length} actions available)`}
        onMouseEnter={(e) => {
          if (canRedo) {
            e.currentTarget.style.backgroundColor = '#f0f0f0';
            e.currentTarget.style.borderColor = '#999';
          }
        }}
        onMouseLeave={(e) => {
          if (canRedo) {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.borderColor = '#ddd';
          }
        }}
      >
        <Redo size={iconSize} />
        {showLabels && 'Redo'}
      </button>

      {/* Divider */}
      {(canUndo || canRedo || state.isDirty) && (
        <div style={{
          width: variant === 'horizontal' ? '1px' : '100%',
          height: variant === 'horizontal' ? '20px' : '1px',
          backgroundColor: '#e0e0e0',
          margin: variant === 'horizontal' ? '0 4px' : '4px 0',
        }} />
      )}

      {/* Save State Button */}
      {state.isDirty && (
        <button
          style={{
            ...buttonStyle,
            backgroundColor: '#e3f2fd',
            borderColor: '#1976d2',
            color: '#1976d2',
          }}
          title="Save current state"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#bbdefb';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#e3f2fd';
          }}
        >
          <Save size={iconSize} />
          {showLabels && 'Saved'}
        </button>
      )}

      {/* Clear All Button */}
      {(state.balanceData.length > 0 || state.positionsData.length > 0) && (
        <button
          onClick={handleClearAll}
          style={{
            ...buttonStyle,
            backgroundColor: '#ffebee',
            borderColor: '#f44336',
            color: '#d32f2f',
          }}
          title="Clear all data"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#ffcdd2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#ffebee';
          }}
        >
          <RotateCcw size={iconSize} />
          {showLabels && 'Clear'}
        </button>
      )}
    </div>
  );
};

export default UndoRedoControls;