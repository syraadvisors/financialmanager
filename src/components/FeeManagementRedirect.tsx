import React, { useEffect } from 'react';
import FeeManagementPage from '../pages/FeeManagementPage';

const FeeManagementRedirect: React.FC = () => {
  useEffect(() => {
    // Add to window object so it can be accessed from console
    (window as any).openFeeManagement = () => {
      const newWindow = window.open('', '_blank', 'width=1400,height=900');
      if (newWindow) {
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Fee Management System</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; }
            </style>
          </head>
          <body>
            <div id="fee-management-root"></div>
            <script>
              // This will be populated by React
            </script>
          </body>
          </html>
        `);
      }
    };
  }, []);

  return null; // This component doesn't render anything
};

export default FeeManagementRedirect;