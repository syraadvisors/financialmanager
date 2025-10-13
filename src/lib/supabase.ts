import { createClient } from '@supabase/supabase-js';
import { getEnvironmentConfig } from '../utils/envValidation';

// Get and validate environment configuration
// This will throw an error if required variables are missing or invalid
const envConfig = getEnvironmentConfig();

const supabaseUrl = envConfig.supabaseUrl;
const supabaseAnonKey = envConfig.supabaseAnonKey;

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'financial-manager',
    },
  },
});

// Helper function to check connection
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('fee_schedules')
      .select('count')
      .limit(1);

    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    return true;
  } catch (err) {
    console.error('Supabase connection failed:', err);
    return false;
  }
}

// Export types for TypeScript
export type Database = any; // We'll generate proper types later

export default supabase;
