import React from 'react';

interface HighlightTextProps {
  text: string;
  searchTerm: string;
  highlightStyle?: React.CSSProperties;
}

const HighlightText: React.FC<HighlightTextProps> = ({
  text,
  searchTerm,
  highlightStyle = {
    backgroundColor: '#ffeb3b',
    padding: '1px 2px',
    fontWeight: 'bold',
    borderRadius: '2px'
  }
}) => {
  if (!text || !searchTerm) {
    return <>{text}</>;
  }

  const escapeRegex = (string: string): string => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  const regex = new RegExp(`(${escapeRegex(searchTerm)})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} style={highlightStyle}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

export default HighlightText;