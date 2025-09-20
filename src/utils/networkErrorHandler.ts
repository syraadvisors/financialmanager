// Network Error Handling System for Future API Integration

export interface NetworkError {
  type: 'network' | 'timeout' | 'server' | 'client' | 'auth' | 'rate_limit' | 'maintenance';
  status?: number;
  code?: string;
  message: string;
  originalError?: Error;
  endpoint?: string;
  retryable: boolean;
  retryAfter?: number; // seconds
  timestamp: Date;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // milliseconds
  maxDelay: number; // milliseconds
  backoffMultiplier: number;
  retryableStatuses: number[];
  retryableTypes: NetworkError['type'][];
}

export interface NetworkHealthStatus {
  isOnline: boolean;
  lastSuccessfulRequest?: Date;
  consecutiveFailures: number;
  estimatedRecoveryTime?: Date;
  degradedMode: boolean;
}

export class NetworkErrorHandler {
  private retryConfig: RetryConfig = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    retryableStatuses: [408, 429, 500, 502, 503, 504],
    retryableTypes: ['network', 'timeout', 'server', 'rate_limit']
  };

  private healthStatus: NetworkHealthStatus = {
    isOnline: navigator.onLine,
    consecutiveFailures: 0,
    degradedMode: false
  };

  private errorLog: NetworkError[] = [];
  private readonly maxLogSize = 100;

  constructor(customConfig?: Partial<RetryConfig>) {
    if (customConfig) {
      this.retryConfig = { ...this.retryConfig, ...customConfig };
    }

    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.healthStatus.isOnline = true;
      this.healthStatus.degradedMode = false;
      console.log('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.healthStatus.isOnline = false;
      this.healthStatus.degradedMode = true;
      console.log('Network connection lost');
    });
  }

  public async executeWithRetry<T>(
    operation: () => Promise<T>,
    endpoint?: string,
    customRetries?: number
  ): Promise<T> {
    const maxRetries = customRetries || this.retryConfig.maxRetries;
    let lastError: NetworkError | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        // Check if we're offline
        if (!this.healthStatus.isOnline) {
          throw this.createNetworkError('network', 0, 'No internet connection', endpoint);
        }

        const result = await operation();

        // Success - update health status
        this.healthStatus.lastSuccessfulRequest = new Date();
        this.healthStatus.consecutiveFailures = 0;
        this.healthStatus.degradedMode = false;

        return result;
      } catch (error) {
        const networkError = this.parseError(error, endpoint);
        lastError = networkError;
        this.logError(networkError);
        this.updateHealthStatus(networkError);

        // Don't retry on final attempt or non-retryable errors
        if (attempt === maxRetries || !this.shouldRetry(networkError)) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, networkError);
        console.warn(`Request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms:`, networkError.message);

        await this.delay(delay);
      }
    }

    // If we get here, all retries failed
    if (lastError) {
      throw lastError;
    }

    throw this.createNetworkError('network', 0, 'Unknown network error', endpoint);
  }

  public parseError(error: any, endpoint?: string): NetworkError {
    // Handle different types of errors
    if (error.name === 'AbortError') {
      return this.createNetworkError('timeout', 0, 'Request timeout', endpoint, error);
    }

    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return this.createNetworkError('network', 0, 'Network connection failed', endpoint, error);
    }

    // HTTP response errors
    if (error.response || error.status) {
      const status = error.response?.status || error.status || 0;
      const message = error.response?.data?.message || error.message || 'HTTP error';

      let type: NetworkError['type'] = 'server';
      if (status >= 400 && status < 500) type = 'client';
      if (status === 401 || status === 403) type = 'auth';
      if (status === 429) type = 'rate_limit';
      if (status === 503) type = 'maintenance';

      return this.createNetworkError(type, status, message, endpoint, error);
    }

    // Generic error
    return this.createNetworkError('network', 0, error.message || 'Unknown error', endpoint, error);
  }

  private createNetworkError(
    type: NetworkError['type'],
    status: number,
    message: string,
    endpoint?: string,
    originalError?: Error
  ): NetworkError {
    return {
      type,
      status: status || undefined,
      message,
      endpoint,
      originalError,
      retryable: this.retryConfig.retryableTypes.includes(type) ||
                 (status > 0 && this.retryConfig.retryableStatuses.includes(status)),
      retryAfter: this.extractRetryAfter(originalError),
      timestamp: new Date()
    };
  }

  private extractRetryAfter(error: any): number | undefined {
    // Try to extract Retry-After header from response
    const retryAfter = error?.response?.headers?.['retry-after'];
    if (retryAfter) {
      const seconds = parseInt(retryAfter);
      return isNaN(seconds) ? undefined : seconds;
    }
    return undefined;
  }

  private shouldRetry(error: NetworkError): boolean {
    // Don't retry if explicitly not retryable
    if (!error.retryable) return false;

    // Don't retry client errors (except specific ones)
    if (error.type === 'client' && error.status !== 408 && error.status !== 429) {
      return false;
    }

    // Don't retry auth errors
    if (error.type === 'auth') return false;

    return true;
  }

  private calculateDelay(attempt: number, error: NetworkError): number {
    // Use Retry-After header if available
    if (error.retryAfter) {
      return Math.min(error.retryAfter * 1000, this.retryConfig.maxDelay);
    }

    // Exponential backoff with jitter
    const baseDelay = this.retryConfig.initialDelay *
                      Math.pow(this.retryConfig.backoffMultiplier, attempt);

    const jitter = Math.random() * 0.3 * baseDelay; // ±30% jitter
    const delay = baseDelay + jitter;

    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private logError(error: NetworkError): void {
    this.errorLog.unshift(error);

    // Maintain log size
    if (this.errorLog.length > this.maxLogSize) {
      this.errorLog = this.errorLog.slice(0, this.maxLogSize);
    }
  }

  private updateHealthStatus(error: NetworkError): void {
    this.healthStatus.consecutiveFailures++;

    // Enable degraded mode after multiple failures
    if (this.healthStatus.consecutiveFailures >= 3) {
      this.healthStatus.degradedMode = true;

      // Estimate recovery time based on error type
      const now = new Date();
      switch (error.type) {
        case 'rate_limit':
          this.healthStatus.estimatedRecoveryTime = new Date(now.getTime() + (error.retryAfter || 60) * 1000);
          break;
        case 'maintenance':
          this.healthStatus.estimatedRecoveryTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
          break;
        case 'server':
          this.healthStatus.estimatedRecoveryTime = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes
          break;
        default:
          this.healthStatus.estimatedRecoveryTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes
      }
    }
  }

  // Public methods for monitoring
  public getHealthStatus(): NetworkHealthStatus {
    return { ...this.healthStatus };
  }

  public getRecentErrors(count: number = 10): NetworkError[] {
    return this.errorLog.slice(0, count);
  }

  public getErrorStats(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByStatus: Record<number, number>;
    consecutiveFailures: number;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByStatus: Record<number, number> = {};

    this.errorLog.forEach(error => {
      errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
      if (error.status) {
        errorsByStatus[error.status] = (errorsByStatus[error.status] || 0) + 1;
      }
    });

    return {
      totalErrors: this.errorLog.length,
      errorsByType,
      errorsByStatus,
      consecutiveFailures: this.healthStatus.consecutiveFailures
    };
  }

  public clearErrorLog(): void {
    this.errorLog = [];
    this.healthStatus.consecutiveFailures = 0;
    this.healthStatus.degradedMode = false;
  }
}

// Utility function for creating HTTP requests with error handling
export async function createResilientRequest(
  url: string,
  options: RequestInit = {},
  errorHandler?: NetworkErrorHandler,
  timeoutMs: number = 10000
): Promise<Response> {
  const handler = errorHandler || new NetworkErrorHandler();

  const operation = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        (error as any).response = response;
        (error as any).status = response.status;
        throw error;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  return handler.executeWithRetry(operation, url);
}

// Circuit Breaker Pattern for API calls
export class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private failureThreshold: number = 5,
    private recoveryTimeoutMs: number = 60000, // 1 minute
    private successThreshold: number = 2
  ) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.shouldAttemptReset()) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private shouldAttemptReset(): boolean {
    return !!(this.lastFailureTime &&
              Date.now() - this.lastFailureTime.getTime() >= this.recoveryTimeoutMs);
  }

  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = new Date();

    if (this.state === 'HALF_OPEN') {
      this.state = 'OPEN';
    } else if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }

  public getState(): { state: string; failureCount: number; lastFailure?: Date } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailure: this.lastFailureTime
    };
  }
}