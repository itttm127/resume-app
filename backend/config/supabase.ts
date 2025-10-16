import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://aqscfthaqrpafsvaxvkd.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxc2NmdGhhcXJwYWZzdmF4dmtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTMwNjksImV4cCI6MjA3NjEyOTA2OX0.hi67PvYPKb77DhoQcU1xp7N53mVlAreEPZehOFQpN4o';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxc2NmdGhhcXJwYWZzdmF4dmtkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDU1MzA2OSwiZXhwIjoyMDc2MTI5MDY5fQ.NYX-Qh3SsmtkXgOZNRUwLcgMRdAlblnNW3ciwCRKt1g';

// postgresql://postgres.aqscfthaqrpafsvaxvkd:[YOUR-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres

// Database connection details
const dbHost = process.env.DB_HOST || 'aws-1-us-east-2.pooler.supabase.com';
const dbPort = process.env.DB_PORT || '6543';
const dbName = process.env.DB_NAME || 'postgres';
const dbUser = process.env.DB_USER || 'postgres.aqscfthaqrpafsvaxvkd';
const dbPassword = process.env.DB_PASSWORD || 'BQRuzFcSuzg2V4Sf';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not found. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

if (!supabaseServiceKey) {
  console.warn('Supabase Service Role Key not found. Please set SUPABASE_SERVICE_ROLE_KEY environment variable.');
}

// Client with anon key (for client-side operations)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false
  }
});

// Client with service role key (for server-side operations with elevated permissions)
export const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
}) : null;

// Database types
export interface JobData {
  id?: number;
  job_description: string;
  file_name: string;
  company_name: string;
  created_at?: string;
  updated_at?: string;
}

export const JOB_DATA_TABLE = 'job_applications';

// PostgreSQL connection configuration
export const dbConfig = {
  host: dbHost,
  port: parseInt(dbPort),
  database: dbName,
  user: dbUser,
  password: dbPassword,
  ssl: {
    rejectUnauthorized: false
  },
  family: 4
};