// Webpack optimization utilities and recommendations for Create React App
export interface WebpackOptimization {
  splitChunks: {
    chunks: 'all' | 'async' | 'initial';
    minSize: number;
    maxSize: number;
    cacheGroups: {
      [key: string]: {
        name: string;
        test: RegExp | string | ((module: any) => boolean);
        priority: number;
        reuseExistingChunk: boolean;
      };
    };
  };
  usedExports: boolean;
  sideEffects: boolean;
}

// Generate optimized webpack configuration
export function generateOptimizedWebpackConfig(): WebpackOptimization {
  return {
    splitChunks: {
      chunks: 'all',
      minSize: 20000, // 20KB minimum chunk size
      maxSize: 200000, // 200KB maximum chunk size
      cacheGroups: {
        // Vendor libraries
        vendor: {
          name: 'vendors',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          reuseExistingChunk: true
        },

        // React and React-DOM
        react: {
          name: 'react',
          test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
          priority: 20,
          reuseExistingChunk: true
        },

        // UI Libraries (Lucide, React Window)
        uiLibs: {
          name: 'ui-libs',
          test: /[\\/]node_modules[\\/](lucide-react|react-window|react-dropzone)[\\/]/,
          priority: 15,
          reuseExistingChunk: true
        },

        // Data processing libraries
        dataLibs: {
          name: 'data-libs',
          test: /[\\/]node_modules[\\/](papaparse|xlsx|file-saver)[\\/]/,
          priority: 15,
          reuseExistingChunk: true
        },

        // Search and optimization utilities
        searchUtils: {
          name: 'search-utils',
          test: /[\\/]src[\\/]utils[\\/](search|optimization|virtualization)/,
          priority: 8,
          reuseExistingChunk: true
        },

        // Component chunks by feature
        dataComponents: {
          name: 'data-components',
          test: /[\\/]src[\\/]components[\\/](SearchableVirtualTable|ResponsiveDataTable|MobileSearchCard|VirtualScrollTable)/,
          priority: 7,
          reuseExistingChunk: true
        },

        // Page components
        pages: {
          name: 'pages',
          test: /[\\/]src[\\/]pages[\\/]/,
          priority: 6,
          reuseExistingChunk: true
        },

        // Common utilities
        common: {
          name: 'common',
          test: /[\\/]src[\\/](utils|hooks|contexts)[\\/]/,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    usedExports: true, // Enable tree shaking
    sideEffects: false // Mark modules as side-effect free
  };
}

// Bundle analysis utilities
export interface BundleAnalysis {
  totalSize: number;
  gzippedSize: number;
  chunks: ChunkInfo[];
  recommendations: string[];
  performance: {
    score: number;
    issues: string[];
  };
}

export interface ChunkInfo {
  name: string;
  size: number;
  gzippedSize: number;
  modules: string[];
  isAsync: boolean;
}

// Analyze current bundle and provide recommendations
export function analyzeBundlePerformance(buildStats?: any): BundleAnalysis {
  const analysis: BundleAnalysis = {
    totalSize: 0,
    gzippedSize: 0,
    chunks: [],
    recommendations: [],
    performance: {
      score: 100,
      issues: []
    }
  };

  // If we had access to webpack stats, we'd analyze them here
  // For now, provide general recommendations based on the project structure

  // General recommendations for the financial manager app
  analysis.recommendations = [
    'Consider lazy loading the export utilities (xlsx, file-saver) only when needed',
    'Split data processing logic into a separate chunk',
    'Use dynamic imports for search optimization utilities',
    'Consider preloading critical chunks based on user behavior',
    'Implement service worker caching for static chunks',
    'Use webpack-bundle-analyzer to identify duplicate modules',
    'Consider using React.memo() for expensive components (already implemented)',
    'Implement virtualization for large data sets (already implemented)'
  ];

  // Performance scoring based on known issues
  let score = 100;
  const issues: string[] = [];

  // Deduct points for large bundle size (estimated)
  if (analysis.totalSize > 500 * 1024) { // 500KB
    score -= 10;
    issues.push('Bundle size exceeds 500KB');
  }

  // Check for potential optimizations
  if (analysis.chunks.length < 5) {
    score -= 5;
    issues.push('Limited code splitting - consider more chunks');
  }

  analysis.performance = { score, issues };

  return analysis;
}

// Create React App override recommendations
export function getCreateReactAppOverrides(): string {
  return `
// CRACO Configuration for Bundle Optimization
// Install: npm install --save-dev @craco/craco

// craco.config.js
module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Override splitChunks configuration
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 200000,
        cacheGroups: {
          vendor: {
            name: 'vendors',
            test: /[\\\\/]node_modules[\\\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          react: {
            name: 'react',
            test: /[\\\\/]node_modules[\\\\/](react|react-dom)[\\\\/]/,
            priority: 20,
            reuseExistingChunk: true,
          },
          uiLibs: {
            name: 'ui-libs',
            test: /[\\\\/]node_modules[\\\\/](lucide-react|react-window)[\\\\/]/,
            priority: 15,
            reuseExistingChunk: true,
          },
          dataLibs: {
            name: 'data-libs',
            test: /[\\\\/]node_modules[\\\\/](papaparse|xlsx|file-saver)[\\\\/]/,
            priority: 15,
            reuseExistingChunk: true,
          },
        },
      };

      // Enable tree shaking
      webpackConfig.optimization.usedExports = true;
      webpackConfig.optimization.sideEffects = false;

      // Add preload plugins for critical chunks
      const PreloadWebpackPlugin = require('@vue/preload-webpack-plugin');
      webpackConfig.plugins.push(
        new PreloadWebpackPlugin({
          rel: 'preload',
          as: 'script',
          include: ['react', 'vendors'],
        })
      );

      return webpackConfig;
    },
  },
  // Add source-map-explorer for bundle analysis
  scripts: {
    analyze: 'npm run build && npx source-map-explorer build/static/js/*.js',
  },
};
`;
}

// Performance monitoring for runtime bundle loading
export class RuntimeBundleMonitor {
  private static loadTimes: Map<string, number> = new Map();
  private static failedChunks: Set<string> = new Set();

  static recordChunkLoad(chunkName: string, startTime: number): void {
    const loadTime = performance.now() - startTime;
    this.loadTimes.set(chunkName, loadTime);

    console.debug(`Chunk ${chunkName} loaded in ${loadTime.toFixed(2)}ms`);
  }

  static recordChunkError(chunkName: string, error: Error): void {
    this.failedChunks.add(chunkName);
    console.error(`Failed to load chunk ${chunkName}:`, error);
  }

  static getLoadingMetrics(): {
    averageLoadTime: number;
    slowestChunk: { name: string; time: number } | null;
    failedChunks: string[];
    totalChunksLoaded: number;
  } {
    const times = Array.from(this.loadTimes.values());
    const averageLoadTime = times.length > 0
      ? times.reduce((sum, time) => sum + time, 0) / times.length
      : 0;

    let slowestChunk: { name: string; time: number } | null = null;
    let maxTime = 0;

    this.loadTimes.forEach((time, name) => {
      if (time > maxTime) {
        maxTime = time;
        slowestChunk = { name, time };
      }
    });

    return {
      averageLoadTime,
      slowestChunk,
      failedChunks: Array.from(this.failedChunks),
      totalChunksLoaded: this.loadTimes.size
    };
  }
}

// Export utilities for webpack configuration
export default {
  generateOptimizedWebpackConfig,
  analyzeBundlePerformance,
  getCreateReactAppOverrides,
  RuntimeBundleMonitor
};