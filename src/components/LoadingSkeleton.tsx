import React from 'react';

interface LoadingSkeletonProps {
  type: 'page' | 'table' | 'card' | 'chart';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 1 }) => {
  const baseStyles = {
    backgroundColor: '#f5f5f5',
    borderRadius: '4px',
    background: 'linear-gradient(90deg, #f5f5f5 25%, #e0e0e0 50%, #f5f5f5 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 2s infinite linear',
  };

  // Add keyframes for shimmer animation
  React.useEffect(() => {
    const styleSheet = document.styleSheets[0] as CSSStyleSheet;
    const keyframes = `
      @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }
      @keyframes pulse {
        0% { opacity: 1; }
        100% { opacity: 0.7; }
      }
    `;

    try {
      styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
    } catch (e) {
      // Keyframes might already exist
    }
  }, []);

  const renderPageSkeleton = () => (
    <div style={{
      padding: '32px',
      backgroundColor: '#fafafa',
      minHeight: '100vh',
    }}>
      {/* Header skeleton */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          ...baseStyles,
          height: '40px',
          width: '300px',
          marginBottom: '12px',
        }} />
        <div style={{
          ...baseStyles,
          height: '20px',
          width: '500px',
        }} />
      </div>

      {/* Summary cards skeleton */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
      }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e0e0e0',
          }}>
            <div style={{
              ...baseStyles,
              height: '16px',
              width: '120px',
              marginBottom: '12px',
            }} />
            <div style={{
              ...baseStyles,
              height: '32px',
              width: '80px',
            }} />
          </div>
        ))}
      </div>

      {/* Controls skeleton */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        marginBottom: '16px',
      }}>
        <div style={{
          display: 'flex',
          gap: '16px',
          alignItems: 'center',
        }}>
          <div style={{
            ...baseStyles,
            height: '36px',
            flex: 1,
            maxWidth: '300px',
          }} />
          <div style={{
            ...baseStyles,
            height: '36px',
            width: '120px',
          }} />
          <div style={{
            ...baseStyles,
            height: '36px',
            width: '100px',
          }} />
        </div>
      </div>

      {/* Table skeleton */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        border: '1px solid #e0e0e0',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          backgroundColor: '#f8f9fa',
          borderBottom: '2px solid #e0e0e0',
          padding: '12px',
        }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} style={{
              ...baseStyles,
              height: '16px',
              width: '100px',
              marginRight: '20px',
            }} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} style={{
            display: 'flex',
            padding: '12px',
            borderBottom: '1px solid #f0f0f0',
            backgroundColor: i % 2 === 0 ? 'white' : '#fafafa',
          }}>
            {[1, 2, 3, 4, 5].map((j) => (
              <div key={j} style={{
                ...baseStyles,
                height: '16px',
                width: '80px',
                marginRight: '20px',
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderTableSkeleton = () => (
    <div style={{
      background: 'white',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #e0e0e0',
        padding: '12px',
      }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} style={{
            ...baseStyles,
            height: '16px',
            width: '100px',
            marginRight: '20px',
          }} />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          display: 'flex',
          padding: '12px',
          borderBottom: '1px solid #f0f0f0',
          backgroundColor: i % 2 === 0 ? 'white' : '#fafafa',
        }}>
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} style={{
              ...baseStyles,
              height: '16px',
              width: '80px',
              marginRight: '20px',
            }} />
          ))}
        </div>
      ))}
    </div>
  );

  const renderCardSkeleton = () => (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      marginBottom: '16px',
    }}>
      <div style={{
        ...baseStyles,
        height: '20px',
        width: '150px',
        marginBottom: '12px',
      }} />
      <div style={{
        ...baseStyles,
        height: '32px',
        width: '100px',
        marginBottom: '8px',
      }} />
      <div style={{
        ...baseStyles,
        height: '14px',
        width: '200px',
      }} />
    </div>
  );

  const renderChartSkeleton = () => (
    <div style={{
      background: 'white',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      height: '400px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        ...baseStyles,
        width: '80%',
        height: '80%',
        borderRadius: '8px',
      }} />
    </div>
  );

  const renderSkeletonByType = () => {
    switch (type) {
      case 'page':
        return renderPageSkeleton();
      case 'table':
        return renderTableSkeleton();
      case 'card':
        return Array.from({ length: count }).map((_, i) => (
          <React.Fragment key={i}>
            {renderCardSkeleton()}
          </React.Fragment>
        ));
      case 'chart':
        return renderChartSkeleton();
      default:
        return renderPageSkeleton();
    }
  };

  return (
    <div>
      {renderSkeletonByType()}
    </div>
  );
};

export default LoadingSkeleton;