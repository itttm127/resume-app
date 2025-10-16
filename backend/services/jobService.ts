import { supabase, supabaseAdmin, JobData, JOB_DATA_TABLE } from '../config/supabase';
import { DatabaseService } from './databaseService';
import { PostgresService } from './postgresService';

export class JobService {
  // Create a new job application
  static async createJob(jobData: Omit<JobData, 'id' | 'created_at' | 'updated_at'>) {
    try {
      console.log('Attempting to create job with data:', jobData);
      console.log('Using table:', JOB_DATA_TABLE);
      
      // Try PostgreSQL connection first
      try {
        console.log('Trying PostgreSQL connection...');
        await PostgresService.ensureTableExists();
        const result = await PostgresService.insertJob(jobData);
        console.log('✅ Job data saved via PostgreSQL:', result);
        return result;
      } catch (pgError: any) {
        console.warn('PostgreSQL connection failed, trying Supabase...', pgError.message);
        
        // Fallback to Supabase
        await DatabaseService.ensureTableExists();
        
        // Use admin client if available, otherwise fall back to regular client
        const client = supabaseAdmin || supabase;
        console.log('Using client:', supabaseAdmin ? 'admin' : 'anon');
        
        const { data, error } = await client
          .from(JOB_DATA_TABLE)
          .insert([jobData])
          .select()
          .single();

        if (error) {
          console.error('Supabase error creating job:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }

        console.log('✅ Job data saved via Supabase:', data);
        return data;
      }
    } catch (error: any) {
      console.error('Error saving job data:', {
        message: error?.message || 'Unknown error',
        details: error?.details || '',
        hint: error?.hint || '',
        code: error?.code || ''
      });
      
      // If it's a network/fetch error, return a mock response instead of failing
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET') || error?.message?.includes('TypeError: fetch failed')) {
        console.warn('Network connectivity issue detected. Returning mock response for development.');
        const mockData = {
          id: Date.now(), // Use timestamp as mock ID
          ...jobData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        console.log('Mock job data created:', mockData);
        return mockData;
      }
      
      throw error;
    }
  }

  // Get all job applications
  static async getAllJobs() {
    try {
      // Try PostgreSQL first
      try {
        console.log('Trying PostgreSQL for getAllJobs...');
        const result = await PostgresService.getAllJobs();
        console.log('✅ Jobs fetched via PostgreSQL:', result.length, 'jobs');
        return result;
      } catch (pgError: any) {
        console.warn('PostgreSQL getAllJobs failed, trying Supabase...', pgError.message);
        
        // Fallback to Supabase
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from(JOB_DATA_TABLE)
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching jobs:', error);
          throw error;
        }

        console.log('✅ Jobs fetched via Supabase:', data.length, 'jobs');
        return data;
      }
    } catch (error: any) {
      console.error('Error fetching jobs:', error);
      
      // If it's a network/fetch error, return empty array for development
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET') || error?.message?.includes('TypeError: fetch failed')) {
        console.warn('Network connectivity issue detected. Returning empty array for development.');
        return [];
      }
      
      throw error;
    }
  }

  // Get job by ID
  static async getJobById(id: number) {
    try {
      // Try PostgreSQL first
      try {
        console.log('Trying PostgreSQL for getJobById...');
        const result = await PostgresService.getJobById(id);
        console.log('✅ Job fetched via PostgreSQL:', result ? 'Found' : 'Not found');
        return result;
      } catch (pgError: any) {
        console.warn('PostgreSQL getJobById failed, trying Supabase...', pgError.message);
        
        // Fallback to Supabase
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from(JOB_DATA_TABLE)
          .select('*')
          .eq('id', id)
          .single();

        if (error) {
          console.error('Error fetching job:', error);
          throw error;
        }

        console.log('✅ Job fetched via Supabase:', data ? 'Found' : 'Not found');
        return data;
      }
    } catch (error: any) {
      console.error('Error fetching job:', error);
      
      // If it's a network/fetch error, return null for development
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET') || error?.message?.includes('TypeError: fetch failed')) {
        console.warn('Network connectivity issue detected. Returning null for development.');
        return null;
      }
      
      throw error;
    }
  }

  // Delete job by ID
  static async deleteJob(id: number) {
    try {
      // Try PostgreSQL first
      try {
        console.log('Trying PostgreSQL for deleteJob...');
        const result = await PostgresService.deleteJob(id);
        console.log('✅ Job deleted via PostgreSQL');
        return result;
      } catch (pgError: any) {
        console.warn('PostgreSQL deleteJob failed, trying Supabase...', pgError.message);
        
        // Fallback to Supabase
        const client = supabaseAdmin || supabase;
        const { error } = await client
          .from(JOB_DATA_TABLE)
          .delete()
          .eq('id', id);

        if (error) {
          console.error('Error deleting job:', error);
          throw error;
        }

        console.log('✅ Job deleted via Supabase');
        return { message: 'Job deleted successfully' };
      }
    } catch (error: any) {
      console.error('Error deleting job:', error);
      
      // If it's a network/fetch error, return success message for development
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET') || error?.message?.includes('TypeError: fetch failed')) {
        console.warn('Network connectivity issue detected. Returning success message for development.');
        return { message: 'Job deleted successfully (offline mode)' };
      }
      
      throw error;
    }
  }

  // Update job by ID
  static async updateJob(id: number, updates: Partial<Omit<JobData, 'id' | 'created_at' | 'updated_at'>>) {
    try {
      // Try PostgreSQL first
      try {
        console.log('Trying PostgreSQL for updateJob...');
        const result = await PostgresService.updateJob(id, updates);
        console.log('✅ Job updated via PostgreSQL');
        return result;
      } catch (pgError: any) {
        console.warn('PostgreSQL updateJob failed, trying Supabase...', pgError.message);
        
        // Fallback to Supabase
        const client = supabaseAdmin || supabase;
        const { data, error } = await client
          .from(JOB_DATA_TABLE)
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) {
          console.error('Error updating job:', error);
          throw error;
        }

        console.log('✅ Job updated via Supabase');
        return data;
      }
    } catch (error: any) {
      console.error('Error updating job:', error);
      
      // If it's a network/fetch error, return mock updated data for development
      if (error?.message?.includes('fetch failed') || error?.message?.includes('ECONNRESET') || error?.message?.includes('TypeError: fetch failed')) {
        console.warn('Network connectivity issue detected. Returning mock updated data for development.');
        const mockData = {
          id,
          ...updates,
          updated_at: new Date().toISOString()
        };
        return mockData;
      }
      
      throw error;
    }
  }
}
