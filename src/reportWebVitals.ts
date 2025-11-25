import { ReportHandler } from 'web-vitals';
import * as Sentry from '@sentry/react';

const reportWebVitals = (onPerfEntry?: ReportHandler) => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Report to both custom handler and Sentry
      const reportToSentry = (metric: any) => {
        // Add breadcrumb for web vitals (simpler approach)
        Sentry.addBreadcrumb({
          category: 'web-vitals',
          message: `${metric.name}: ${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`,
          level: metric.rating === 'good' ? 'info' : metric.rating === 'needs-improvement' ? 'warning' : 'error',
          data: {
            id: metric.id,
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
          },
        });
      };

      getCLS((metric) => {
        onPerfEntry(metric);
        reportToSentry(metric);
      });
      getFID((metric) => {
        onPerfEntry(metric);
        reportToSentry(metric);
      });
      getFCP((metric) => {
        onPerfEntry(metric);
        reportToSentry(metric);
      });
      getLCP((metric) => {
        onPerfEntry(metric);
        reportToSentry(metric);
      });
      getTTFB((metric) => {
        onPerfEntry(metric);
        reportToSentry(metric);
      });
    });
  }
};

export default reportWebVitals;
