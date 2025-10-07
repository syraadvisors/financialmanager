/**
 * Database field mapping utilities
 *
 * Converts between Supabase snake_case and TypeScript camelCase
 */

// Helper function to convert snake_case to camelCase
export function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Helper function to convert camelCase to snake_case
export function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Convert object keys from snake_case to camelCase
export function mapToCamelCase<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => mapToCamelCase(item)) as any;
  }

  const result: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = snakeToCamel(key);
      const value = obj[key];

      // Recursively map nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[camelKey] = mapToCamelCase(value);
      } else if (Array.isArray(value)) {
        result[camelKey] = value.map(item =>
          item && typeof item === 'object' ? mapToCamelCase(item) : item
        );
      } else {
        result[camelKey] = value;
      }
    }
  }

  return result;
}

// Convert object keys from camelCase to snake_case
export function mapToSnakeCase<T = any>(obj: any): T {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(item => mapToSnakeCase(item)) as any;
  }

  const result: any = {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const snakeKey = camelToSnake(key);
      const value = obj[key];

      // Recursively map nested objects
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        result[snakeKey] = mapToSnakeCase(value);
      } else if (Array.isArray(value)) {
        result[snakeKey] = value.map(item =>
          item && typeof item === 'object' ? mapToSnakeCase(item) : item
        );
      } else {
        result[snakeKey] = value;
      }
    }
  }

  return result;
}
