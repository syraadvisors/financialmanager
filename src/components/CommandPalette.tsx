import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Search, Command as CommandIcon, ArrowUp, ArrowDown, CornerDownLeft, X } from 'lucide-react';
import { Command, getDefaultCommands } from '../hooks/useKeyboardShortcuts';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands?: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands = getDefaultCommands()
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;

    const query = searchQuery.toLowerCase();
    return commands
      .filter(command => {
        const nameMatch = command.name.toLowerCase().includes(query);
        const descMatch = command.description.toLowerCase().includes(query);
        const keywordMatch = command.keywords.some(keyword =>
          keyword.toLowerCase().includes(query)
        );
        return nameMatch || descMatch || keywordMatch;
      })
      .sort((a, b) => {
        // Prioritize exact matches in name
        const aNameExact = a.name.toLowerCase().includes(query);
        const bNameExact = b.name.toLowerCase().includes(query);
        if (aNameExact && !bNameExact) return -1;
        if (!aNameExact && bNameExact) return 1;
        return 0;
      });
  }, [commands, searchQuery]);

  // Reset selection when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < filteredCommands.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : filteredCommands.length - 1
        );
        break;

      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;

      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filteredCommands, selectedIndex, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedElement = listRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;

      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [selectedIndex]);

  // Reset state when closing
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Category colors
  const getCategoryColor = (category: Command['category']): string => {
    const colors = {
      navigation: '#2196f3',
      search: '#4caf50',
      export: '#ff9800',
      filter: '#9c27b0',
      view: '#00bcd4',
      development: '#f44336'
    };
    return colors[category] || '#666';
  };

  // Category icons
  const getCategoryIcon = (category: Command['category']): string => {
    const icons = {
      navigation: '🧭',
      search: '🔍',
      export: '📄',
      filter: '🔧',
      view: '👁️',
      development: '⚙️'
    };
    return icons[category] || '⚡';
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

      {/* Command Palette */}
      <div
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '640px',
          maxHeight: '70vh',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
          zIndex: 1001,
          overflow: 'hidden',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '16px 20px',
          borderBottom: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa'
        }}>
          <Search size={20} color="#666" style={{ marginRight: '12px' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '16px',
              backgroundColor: 'transparent',
              color: '#333'
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <X size={16} color="#666" />
          </button>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          style={{
            maxHeight: 'calc(70vh - 80px)',
            overflowY: 'auto',
            padding: '8px 0'
          }}
        >
          {filteredCommands.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#666'
            }}>
              <CommandIcon size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
              <div style={{ fontSize: '16px', marginBottom: '8px' }}>No commands found</div>
              <div style={{ fontSize: '14px' }}>
                Try searching for "export", "navigate", or "filter"
              </div>
            </div>
          ) : (
            filteredCommands.map((command, index) => (
              <div
                key={command.id}
                data-index={index}
                onClick={() => {
                  command.action();
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  backgroundColor: index === selectedIndex ? '#f0f7ff' : 'transparent',
                  borderLeft: index === selectedIndex ? `3px solid ${getCategoryColor(command.category)}` : '3px solid transparent',
                  transition: 'all 0.15s ease'
                }}
              >
                {/* Category icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  backgroundColor: `${getCategoryColor(command.category)}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: '12px',
                  fontSize: '14px'
                }}>
                  {getCategoryIcon(command.category)}
                </div>

                {/* Command info */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#333',
                    marginBottom: '2px'
                  }}>
                    {command.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#666'
                  }}>
                    {command.description}
                  </div>
                </div>

                {/* Shortcut */}
                {command.shortcut && (
                  <div style={{
                    padding: '4px 8px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                    color: '#666',
                    fontFamily: 'monospace'
                  }}>
                    {command.shortcut}
                  </div>
                )}

                {/* Selection indicator */}
                {index === selectedIndex && (
                  <CornerDownLeft
                    size={14}
                    color={getCategoryColor(command.category)}
                    style={{ marginLeft: '8px' }}
                  />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderTop: '1px solid #e0e0e0',
          backgroundColor: '#f8f9fa',
          fontSize: '11px',
          color: '#666'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUp size={12} />
              <ArrowDown size={12} />
              <span>Navigate</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CornerDownLeft size={12} />
              <span>Select</span>
            </div>
          </div>
          <div>
            {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>
    </>
  );
};

export default CommandPalette;