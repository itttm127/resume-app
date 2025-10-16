import { supabaseAdmin, JOB_DATA_TABLE } from '../config/supabase';

export class DatabaseService {
  // Test basic connectivity to Supabase
  static async testConnectivity() {
    try {
      console.log('Testing Supabase connectivity...');
      console.log('Supabase URL:', process.env.SUPABASE_URL);
      console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      if (!process.env.SUPABASE_URL) {
        throw new Error('SUPABASE_URL environment variable is not set');
      }
      
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
      }

      // Test basic connectivity with a simple request
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      });

      if (response.ok) {
        console.log('✅ Supabase connectivity test passed');
        return true;
      } else {
        console.error('❌ Supabase connectivity test failed:', response.status, response.statusText);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Supabase connectivity test failed:', error.message);
      return false;
    }
  }

  // Check if table exists and create if it doesn't
  static async ensureTableExists() {
    try {
      if (!supabaseAdmin) {
        console.warn('Supabase admin client not available. Cannot create tables.');
        return false;
      }

      console.log('Checking if table exists:', JOB_DATA_TABLE);
      console.log('Supabase URL:', process.env.SUPABASE_URL);
      console.log('Service role key available:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);

      // First, try to query the table to see if it exists
      const { data, error } = await supabaseAdmin
        .from(JOB_DATA_TABLE)
        .select('id')
        .limit(1);

      // If table doesn't exist, we'll get an error
      if (error && (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist'))) {
        console.log('Table does not exist. Creating table:', JOB_DATA_TABLE);
        return await this.createTableWithSQL();
      } else if (error) {
        console.error('Error checking table existence:', error);
        throw error;
      }

      console.log('Table already exists:', JOB_DATA_TABLE);
      return true;
    } catch (error: any) {
      console.error('Error ensuring table exists:', error);
      
      // If it's a network error, assume table exists for development
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET') || error?.message?.includes('TypeError: fetch failed')) {
        console.warn('Network connectivity issue detected. This could be due to:');
        console.warn('1. Internet connection problems');
        console.warn('2. Incorrect Supabase URL');
        console.warn('3. Firewall blocking the connection');
        console.warn('4. Supabase service temporarily unavailable');
        console.warn('Assuming table exists for development. Server will continue to run.');
        return true;
      }
      
      throw error;
    }
  }

  // Create the job_applications table
  private static async createJobApplicationsTable() {
    try {
      if (!supabaseAdmin) {
        console.warn('Supabase admin client not available. Cannot create tables.');
        return false;
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${JOB_DATA_TABLE} (
          id SERIAL PRIMARY KEY,
          job_description TEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      const { error } = await supabaseAdmin.rpc('exec_sql', {
        sql: createTableSQL
      });

      if (error) {
        console.error('Error creating table:', error);
        throw error;
      }

      console.log('Table created successfully:', JOB_DATA_TABLE);
      return true;
    } catch (error: any) {
      console.error('Error creating job applications table:', error);
      
      // If it's a network error, assume success for development
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET')) {
        console.warn('Network connectivity issue detected. Assuming table creation successful for development.');
        return true;
      }
      
      throw error;
    }
  }

  // Alternative method using direct SQL execution
  static async createTableWithSQL() {
    try {
      if (!supabaseAdmin) {
        console.warn('Supabase admin client not available. Cannot create tables.');
        return false;
      }

      const createTableSQL = `
        CREATE TABLE IF NOT EXISTS ${JOB_DATA_TABLE} (
          id SERIAL PRIMARY KEY,
          job_description TEXT NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          company_name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `;

      // Try using the Supabase client's RPC function first
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: createTableSQL
        });

        if (error) {
          console.log('RPC method failed, trying direct SQL execution:', error.message);
          throw error;
        }

        console.log('Table created successfully via RPC:', JOB_DATA_TABLE);
        return true;
      } catch (rpcError) {
        console.log('RPC method not available, trying REST API approach...');
        
        // Fallback to REST API
        const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY || ''
          },
          body: JSON.stringify({
            sql: createTableSQL
          })
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error creating table via REST API:', errorText);
          throw new Error(`Failed to create table: ${errorText}`);
        }

        console.log('Table created successfully via REST API:', JOB_DATA_TABLE);
        return true;
      }
    } catch (error: any) {
      console.error('Error creating table with SQL:', error);
      
      // If it's a network error, assume success for development
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET')) {
        console.warn('Network connectivity issue detected. Assuming table creation successful for development.');
        return true;
      }
      
      throw error;
    }
  }
}
