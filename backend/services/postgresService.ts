import { Pool, Client } from 'pg';
import { dbConfig, JOB_DATA_TABLE } from '../config/supabase';

export class PostgresService {
  private static pool: Pool | null = null;

  // Initialize connection pool
  static async initializePool() {
    try {
      if (this.pool) {
        return this.pool;
      }

      console.log('Initializing PostgreSQL connection pool...');
      console.log('Connection config:', {
        host: dbConfig.host,
        port: dbConfig.port,
        database: dbConfig.database,
        user: dbConfig.user,
        password: dbConfig.password ? '***' : 'Not set',
        ssl: dbConfig.ssl,
        family: dbConfig.family
      });

      this.pool = new Pool(dbConfig);
      
      // Test the connection
      const client = await this.pool.connect();
      console.log('✅ PostgreSQL connection established successfully');
      
      // Test a simple query
      const result = await client.query('SELECT version()');
      console.log('PostgreSQL version:', result.rows[0].version);
      
      client.release();
      
      return this.pool;
    } catch (error: any) {
      console.error('❌ Failed to initialize PostgreSQL pool:', error.message);
      console.error('Error details:', {
        code: error.code,
        detail: error.detail,
        hint: error.hint,
        position: error.position
      });
      throw error;
    }
  }

  // Close the connection pool
  static async closePool() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('PostgreSQL connection pool closed');
    }
  }

  // Test basic connectivity
  static async testConnection() {
    try {
      console.log('Testing PostgreSQL connection...');
      const pool = await this.initializePool();
      const client = await pool.connect();
      
      const result = await client.query('SELECT NOW() as current_time');
      console.log('✅ PostgreSQL connection test successful:', result.rows[0]);
      
      client.release();
      return true;
    } catch (error: any) {
      console.error('❌ PostgreSQL connection test failed:', error.message);
      return false;
    }
  }

  // Check if table exists
  static async tableExists(tableName: string = JOB_DATA_TABLE) {
    try {
      const pool = await this.initializePool();
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        );
      `, [tableName]);
      
      client.release();
      return result.rows[0].exists;
    } catch (error: any) {
      console.error('Error checking table existence:', error.message);
      throw error;
    }
  }

  // Create the job_applications table
  static async createJobApplicationsTable() {
    try {
      const pool = await this.initializePool();
      const client = await pool.connect();
      
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

      await client.query(createTableSQL);
      console.log(`✅ Table '${JOB_DATA_TABLE}' created successfully`);
      
      client.release();
      return true;
    } catch (error: any) {
      console.error('Error creating table:', error.message);
      throw error;
    }
  }

  // Ensure table exists
  static async ensureTableExists(tableName: string = JOB_DATA_TABLE) {
    try {
      console.log(`Checking if table '${tableName}' exists...`);
      
      const exists = await this.tableExists(tableName);
      
      if (!exists) {
        console.log(`Table '${tableName}' does not exist. Creating it...`);
        await this.createJobApplicationsTable();
      } else {
        console.log(`✅ Table '${tableName}' already exists`);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error ensuring table exists:', error.message);
      throw error;
    }
  }

  // Insert job data
  static async insertJob(jobData: {
    job_description: string;
    file_name: string;
    company_name: string;
  }) {
    try {
      const pool = await this.initializePool();
      const client = await pool.connect();
      
      const result = await client.query(`
        INSERT INTO ${JOB_DATA_TABLE} (job_description, file_name, company_name)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [jobData.job_description, jobData.file_name, jobData.company_name]);
      
      client.release();
      return result.rows[0];
    } catch (error: any) {
      console.error('Error inserting job:', error.message);
      throw error;
    }
  }

  // Get all jobs
  static async getAllJobs() {
    try {
      const pool = await this.initializePool();
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT * FROM ${JOB_DATA_TABLE}
        ORDER BY created_at DESC
      `);
      
      client.release();
      return result.rows;
    } catch (error: any) {
      console.error('Error fetching jobs:', error.message);
      throw error;
    }
  }

  // Get job by ID
  static async getJobById(id: number) {
    try {
      const pool = await this.initializePool();
      const client = await pool.connect();
      
      const result = await client.query(`
        SELECT * FROM ${JOB_DATA_TABLE}
        WHERE id = $1
      `, [id]);
      
      client.release();
      return result.rows[0] || null;
    } catch (error: any) {
      console.error('Error fetching job:', error.message);
      throw error;
    }
  }

  // Update job
  static async updateJob(id: number, updates: {
    job_description?: string;
    file_name?: string;
    company_name?: string;
  }) {
    try {
      const pool = await this.initializePool();
      const client = await pool.connect();
      
      const setClause = Object.keys(updates)
        .map((key, index) => `${key} = $${index + 2}`)
        .join(', ');
      
      const values = Object.values(updates);
      const query = `
        UPDATE ${JOB_DATA_TABLE}
        SET ${setClause}, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await client.query(query, [id, ...values]);
      
      client.release();
      return result.rows[0];
    } catch (error: any) {
      console.error('Error updating job:', error.message);
      throw error;
    }
  }

  // Delete job
  static async deleteJob(id: number) {
    try {
      const pool = await this.initializePool();
      const client = await pool.connect();
      
      const result = await client.query(`
        DELETE FROM ${JOB_DATA_TABLE}
        WHERE id = $1
      `, [id]);
      
      client.release();
      return { message: 'Job deleted successfully' };
    } catch (error: any) {
      console.error('Error deleting job:', error.message);
      throw error;
    }
  }
}
