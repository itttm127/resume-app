import { config } from 'dotenv';

config();

export const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
export const mongoDbName = process.env.MONGODB_DB_NAME || 'resume_app';
export const JOB_DATA_COLLECTION = process.env.MONGODB_COLLECTION || 'job_applications';

export interface JobData {
  id?: string;
  job_description: string;
  file_name: string;
  company_name: string;
  created_at?: string;
  updated_at?: string;
}

export type JobInput = Omit<JobData, 'id' | 'created_at' | 'updated_at'>;

