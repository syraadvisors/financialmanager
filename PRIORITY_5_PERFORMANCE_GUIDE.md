# Priority 5 - Performance & Architecture Implementation Guide

## Current Status Analysis

### Bundle Size Overview
- **Total Bundle Size**: 5.7MB
- **Main Bundle**: 246KB
- **Number of Chunks**: 22 chunks (excellent code splitting already in place!)
- **Largest Chunk**: 279KB (chunk 373)

### What's Already Optimized ✅
- Code splitting with React.lazy() already implemented in App.tsx
- Lazy loading for all major pages
- Bundle analyzer script already configured
- TypeScript strict mode enabled
- Production build minification working

---

## 1. Bundle Size Optimization

### A. Analyze Current Bundle

```bash
# Run bundle analyzer (already configured)
npm run analyze

# This will:
# 1. Build production bundle
# 2. Open interactive treemap in browser
# 3. Show which libraries are taking the most space
```

### B. Key Optimizations to Implement

#### 1. Replace Heavy Chart Libraries
**Current**: Using both `chart.js` + `recharts` (redundant!)

```bash
# Check sizes
npm ls chart.js recharts
```

**Recommendation**: Pick ONE charting library
- **Keep recharts** (more React-friendly, smaller) OR
- **Keep chart.js** (more features)
- Remove the other to save ~150-200KB

```bash
# If keeping recharts:
npm uninstall chart.js react-chartjs-2

# If keeping chart.js:
npm uninstall recharts
```

Then update components to use only one library.

#### 2. Optimize lucide-react Icons
**Current**: Importing entire icon library

**Better**: Use tree-shaking imports
```typescript
// ❌ Bad - imports entire library
import { Plus, Edit, Trash } from 'lucide-react';

// ✅ Good - tree-shakeable (if available)
import Plus from 'lucide-react/dist/esm/icons/plus';
import Edit from 'lucide-react/dist/esm/icons/edit';
```

**OR** create an icon barrel file:
```typescript
// src/components/icons/index.ts
export {
  Plus, Edit, Trash, Search, // ... only icons you use
} from 'lucide-react';

// Then import from your barrel
import { Plus, Edit } from '@/components/icons';
```

#### 3. Dynamic Import for Large Libraries

```typescript
// For xlsx (large library used in import)
const handleImport = async () => {
  const XLSX = await import('xlsx');
  // Use XLSX here
};

// For papaparse
const handleCSVParse = async () => {
  const Papa = await import('papaparse');
  // Use Papa here
};
```

#### 4. Optimize date-fns (if using)
Use only specific functions:
```typescript
// ❌ Bad
import { format, parse, addDays } from 'date-fns';

// ✅ Good
import format from 'date-fns/format';
import parse from 'date-fns/parse';
```

### C. Bundle Size Targets

| Target | Size | Status |
|--------|------|--------|
| Main bundle | < 300KB | ✅ Already at 246KB |
| Largest chunk | < 250KB | ⚠️ Need to split chunk 373 (279KB) |
| Total initial load | < 1MB | ✅ Likely under with lazy loading |

---

## 2. Error Tracking with Sentry

### A. Setup Sentry (Free Tier)

```bash
# Install Sentry
npm install --save @sentry/react
```

### B. Create Sentry Configuration

**File**: `src/utils/errorTracking.ts`
```typescript
import * as Sentry from '@sentry/react';

export const initializeErrorTracking = () => {
  // Only initialize in production
  if (process.env.NODE_ENV === 'production') {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN, // Add to .env.local
      environment: process.env.NODE_ENV,

      // Set sample rate for production (25% of errors)
      sampleRate: 0.25,

      // Performance monitoring
      tracesSampleRate: 0.1, // 10% of transactions

      // Release tracking
      release: `feemgr@${process.env.REACT_APP_VERSION || '0.1.0'}`,

      // Enhanced error context
      beforeSend(event, hint) {
        // Add custom context
        const error = hint.originalException as Error;

        // Filter out network errors in development
        if (error?.message?.includes('Network')) {
          return null; // Don't send
        }

        return event;
      },

      // Integrations
      integrations: [
        new Sentry.BrowserTracing({
          // Track navigation
          routingInstrumentation: Sentry.reactRouterV6Instrumentation(
            // Add React Router history if using
          ),
        }),
        new Sentry.Replay({
          // Session replay for debugging
          maskAllText: true,
          blockAllMedia: true,
        }),
      ],
    });
  }
};

// Helper to manually track errors
export const logError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, context);
  }
};

// Track custom events
export const trackEvent = (eventName: string, data?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureMessage(eventName, {
      level: 'info',
      extra: data,
    });
  }
};
```

### C. Update App.tsx

```typescript
import { initializeErrorTracking } from './utils/errorTracking';
import * as Sentry from '@sentry/react';

// Initialize at app start
useEffect(() => {
  initializeErrorTracking();
}, []);

// Wrap your app with Sentry ErrorBoundary
const App: React.FC = () => {
  return (
    <Sentry.ErrorBoundary
      fallback={<ErrorFallback />}
      showDialog
    >
      <AppProvider enablePersistence={true}>
        <SearchProvider>
          <AppContent />
        </SearchProvider>
      </AppProvider>
    </Sentry.ErrorBoundary>
  );
};
```

### D. Environment Variables (.env.local)

```bash
# Create .env.local (not committed to git)
REACT_APP_SENTRY_DSN=https://your-project-dsn@sentry.io/project-id
REACT_APP_VERSION=0.1.0
```

### E. Get Your Sentry DSN

1. Go to https://sentry.io/signup/
2. Create free account
3. Create new React project
4. Copy your DSN
5. Add to `.env.local`

**Cost**: FREE tier includes:
- 5,000 errors/month
- 10,000 performance transactions/month
- 30 days retention

---

## 3. E2E Testing with Playwright

### A. Why Playwright?
- ✅ Faster than Cypress
- ✅ Better TypeScript support
- ✅ Multi-browser (Chrome, Firefox, Safari)
- ✅ Auto-wait for elements
- ✅ Free and open-source

### B. Install Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

### C. Create Playwright Config

**File**: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if tests fail
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Reporters
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
  ],

  use: {
    // Base URL for your app
    baseURL: 'http://localhost:3000',

    // Collect trace on failure
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Run local dev server before tests
  webServer: {
    command: 'npm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
```

### D. Create Test Structure

```bash
mkdir -p tests/e2e
```

**File**: `tests/e2e/navigation.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should navigate to all main pages', async ({ page }) => {
    await page.goto('/');

    // Check overview page loads
    await expect(page).toHaveTitle(/FeeMGR/);
    await expect(page.locator('h1')).toContainText('Overview');

    // Navigate to Import page
    await page.click('text=Import');
    await expect(page.locator('h1')).toContainText('Import');

    // Navigate to Clients page
    await page.click('text=Clients');
    await expect(page.locator('h1')).toContainText('Client Management');

    // Navigate to Fee Schedules
    await page.click('text=Fee Schedules');
    await expect(page.locator('h1')).toContainText('Fee Schedules');
  });
});
```

**File**: `tests/e2e/fee-calculation.spec.ts`
```typescript
import { test, expect } from '@playwright/test';

test.describe('Fee Calculation', () => {
  test('should calculate fees correctly', async ({ page }) => {
    await page.goto('/');

    // Navigate to fee calculator
    await page.click('text=Fee Calculator');

    // Wait for page to load
    await page.waitForSelector('h1:has-text("Fee Calculator")');

    // Select a billing period
    await page.selectOption('select[name="billingPeriod"]', 'Q4-2024');

    // Click calculate button
    await page.click('button:has-text("Calculate Fees")');

    // Wait for results
    await page.waitForSelector('.fee-results', { timeout: 5000 });

    // Verify results displayed
    const totalFees = await page.locator('.total-fees').textContent();
    expect(totalFees).toMatch(/\$[\d,]+/);
  });
});
```

**File**: `tests/e2e/csv-import.spec.ts`
```typescript
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('CSV Import', () => {
  test('should import balance data', async ({ page }) => {
    await page.goto('/import');

    // Upload test CSV file
    const filePath = path.join(__dirname, '../fixtures/test_balances.csv');
    await page.setInputFiles('input[type="file"]', filePath);

    // Wait for processing
    await page.waitForSelector('.success-message', { timeout: 10000 });

    // Verify import success
    await expect(page.locator('.success-message')).toContainText('imported successfully');

    // Check data appears in table
    await page.click('text=Balance Data');
    await expect(page.locator('table tbody tr')).toHaveCount({ minimum: 1 });
  });
});
```

### E. Add Test Scripts to package.json

```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:report": "playwright show-report"
  }
}
```

### F. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npm run test:e2e:debug tests/e2e/navigation.spec.ts

# View test report
npm run test:e2e:report
```

---

## 4. API Integration Architecture (No Backend Yet)

Since you don't have a backend, let's set up a **future-proof architecture**:

### A. Create API Service Layer

**File**: `src/services/api/client.ts`
```typescript
// API Client configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('API Request Failed:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
```

### B. Create Service Modules

**File**: `src/services/api/clients.service.ts`
```typescript
import { apiClient, ApiResponse } from './client';
import { Client } from '../../types/Client';

// Mock data for now (replace with API calls later)
const mockClients: Client[] = [/* ... */];

export const clientsService = {
  // Get all clients
  async getAll(): Promise<ApiResponse<Client[]>> {
    // TODO: Replace with API call when backend ready
    // return apiClient.get<Client[]>('/clients');

    // For now, return mock data
    return new Promise(resolve => {
      setTimeout(() => resolve({ data: mockClients }), 500);
    });
  },

  // Get client by ID
  async getById(id: string): Promise<ApiResponse<Client>> {
    // return apiClient.get<Client>(`/clients/${id}`);

    const client = mockClients.find(c => c.id === id);
    return { data: client };
  },

  // Create new client
  async create(client: Partial<Client>): Promise<ApiResponse<Client>> {
    // return apiClient.post<Client>('/clients', client);

    const newClient: Client = {
      ...client,
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Client;

    mockClients.push(newClient);
    return { data: newClient };
  },

  // Update client
  async update(id: string, updates: Partial<Client>): Promise<ApiResponse<Client>> {
    // return apiClient.put<Client>(`/clients/${id}`, updates);

    const index = mockClients.findIndex(c => c.id === id);
    if (index >= 0) {
      mockClients[index] = { ...mockClients[index], ...updates };
      return { data: mockClients[index] };
    }
    return { error: 'Client not found' };
  },

  // Delete client
  async delete(id: string): Promise<ApiResponse<void>> {
    // return apiClient.delete<void>(`/clients/${id}`);

    const index = mockClients.findIndex(c => c.id === id);
    if (index >= 0) {
      mockClients.splice(index, 1);
      return { data: undefined };
    }
    return { error: 'Client not found' };
  },
};
```

### C. Use Services in Components

**Example**: Update ClientsPage.tsx
```typescript
import { clientsService } from '../services/api/clients.service';

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    setLoading(true);
    const response = await clientsService.getAll();

    if (response.data) {
      setClients(response.data);
    } else {
      console.error('Failed to load clients:', response.error);
    }

    setLoading(false);
  };

  const handleCreateClient = async (clientData: Partial<Client>) => {
    const response = await clientsService.create(clientData);

    if (response.data) {
      setClients(prev => [...prev, response.data!]);
    }
  };

  // ... rest of component
};
```

### D. Backend Options for Future

#### Option 1: Node.js + Express + PostgreSQL
**Pros**: Fast, JavaScript throughout, great for JSON
**Stack**:
```bash
# Backend setup
npm install express pg
npm install --save-dev @types/express @types/pg
```

#### Option 2: Python + FastAPI + PostgreSQL
**Pros**: Great for data processing, async support
**Stack**:
```bash
pip install fastapi uvicorn sqlalchemy psycopg2
```

#### Option 3: Supabase (Easiest!)
**Pros**: Backend-as-a-Service, PostgreSQL, Auth, Storage
**Free tier**: 500MB database, 1GB file storage

```bash
npm install @supabase/supabase-js
```

```typescript
// src/services/api/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!
);

export { supabase };
```

#### Option 4: Firebase
**Pros**: Real-time, authentication included, free tier
```bash
npm install firebase
```

---

## 5. CI/CD Pipeline with GitHub Actions

### A. Create GitHub Actions Workflow

**File**: `.github/workflows/ci.yml`
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  # Job 1: Build and Test
  build-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint || echo "Linting completed with warnings"

      - name: Run unit tests
        run: npm test -- --coverage --watchAll=false

      - name: Build application
        run: npm run build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build
          path: build/
          retention-days: 7

  # Job 2: E2E Tests
  e2e-tests:
    runs-on: ubuntu-latest
    needs: build-and-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7

  # Job 3: Bundle Size Check
  bundle-size:
    runs-on: ubuntu-latest
    needs: build-and-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build and analyze bundle
        run: |
          npm run build
          ls -lh build/static/js/*.js
          du -sh build/

      - name: Check bundle size limits
        run: |
          MAIN_SIZE=$(du -k build/static/js/main*.js | cut -f1)
          if [ $MAIN_SIZE -gt 300 ]; then
            echo "Main bundle size ($MAIN_SIZE KB) exceeds limit (300 KB)"
            exit 1
          fi

  # Job 4: Deploy to Netlify/Vercel (optional)
  deploy:
    runs-on: ubuntu-latest
    needs: [build-and-test, e2e-tests]
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      # Netlify deployment
      - name: Deploy to Netlify
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
        with:
          args: deploy --prod --dir=build
```

### B. Add Scripts to package.json

```json
{
  "scripts": {
    "lint": "eslint src --ext .ts,.tsx",
    "lint:fix": "eslint src --ext .ts,.tsx --fix",
    "test:coverage": "npm test -- --coverage --watchAll=false",
    "test:ci": "npm test -- --watchAll=false --passWithNoTests"
  }
}
```

### C. Set Up Repository Secrets

In GitHub repository settings → Secrets and variables → Actions:

```
NETLIFY_AUTH_TOKEN=your_netlify_token
NETLIFY_SITE_ID=your_site_id
SENTRY_DSN=your_sentry_dsn
```

### D. Add Status Badge to README

```markdown
# FeeMGR

![CI/CD](https://github.com/yourusername/financial_manager/workflows/CI%2FCD%20Pipeline/badge.svg)
![Build Status](https://img.shields.io/github/workflow/status/yourusername/financial_manager/CI%2FCD%20Pipeline)

Financial portfolio management and fee calculation system.
```

---

## Summary & Next Steps

### Quick Wins (Do These First)
1. ✅ **Remove duplicate chart libraries** (saves 150-200KB)
2. ✅ **Set up Sentry** (30 min, free)
3. ✅ **Create basic E2E tests** (1-2 hours)
4. ✅ **Set up GitHub Actions** (1 hour)

### Medium Priority
1. Optimize icon imports
2. Add more E2E test coverage
3. Set up bundle size monitoring
4. Create API service layer

### When Backend is Ready
1. Replace mock data with API calls
2. Add authentication
3. Set up real-time updates
4. Add data persistence

### Deployment Options (All Free Tier)
- **Netlify**: Best for static sites (10GB/month free)
- **Vercel**: Great DX, auto-deploys (100GB/month free)
- **GitHub Pages**: Simple, unlimited for public repos
- **Cloudflare Pages**: Fast CDN, unlimited bandwidth

---

## Cost Summary

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Sentry** | 5K errors/month | More than enough |
| **Playwright** | FREE | Open source |
| **GitHub Actions** | 2,000 min/month | Plenty for CI/CD |
| **Netlify/Vercel** | 100GB bandwidth | Free deployment |
| **Supabase** (if chosen) | 500MB database | Easiest backend option |

**Total Cost**: $0/month for everything! 🎉

---

## Questions?

1. Which chart library do you want to keep? (chart.js or recharts)
2. Do you want to set up Sentry now?
3. Should we create a Supabase backend or wait for custom backend?
4. Deploy to Netlify or Vercel?
